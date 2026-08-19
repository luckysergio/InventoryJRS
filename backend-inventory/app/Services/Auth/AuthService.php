<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;

class AuthService
{
    private const CACHE_PREFIX = 'auth:user:';
    private const CACHE_TTL = 3600; // 1 jam

    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'role'     => 'operator',
        ]);

        $token = JWTAuth::fromUser($user);

        Log::info('User registered', ['id' => $user->id, 'email' => $user->email]);

        return [
            'user'  => $this->formatUser($user),
            'token' => $token,
        ];
    }

    public function login(array $data, string $rateLimiterKey): array
    {
        if (RateLimiter::tooManyAttempts($rateLimiterKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimiterKey);

            return [
                'success' => false,
                'code'    => 429,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . ceil($seconds / 60) . ' menit.',
            ];
        }

        $credentials = [
            'email'    => strtolower(trim($data['email'])),
            'password' => $data['password'],
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            RateLimiter::hit($rateLimiterKey, 600);
            usleep(random_int(300000, 700000));

            return [
                'success' => false,
                'code'    => 401,
                'message' => 'Email atau password salah.',
            ];
        }

        RateLimiter::clear($rateLimiterKey);

        $user = JWTAuth::user();

        $this->cacheUserData($user);

        Log::info('User logged in', ['id' => $user->id, 'email' => $user->email]);

        return [
            'success' => true,
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ];
    }

    public function profile(): ?array
    {
        $user = JWTAuth::user();
        
        if (!$user) {
            return null;
        }

        $cachedUser = $this->getCachedUserData($user->id);
        
        if ($cachedUser) {
            return $cachedUser;
        }

        $formattedUser = $this->formatUser($user);
        $this->cacheUserData($user);

        return $formattedUser;
    }

    public function logout(): void
    {
        try {
            $user = JWTAuth::user();
            
            if ($user) {
                $this->clearUserCache($user->id);
                
                Log::info('User logged out and cache cleared', ['user_id' => $user->id]);
            }

            JWTAuth::invalidate(JWTAuth::getToken());
            
        } catch (\Throwable $e) {
            Log::warning('JWT invalidate failed during logout', ['error' => $e->getMessage()]);
        }
    }

    public function refresh(): string
    {
        $oldToken = JWTAuth::getToken();
        $newToken = JWTAuth::refresh($oldToken);

        $user = JWTAuth::setToken($newToken)->authenticate();
        if ($user) {
            $this->cacheUserData($user);
        }

        return $newToken;
    }

    private function cacheUserData(User $user): void
    {
        $cacheKey = self::CACHE_PREFIX . $user->id;
        $userData = $this->formatUser($user);

        if (config('cache.default') === 'redis' || config('cache.default') === 'memcached') {
            Cache::tags(['user_data', "user:{$user->id}"])
                ->put($cacheKey, $userData, self::CACHE_TTL);
        } else {
            Cache::put($cacheKey, $userData, self::CACHE_TTL);
        }
    }

    private function getCachedUserData(int $userId): ?array
    {
        $cacheKey = self::CACHE_PREFIX . $userId;
        return Cache::get($cacheKey);
    }

    private function clearUserCache(int $userId): void
    {
        $cacheKey = self::CACHE_PREFIX . $userId;
        
        if (config('cache.default') === 'redis' || config('cache.default') === 'memcached') {
            Cache::tags(["user:{$userId}"])->flush();
        } else {
            Cache::forget($cacheKey);
        }
    }

    public static function invalidateAllUserCaches(): void
    {
        if (config('cache.default') === 'redis' || config('cache.default') === 'memcached') {
            Cache::tags(['user_data'])->flush();
        }
    }

    private function formatUser(User $user): array
    {
        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'role'       => $user->role ?? 'operator',
            'created_at' => $user->created_at?->toISOString(),
        ];
    }
}