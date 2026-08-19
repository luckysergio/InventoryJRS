<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use PHPOpenSourceSaver\JWTAuth\Exceptions\JWTException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenExpiredException;
use PHPOpenSourceSaver\JWTAuth\Exceptions\TokenInvalidException;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use Symfony\Component\HttpFoundation\Response;

class AutoRefreshToken
{
    private const REFRESH_THRESHOLD = 600; // 10 menit sebelum expired
    private const HEADER_REFRESHED = 'X-Token-Refreshed';
    private const HEADER_EXPIRES_IN = 'X-Token-Expires-In';

    public function handle(Request $request, Closure $next): Response
    {
        if ($request->headers->has(self::HEADER_REFRESHED)) {
            return $next($request);
        }

        if (!$this->hasAuthorizationHeader($request)) {
            return $next($request);
        }

        try {
            $token = $this->extractToken($request);
            
            if (empty($token)) {
                return $next($request);
            }

            $payload = JWTAuth::setToken($token)->getPayload();
            $exp = $payload->get('exp');
            $now = time();
            $timeLeft = $exp - $now;

            if ($timeLeft >= self::REFRESH_THRESHOLD) {
                return $next($request);
            }

            if ($timeLeft > 0 && $timeLeft < self::REFRESH_THRESHOLD) {
                return $this->refreshAndContinue($token, $request, $next);
            }

            return $this->expiredTokenResponse();

        } catch (TokenExpiredException $e) {
            return $this->expiredTokenResponse();
        } catch (TokenInvalidException $e) {
            return $this->unauthorizedResponse('Token tidak valid.');
        } catch (JWTException $e) {
            Log::warning('AutoRefresh: JWT error', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return $this->unauthorizedResponse('Gagal memproses token.');
        } catch (\Throwable $e) {
            Log::error('AutoRefresh: Unexpected error', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return $next($request);
        }
    }

    private function refreshAndContinue(string $oldToken, Request $request, Closure $next): Response
    {
        try {
            $newToken = JWTAuth::refresh($oldToken);

            $newPayload = JWTAuth::setToken($newToken)->getPayload();
            $newExp = $newPayload->get('exp');
            $newTtl = $newExp - time();

            $request->headers->set('Authorization', 'Bearer ' . $newToken);
            $request->headers->set(self::HEADER_REFRESHED, 'true');

            /** @var Response $response */
            $response = $next($request);

            $response->headers->set(self::HEADER_REFRESHED, 'true');
            $response->headers->set(self::HEADER_EXPIRES_IN, (string) $newTtl);
            $response->headers->set('Authorization', 'Bearer ' . $newToken);

            // Expose headers untuk CORS
            $response->headers->set('Access-Control-Expose-Headers', 
                'Authorization, ' . self::HEADER_REFRESHED . ', ' . self::HEADER_EXPIRES_IN
            );

            return $response;

        } catch (TokenExpiredException $e) {
            Log::warning('AutoRefresh: refresh token expired', [
                'ip' => $request->ip(),
            ]);
            return $this->expiredTokenResponse(true);
        } catch (JWTException $e) {
            Log::warning('AutoRefresh: refresh failed', [
                'error' => $e->getMessage(),
                'ip' => $request->ip(),
            ]);
            return $this->unauthorizedResponse('Gagal memperbarui token. Silakan login ulang.');
        }
    }

    private function extractToken(Request $request): ?string
    {
        $header = $request->header('Authorization', '');
        
        if (str_starts_with($header, 'Bearer ')) {
            return substr($header, 7);
        }

        return null;
    }

    private function hasAuthorizationHeader(Request $request): bool
    {
        return $request->hasHeader('Authorization');
    }

    private function expiredTokenResponse(bool $refreshExpired = false): Response
    {
        return response()->json([
            'status' => false,
            'message' => $refreshExpired 
                ? 'Refresh token sudah expired. Silakan login ulang.' 
                : 'Token sudah expired.',
            'code' => 'TOKEN_EXPIRED',
            'requires_relogin' => true,
        ], 401);
    }

    private function unauthorizedResponse(string $message): Response
    {
        return response()->json([
            'status' => false,
            'message' => $message,
        ], 401);
    }
}