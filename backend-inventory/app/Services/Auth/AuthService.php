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
        return $user ? $this->formatUser($user) : null;
    }

    public function logout(): void
    {
        try {
            JWTAuth::invalidate(JWTAuth::getToken());
        } catch (\Throwable $e) {
            Log::warning('JWT invalidate failed during logout', ['error' => $e->getMessage()]);
        }

        Cache::flush();

        Log::info('User logged out, all cache cleared');
    }

    public function refresh(): string
    {
        return JWTAuth::refresh(JWTAuth::getToken());
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