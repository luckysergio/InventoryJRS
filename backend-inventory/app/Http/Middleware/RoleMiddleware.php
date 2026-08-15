<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  string  ...$roles  Daftar role yang diizinkan
     */
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (empty($roles)) {
            return $this->forbiddenResponse('Role tidak didefinisikan untuk route ini.');
        }

        try {
            $user = JWTAuth::parseToken()->authenticate();
        } catch (TokenExpiredException $e) {
            return $this->unauthorizedResponse('Token sudah expired.', 401);
        } catch (TokenInvalidException $e) {
            return $this->unauthorizedResponse('Token tidak valid.', 401);
        } catch (JWTException $e) {
            return $this->unauthorizedResponse('Token tidak ditemukan.', 401);
        } catch (\Throwable $e) {
            return $this->unauthorizedResponse('Gagal memproses token.', 401);
        }

        if (!$user) {
            return $this->unauthorizedResponse('User tidak terautentikasi.');
        }

        $userRole = $user->role;
        if (empty($userRole)) {
            return $this->forbiddenResponse('User tidak memiliki role.');
        }

        if (!in_array($userRole, $roles, true)) {
            return $this->forbiddenResponse(sprintf(
                'Role "%s" tidak diizinkan. Diperlukan salah satu dari: %s',
                $userRole,
                implode(', ', $roles)
            ));
        }

        return $next($request);
    }

    private function unauthorizedResponse(string $message, int $code = 401): Response
    {
        return response()->json([
            'status' => false,
            'message' => $message,
        ], $code);
    }

    private function forbiddenResponse(string $message): Response
    {
        return response()->json([
            'status' => false,
            'message' => $message,
        ], 403);
    }
}