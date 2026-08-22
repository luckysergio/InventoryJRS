<?php

declare(strict_types=1);

namespace App\Services\Auth;

use App\Events\LoginLogged;
use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use ReCaptcha\ReCaptcha;

class AuthService
{
    private const CACHE_PREFIX = 'auth:user:';
    private const CACHE_TTL = 3600;
    private const RECAPTCHA_MIN_SCORE = 0.5;

    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => strtolower(trim($data['email'])),
            'password' => Hash::make($data['password']),
            'role'     => 'operator',
        ]);

        $token = JWTAuth::fromUser($user);

        $log = LoginLog::create([
            'user_id'        => $user->id,
            'email'          => $user->email,
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->userAgent(),
            'success'        => true,
            'failure_reason' => 'Account registered',
        ]);

        $this->broadcastLoginEvent($log);

        Log::info('User registered', ['id' => $user->id, 'email' => $user->email]);

        return [
            'user'  => $this->formatUser($user),
            'token' => $token,
        ];
    }

    public function login(array $data, string $rateLimiterKey): array
    {
        $email = strtolower(trim($data['email']));
        $recaptchaToken = $data['g-recaptcha-response'] ?? null;

        $recaptchaResult = $this->verifyRecaptcha($recaptchaToken);
        if (!$recaptchaResult['success']) {
            $log = $this->createLoginLog($email, false, 'reCAPTCHA failed: ' . $recaptchaResult['reason']);
            $this->broadcastLoginEvent($log);
            
            return [
                'success' => false,
                'code'    => 400,
                'message' => 'Verifikasi keamanan gagal. Silakan refresh halaman dan coba lagi.',
            ];
        }

        if (RateLimiter::tooManyAttempts($rateLimiterKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimiterKey);
            $log = $this->createLoginLog($email, false, 'Rate limit exceeded');
            $this->broadcastLoginEvent($log);

            return [
                'success' => false,
                'code'    => 429,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . ceil($seconds / 60) . ' menit.',
            ];
        }

        $credentials = [
            'email'    => $email,
            'password' => $data['password'],
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            RateLimiter::hit($rateLimiterKey, 600);
            $log = $this->createLoginLog($email, false, 'Invalid credentials');
            $this->broadcastLoginEvent($log);
            
            usleep(random_int(300000, 700000));

            return [
                'success' => false,
                'code'    => 401,
                'message' => 'Email atau password salah.',
            ];
        }

        RateLimiter::clear($rateLimiterKey);
        $user = JWTAuth::user();

        $log = $this->createLoginLog($email, true, null, $user->id);
        $this->broadcastLoginEvent($log);
        
        $this->cacheUserData($user);

        Log::info('User logged in', [
            'id'    => $user->id, 
            'email' => $user->email,
            'ip'    => request()->ip(),
        ]);

        return [
            'success' => true,
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ];
    }

    private function createLoginLog(
        string $email,
        bool $success,
        ?string $reason = null,
        ?int $userId = null
    ): LoginLog {
        try {
            return LoginLog::create([
                'user_id'        => $userId,
                'email'          => $email,
                'ip_address'     => request()->ip(),
                'user_agent'     => request()->userAgent(),
                'success'        => $success,
                'failure_reason' => $reason,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to save login log', ['error' => $e->getMessage()]);
            return new LoginLog([
                'id' => null,
                'email' => $email,
                'ip_address' => request()->ip(),
                'success' => $success,
                'failure_reason' => $reason,
                'created_at' => now(),
            ]);
        }
    }

    private function broadcastLoginEvent(LoginLog $log): void
{
    try {
        broadcast(new LoginLogged($log));
        
        app(\App\Services\Dashboard\DashboardService::class)->invalidateLoginStats();
        
        Log::info('Login event broadcasted', [
            'email' => $log->email,
            'success' => $log->success,
        ]);
    } catch (\Throwable $e) {
        Log::warning('Failed to broadcast login event', [
            'email' => $log->email,
            'error' => $e->getMessage(),
        ]);
    }
}

    private function verifyRecaptcha(?string $token): array
    {
        if (empty($token)) {
            return ['success' => false, 'reason' => 'Token missing'];
        }

        try {
            $recaptcha = new ReCaptcha(config('services.recaptcha.secret_key'));

            $response = $recaptcha->setExpectedAction('login')
                                  ->verify($token, request()->ip());

            if (!$response->isSuccess()) {
                $errorCodes = $response->getErrorCodes();
                $reason = $errorCodes ? implode(', ', $errorCodes) : 'Verification failed';
                return ['success' => false, 'reason' => $reason];
            }

            $score = $response->getScore();
            
            if ($score < self::RECAPTCHA_MIN_SCORE) {
                return [
                    'success' => false, 
                    'reason'  => "Low reCAPTCHA score: {$score}"
                ];
            }

            return ['success' => true, 'score' => $score];
            
        } catch (\Exception $e) {
            Log::error('reCAPTCHA verification error', ['error' => $e->getMessage()]);
            return ['success' => false, 'reason' => 'reCAPTCHA service connection error'];
        }
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
                Log::info('User logged out', [
                    'user_id' => $user->id,
                    'email'   => $user->email,
                    'ip'      => request()->ip(),
                ]);

                $this->clearUserCache($user->id);
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

        if (in_array(config('cache.default'), ['redis', 'memcached'])) {
            Cache::tags(['user_data', "user:{$user->id}"])
                ->put($cacheKey, $userData, self::CACHE_TTL);
        } else {
            Cache::put($cacheKey, $userData, self::CACHE_TTL);
        }
    }

    private function getCachedUserData(int $userId): ?array
    {
        return Cache::get(self::CACHE_PREFIX . $userId);
    }

    private function clearUserCache(int $userId): void
    {
        $cacheKey = self::CACHE_PREFIX . $userId;
        
        if (in_array(config('cache.default'), ['redis', 'memcached'])) {
            Cache::tags(["user:{$userId}"])->flush();
        } else {
            Cache::forget($cacheKey);
        }
    }

    public static function invalidateAllUserCaches(): void
    {
        if (in_array(config('cache.default'), ['redis', 'memcached'])) {
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