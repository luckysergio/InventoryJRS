<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Carbon;

class LoginLog extends Model
{
    protected $fillable = [
        'user_id',
        'email',
        'ip_address',
        'user_agent',
        'success',
        'failure_reason',
    ];

    protected $casts = [
        'success'    => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeSuccessful(Builder $query): Builder
    {
        return $query->where('success', true);
    }

    public function scopeFailed(Builder $query): Builder
    {
        return $query->where('success', false);
    }

    public function scopeByEmail(Builder $query, string $email): Builder
    {
        return $query->where('email', 'like', '%' . strtolower(trim($email)) . '%');
    }

    public function scopeByIp(Builder $query, string $ip): Builder
    {
        return $query->where('ip_address', $ip);
    }

    public function scopeBySuccess(Builder $query, ?string $success): Builder
    {
        return $query->when($success === 'true' || $success === '1', fn($q) => $q->where('success', true))
                     ->when($success === 'false' || $success === '0', fn($q) => $q->where('success', false));
    }

    public function scopeDateRange(Builder $query, ?string $start = null, ?string $end = null): Builder
    {
        return $query
            ->when($start, fn($q) => $q->where('created_at', '>=', $start))
            ->when($end, fn($q) => $q->where('created_at', '<=', $end));
    }

    public function scopePeriod(Builder $query, string $period, ?string $from = null, ?string $to = null): Builder
    {
        $now = Carbon::now();

        [$start, $end] = match ($period) {
            'daily'   => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
            'weekly'  => [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()],
            'monthly' => [$now->copy()->startOfMonth(), $now->copy()->endOfMonth()],
            'yearly'  => [$now->copy()->startOfYear(), $now->copy()->endOfYear()],
            'custom'  => [
                $from ? Carbon::parse($from)->startOfDay() : $now->copy()->startOfMonth(),
                $to ? Carbon::parse($to)->endOfDay() : $now->copy()->endOfDay(),
            ],
            'all'     => [Carbon::createFromTimestamp(0), $now->copy()->endOfDay()],
            default   => [$now->copy()->startOfDay(), $now->copy()->endOfDay()],
        };

        return $query->whereBetween('created_at', [$start, $end]);
    }

    public function scopeSuspiciousActivity(Builder $query, int $threshold = 5): Builder
    {
        return $query->failed()
            ->groupBy('ip_address')
            ->havingRaw('COUNT(*) >= ?', [$threshold])
            ->select('ip_address')
            ->selectRaw('COUNT(*) as attempt_count')
            ->selectRaw('MAX(created_at) as last_attempt')
            ->orderByDesc('attempt_count');
    }

    public static function logAttempt(
        string $email,
        bool $success,
        ?string $reason = null,
        ?int $userId = null
    ): self {
        return self::create([
            'user_id'        => $userId,
            'email'          => strtolower(trim($email)),
            'ip_address'     => request()->ip(),
            'user_agent'     => request()->userAgent(),
            'success'        => $success,
            'failure_reason' => $reason,
        ]);
    }

    public function getBrowserAttribute(): string
    {
        if (!$this->user_agent) return 'Unknown';

        $ua = strtolower($this->user_agent);

        return match (true) {
            str_contains($ua, 'edg')     => 'Microsoft Edge',
            str_contains($ua, 'chrome')  => 'Chrome',
            str_contains($ua, 'firefox') => 'Firefox',
            str_contains($ua, 'safari')  => 'Safari',
            str_contains($ua, 'opera')   => 'Opera',
            default                      => 'Other',
        };
    }

    public function getOsAttribute(): string
    {
        if (!$this->user_agent) return 'Unknown';

        $ua = strtolower($this->user_agent);

        return match (true) {
            str_contains($ua, 'windows') => 'Windows',
            str_contains($ua, 'mac')     => 'macOS',
            str_contains($ua, 'linux')   => 'Linux',
            str_contains($ua, 'android') => 'Android',
            str_contains($ua, 'iphone'),
            str_contains($ua, 'ipad')    => 'iOS',
            default                      => 'Other',
        };
    }

    public function getDeviceAttribute(): string
    {
        if (!$this->user_agent) return 'Unknown';

        $ua = strtolower($this->user_agent);

        return match (true) {
            str_contains($ua, 'mobile'),
            str_contains($ua, 'android'),
            str_contains($ua, 'iphone')  => 'Mobile',
            str_contains($ua, 'ipad'),
            str_contains($ua, 'tablet')  => 'Tablet',
            default                      => 'Desktop',
        };
    }
}