<?php

namespace App\Services\Auth;

use App\Models\User;
use App\Models\LoginLog;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use PHPOpenSourceSaver\JWTAuth\Facades\JWTAuth;
use ReCaptcha\ReCaptcha; // ✅ Import package resmi Google

class AuthService
{
    private const CACHE_PREFIX = 'auth:user:';
    private const CACHE_TTL = 3600; // 1 jam
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

        LoginLog::create([
            'user_id'        => $user->id,
            'email'          => $user->email,
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->userAgent(),
            'success'        => true,
            'failure_reason' => 'Account registered',
        ]);

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

        // 1. Verify reCAPTCHA v3
        $recaptchaResult = $this->verifyRecaptcha($recaptchaToken);
        if (!$recaptchaResult['success']) {
            $this->logLoginAttempt($email, false, 'reCAPTCHA failed: ' . $recaptchaResult['reason']);
            
            return [
                'success' => false,
                'code'    => 400,
                'message' => 'Verifikasi keamanan gagal. Silakan refresh halaman dan coba lagi.',
            ];
        }

        // 2. Check Rate Limiter
        if (RateLimiter::tooManyAttempts($rateLimiterKey, 5)) {
            $seconds = RateLimiter::availableIn($rateLimiterKey);
            $this->logLoginAttempt($email, false, 'Rate limit exceeded');

            return [
                'success' => false,
                'code'    => 429,
                'message' => 'Terlalu banyak percobaan login. Coba lagi dalam ' . ceil($seconds / 60) . ' menit.',
            ];
        }

        // 3. Attempt Authentication
        $credentials = [
            'email'    => $email,
            'password' => $data['password'],
        ];

        if (!$token = JWTAuth::attempt($credentials)) {
            RateLimiter::hit($rateLimiterKey, 600);
            $this->logLoginAttempt($email, false, 'Invalid credentials');
            
            // Security: Random delay to prevent timing attacks
            usleep(random_int(300000, 700000));

            return [
                'success' => false,
                'code'    => 401,
                'message' => 'Email atau password salah.',
            ];
        }

        // 4. Success
        RateLimiter::clear($rateLimiterKey);
        $user = JWTAuth::user();

        $this->logLoginAttempt($email, true, null, $user->id);
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

    /**
     * Verify reCAPTCHA v3 token using Google's official package
     */
    private function verifyRecaptcha(?string $token): array
    {
        if (empty($token)) {
            return ['success' => false, 'reason' => 'Token missing'];
        }

        try {
            // Inisialisasi dengan Secret Key dari config
            $recaptcha = new ReCaptcha(config('services.recaptcha.secret_key'));

            // Verifikasi token dan IP address user
            $response = $recaptcha->setExpectedAction('login')
                                  ->verify($token, request()->ip());

            if (!$response->isSuccess()) {
                $errorCodes = $response->getErrorCodes();
                $reason = $errorCodes ? implode(', ', $errorCodes) : 'Verification failed';
                return ['success' => false, 'reason' => $reason];
            }

            $score = $response->getScore();
            
            // Check score threshold
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

    /**
     * Log login attempt to database
     */
    private function logLoginAttempt(
        string $email,
        bool $success,
        ?string $reason = null,
        ?int $userId = null
    ): void {
        try {
            LoginLog::create([
                'user_id'        => $userId,
                'email'          => $email,
                'ip_address'     => request()->ip(),
                'user_agent'     => request()->userAgent(),
                'success'        => $success,
                'failure_reason' => $reason,
            ]);
        } catch (\Throwable $e) {
            Log::error('Failed to save login log', ['error' => $e->getMessage()]);
            // Don't throw - logging failure shouldn't break login flow
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