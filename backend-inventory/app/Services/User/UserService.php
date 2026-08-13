<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;

class UserService
{
    private const CACHE_TTL_LIST   = 300;
    private const CACHE_TTL_DETAIL = 900;
    private const CACHE_INDEX_KEY  = 'users:cache:index';

    public function getList(?string $search = null, int $perPage = 10): LengthAwarePaginator
    {
        $cacheKey = $this->getListCacheKey($search, $perPage, request()->get('page', 1));

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $cacheKey) {
            $this->registerCacheKey($cacheKey);

            return User::select(['id', 'name', 'email', 'role', 'created_at'])
                ->search($search)
                ->orderByDesc('created_at')
                ->paginate($perPage);
        });
    }

    public function getDetail(int $id): ?User
    {
        $cacheKey = $this->getDetailCacheKey($id);

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->registerCacheKey($cacheKey);

            return User::select(['id', 'name', 'email', 'role', 'created_at'])->find($id);
        });
    }

    public function create(array $data): User
    {
        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => Hash::make($data['password']),
            'role'     => $data['role'],
        ]);

        $this->clearListCache();

        return $user;
    }

    public function update(User $user, array $data): User
    {
        $updateData = collect($data)->only(['name', 'email', 'role'])->toArray();

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        $user->update($updateData);

        $this->clearListCache();
        $this->clearDetailCache($user->id);

        return $user->fresh();
    }

    public function delete(User $user, User $currentUser): array
    {
        if ($currentUser->id === $user->id) {
            return [
                'success' => false,
                'code'    => 403,
                'message' => 'Tidak bisa menghapus akun sendiri.',
            ];
        }

        $userId = $user->id;
        $user->delete();

        $this->clearListCache();
        $this->clearDetailCache($userId);

        return [
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ];
    }

    private function getListCacheKey(?string $search, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        return "users:list:search:{$searchHash}:per_page:{$perPage}:page:{$page}";
    }

    private function getDetailCacheKey(int $id): string
    {
        return "users:detail:{$id}";
    }

    private function registerCacheKey(string $cacheKey): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (!is_array($keys)) {
            $keys = [];
        }

        if (!in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            Cache::put(self::CACHE_INDEX_KEY, $keys, 86400);
        }
    }

    private function clearAllRegisteredCache(): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (is_array($keys) && !empty($keys)) {
            foreach ($keys as $key) {
                Cache::forget($key);
            }
        }

        Cache::forget(self::CACHE_INDEX_KEY);
    }

    private function clearListCache(): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);

        if (is_array($keys)) {
            $remainingKeys = [];

            foreach ($keys as $key) {
                if (str_starts_with($key, 'users:list:')) {
                    Cache::forget($key);
                } else {
                    $remainingKeys[] = $key;
                }
            }

            Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, 86400);
        }
    }

    private function clearDetailCache(int $id): void
    {
        $cacheKey = $this->getDetailCacheKey($id);
        Cache::forget($cacheKey);

        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (is_array($keys)) {
            $keys = array_values(array_filter($keys, fn($k) => $k !== $cacheKey));
            Cache::put(self::CACHE_INDEX_KEY, $keys, 86400);
        }
    }
}