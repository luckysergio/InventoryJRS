<?php

namespace App\Http\Controllers\api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Services\Auth\AuthService;
use Illuminate\Http\JsonResponse;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * Registrasi user baru
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register($request->validated());

        return response()->json([
            'status'  => true,
            'message' => 'Registrasi berhasil.',
            'user'    => $result['user'],
            'token'   => $result['token'],
        ], 201);
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            data: $request->validated(),
            ip: $request->ip(),
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
            'user'    => $result['user'],
            'token'   => $result['token'],
        ]);
    }

    /**
     * Ambil profil user yang sedang login
     */
    public function profile(): JsonResponse
    {
        $user = $this->authService->profile();

        return response()->json([
            'status' => true,
            'user'   => $user,
        ]);
    }

    /**
     * Logout user
     */
    public function logout(): JsonResponse
    {
        $this->authService->logout();

        return response()->json([
            'status'  => true,
            'message' => 'Logout berhasil.',
        ]);
    }

    /**
     * Refresh token JWT
     */
    public function refresh(): JsonResponse
    {
        $token = $this->authService->refresh();

        return response()->json([
            'status' => true,
            'token'  => $token,
        ]);
    }
}