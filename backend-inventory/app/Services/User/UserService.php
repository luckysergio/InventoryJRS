<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class UserService
{
    private const CACHE_LIST_PREFIX = 'users:list:';
    private const CACHE_DETAIL_PREFIX = 'users:detail:';
    private const CACHE_INDEX_KEY = 'users:cache:index';
    
    private const CACHE_TTL_LIST = 300;      // 5 menit
    private const CACHE_TTL_DETAIL = 900;    // 15 menit
    private const CACHE_TTL_INDEX = 86400;   // 24 jam

    public function getList(?string $search = null, int $perPage = 10, int $page = 1): LengthAwarePaginator
    {
        $cacheKey = $this->buildListCacheKey($search, $perPage, $page);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $cacheKey) {
            $this->trackCacheKey($cacheKey);

            return User::select(['id', 'name', 'email', 'role', 'created_at'])
                ->search($search)
                ->orderByDesc('created_at')
                ->paginate($perPage);
        });
    }

    public function getDetail(int $id): ?User
    {
        $cacheKey = self::CACHE_DETAIL_PREFIX . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id, $cacheKey) {
            $this->trackCacheKey($cacheKey);
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

        $this->invalidateAllCache();
        Log::info('User created', ['id' => $user->id, 'email' => $user->email]);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        if (!$user->exists) {
            throw new \Exception("Gagal update: User model tidak valid atau tidak ditemukan.");
        }

        $updateData = collect($data)->only(['name', 'email', 'role'])->toArray();

        if (!empty($data['password'])) {
            $updateData['password'] = Hash::make($data['password']);
        }

        if (!empty($updateData)) {
            $user->update($updateData);
        }

        $this->invalidateAllCache($user->id);

        Log::info('User updated', ['id' => $user->id, 'name' => $user->name]);

        return $user->refresh();
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

        $this->invalidateAllCache($userId);
        Log::info('User deleted', ['id' => $userId]);

        return [
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ];
    }

    private function buildListCacheKey(?string $search, int $perPage, int $page): string
    {
        $searchHash = $search ? md5($search) : 'all';
        return self::CACHE_LIST_PREFIX . "{$searchHash}:{$perPage}:{$page}";
    }

    private function trackCacheKey(string $cacheKey): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys)) {
            $keys = [];
        }

        if (!in_array($cacheKey, $keys, true)) {
            $keys[] = $cacheKey;
            Cache::put(self::CACHE_INDEX_KEY, $keys, self::CACHE_TTL_INDEX);
        }
    }

    private function invalidateAllCache(?int $userId = null): void
    {
        $keys = Cache::get(self::CACHE_INDEX_KEY, []);
        if (!is_array($keys) || empty($keys)) {
            return;
        }

        $remainingKeys = [];
        $detailCacheKey = $userId ? self::CACHE_DETAIL_PREFIX . $userId : null;

        foreach ($keys as $key) {
            $isListCache = str_starts_with($key, self::CACHE_LIST_PREFIX);
            $isTargetDetail = $detailCacheKey && $key === $detailCacheKey;

            if ($isListCache || $isTargetDetail) {
                Cache::forget($key);
            } else {
                $remainingKeys[] = $key;
            }
        }

        Cache::put(self::CACHE_INDEX_KEY, $remainingKeys, self::CACHE_TTL_INDEX);
    }
}