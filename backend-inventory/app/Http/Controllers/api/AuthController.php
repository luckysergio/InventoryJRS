<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    public function register(RegisterRequest $request): JsonResponse
    {
        try {
            $result = $this->authService->register($request->validated());

            return response()->json([
                'status'  => true,
                'message' => 'Registrasi berhasil.',
                'data'    => [
                    'user'  => $result['user'],
                    'token' => $result['token'],
                ],
            ], 201);
        } catch (\Throwable $e) {
            Log::error('Register error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal melakukan registrasi.',
            ], 500);
        }
    }

    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            data: $request->validated(),
            rateLimiterKey: $request->rateLimiterKey()
        );

        if (!$result['success']) {
            return response()->json([
                'status'  => false,
                'message' => $result['message'],
            ], $result['code']);
        }

        return response()->json([
            'status'  => true,
            'message' => 'Login berhasil.',
            'data'    => [
                'user'  => $result['user'],
                'token' => $result['token'],
            ],
        ]);
    }

    public function profile(): JsonResponse
    {
        try {
            $user = $this->authService->profile();

            if (!$user) {
                return response()->json([
                    'status'  => false,
                    'message' => 'User tidak ditemukan.',
                ], 401);
            }

            return response()->json([
                'status' => true,
                'data'   => ['user' => $user],
            ]);
        } catch (\Throwable $e) {
            Log::error('Profile error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal memuat profil.',
            ], 500);
        }
    }

    public function logout(): JsonResponse
    {
        try {
            $this->authService->logout();

            return response()->json([
                'status'  => true,
                'message' => 'Logout berhasil.',
            ]);
        } catch (\Throwable $e) {
            Log::error('Logout error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal melakukan logout.',
            ], 500);
        }
    }

    public function refresh(): JsonResponse
    {
        try {
            $token = $this->authService->refresh();

            return response()->json([
                'status' => true,
                'data'   => ['token' => $token],
            ]);
        } catch (\Throwable $e) {
            Log::error('Token refresh error', ['error' => $e->getMessage()]);
            return response()->json([
                'status'  => false,
                'message' => 'Gagal me-refresh token. Silakan login ulang.',
            ], 401);
        }
    }
}