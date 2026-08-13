<?php

namespace App\Services\Auth;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpKernel\Exception\UnauthorizedHttpException;

class AuthService
{
    /**
     * Registrasi user baru
     */
    public function register(array $data): array
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $token = JWTAuth::fromUser($user);

        return [
            'user'  => $user,
            'token' => $token,
        ];
    }

    /**
     * Login user dengan rate limiting
     */
    public function login(array $data, string $ip, string $rateLimiterKey): array
    {
        // Cek rate limiter
        if (RateLimiter::tooManyAttempts($rateLimiterKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimiterKey);

            return [
                'success' => false,
                'code'    => 429,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . ceil($seconds / 60) . ' menit.',
            ];
        }

        $credentials = [
            'email'    => $data['email'],
            'password' => $data['password'],
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            RateLimiter::hit($rateLimiterKey, 600);

            // Delay untuk mencegah brute force
            usleep(500000);

            return [
                'success' => false,
                'code'    => 422,
                'message' => 'Email atau password salah.',
            ];
        }

        RateLimiter::clear($rateLimiterKey);

        $user = JWTAuth::user();

        return [
            'success' => true,
            'user'    => $user,
            'token'   => $token,
        ];
    }

    /**
     * Ambil profil user yang sedang login
     */
    public function profile(): ?User
    {
        return JWTAuth::user();
    }

    /**
     * Logout / invalidate token
     */
    public function logout(): void
    {
        JWTAuth::invalidate(JWTAuth::getToken());
    }

    /**
     * Refresh token JWT
     */
    public function refresh(): string
    {
        return JWTAuth::refresh(JWTAuth::getToken());
    }
}