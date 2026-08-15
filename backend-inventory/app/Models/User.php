<?php

namespace App\Models;

use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use PHPOpenSourceSaver\JWTAuth\Contracts\JWTSubject;
use Illuminate\Contracts\Auth\CanResetPassword;
use Illuminate\Auth\Passwords\CanResetPassword as CanResetPasswordTrait;

class User extends Authenticatable implements JWTSubject, CanResetPassword
{
    use Notifiable, CanResetPasswordTrait;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    public function getJWTIdentifier(): mixed
    {
        return $this->getKey();
    }

    public function getJWTCustomClaims(): array
    {
        return [];
    }

    public function sendPasswordResetNotification($token): void
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles, true);
    }

    public function isAdmin(): bool 
    { 
        return $this->hasRole('admin'); 
    }

    public function isAdminToko(): bool 
    { 
        return $this->hasRole('admin_toko'); 
    }

    public function isOperator(): bool 
    { 
        return $this->hasRole('operator'); 
    }

    public function scopeAdmins(Builder $query): Builder
    {
        return $query->where('role', 'admin');
    }

    public function scopeAdminToko(Builder $query): Builder
    {
        return $query->where('role', 'admin_toko');
    }

    public function scopeOperators(Builder $query): Builder
    {
        return $query->where('role', 'operator');
    }

    public function scopeSearch(Builder $query, ?string $search): Builder
    {
        return $query->when($search, function ($q) use ($search) {
            $driver = config('database.connections.' . config('database.default') . '.driver');
            
            if ($driver === 'mysql') {
                $q->whereRaw(
                    "MATCH(name, email) AGAINST(? IN BOOLEAN MODE)",
                    [$search . '*']
                );
            } else {
                $likeValue = "%{$search}%";
                $q->where(function ($sub) use ($likeValue) {
                    $sub->where('name', 'like', $likeValue)
                        ->orWhere('email', 'like', $likeValue);
                });
            }
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNotNull('email_verified_at');
    }
}