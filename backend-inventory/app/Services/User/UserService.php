<?php

namespace App\Services\User;

use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Pagination\LengthAwarePaginator as ConcretePaginator;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UserService
{
    private const CACHE_LIST_PREFIX = 'users:list:v';
    private const CACHE_DETAIL_PREFIX = 'users:detail:v';
    private const CACHE_VERSION_KEY = 'users:cache:version';
    private const CACHE_VERSION_LOCK = 'users:cache:version:lock';

    private const CACHE_TTL_LIST = 300;   // 5 menit
    private const CACHE_TTL_DETAIL = 900; // 15 menit
    private const CACHE_TTL_STATS = 300;  // 5 menit

    /**
     * Get paginated user list.
     * Returns array instead of Paginator for cache-friendly serialization.
     *
     * @return array{data: array<int, array<string, mixed>>, meta: array<string, int|null>}
     */
    public function getList(
        ?string $search = null,
        int $perPage = 10,
        int $page = 1,
        ?string $role = null
    ): array {
        $version = $this->getCacheVersion();
        $cacheKey = $this->buildListCacheKey($version, $search, $perPage, $page, $role);

        return Cache::remember($cacheKey, self::CACHE_TTL_LIST, function () use ($search, $perPage, $role): array {
            $query = User::select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])
                ->search($search)
                ->when($role, fn($q) => $q->where('role', $role))
                ->orderByDesc('created_at');

            /** @var ConcretePaginator $paginator */
            $paginator = $query->paginate($perPage);

            return $this->formatPaginator($paginator);
        });
    }

    public function getDetail(int $id): ?array
    {
        $version = $this->getCacheVersion();
        $cacheKey = self::CACHE_DETAIL_PREFIX . $version . ':' . $id;

        return Cache::remember($cacheKey, self::CACHE_TTL_DETAIL, function () use ($id): ?array {
            $user = User::select(['id', 'name', 'email', 'role', 'created_at', 'updated_at'])->find($id);

            if (!$user) {
                return null;
            }

            return $user->only(['id', 'name', 'email', 'role', 'created_at', 'updated_at']);
        });
    }

    public function create(array $data): User
    {
        return DB::transaction(function () use ($data): User {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => $data['role'],
            ]);

            $this->invalidateCache();

            Log::info('User created', [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'created_by' => Auth::id(),
            ]);

            return $user;
        });
    }

    public function update(User $user, array $data): User
    {
        return DB::transaction(function () use ($user, $data): User {
            $updateData = collect($data)
                ->only(['name', 'email', 'role'])
                ->filter()
                ->toArray();

            if (!empty($data['password'])) {
                $updateData['password'] = $data['password'];
            }

            if (!empty($updateData)) {
                $user->update($updateData);
            }

            $this->invalidateCache();

            Log::info('User updated', [
                'id' => $user->id,
                'changes' => array_keys($updateData),
                'updated_by' => Auth::id(),
            ]);

            return $user->fresh();
        });
    }

    /**
     * Delete user with authorization checks.
     *
     * @return array{success: bool, code?: int, message: string}
     */
    public function delete(User $user, User $currentUser): array
    {
        if ($currentUser->id === $user->id) {
            return [
                'success' => false,
                'code' => 403,
                'message' => 'Tidak bisa menghapus akun sendiri.',
            ];
        }

        if ($user->isAdmin()) {
            return [
                'success' => false,
                'code' => 403,
                'message' => 'Admin tidak bisa dihapus.',
            ];
        }

        if (!$currentUser->isAdmin()) {
            return [
                'success' => false,
                'code' => 403,
                'message' => 'Anda tidak memiliki izin untuk menghapus user.',
            ];
        }

        DB::transaction(function () use ($user): void {
            $user->delete();
            $this->invalidateCache();

            Log::info('User deleted', [
                'id' => $user->id,
                'email' => $user->email,
                'deleted_by' => Auth::id(),
            ]);
        });

        return [
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ];
    }

    public function getCountByRole(): array
    {
        return Cache::remember('users:count:by_role', self::CACHE_TTL_STATS, function (): array {
            return User::selectRaw('role, COUNT(*) as count')
                ->groupBy('role')
                ->pluck('count', 'role')
                ->map(fn($count) => (int) $count)
                ->toArray();
        });
    }

    private function getCacheVersion(): int
    {
        return (int) Cache::get(self::CACHE_VERSION_KEY, 1);
    }

    private function invalidateCache(): void
    {
        $lock = Cache::lock(self::CACHE_VERSION_LOCK, 5);

        try {
            $lock->block(3, function (): void {
                $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
                Cache::forever(self::CACHE_VERSION_KEY, $current + 1);
            });
        } catch (\Throwable $e) {
            $current = (int) Cache::get(self::CACHE_VERSION_KEY, 1);
            Cache::forever(self::CACHE_VERSION_KEY, $current + 1);

            Log::warning('Cache invalidation lock failed, used fallback', [
                'error' => $e->getMessage(),
            ]);
        }
    }

    private function buildListCacheKey(
        int $version,
        ?string $search,
        int $perPage,
        int $page,
        ?string $role = null
    ): string {
        $searchHash = $search ? md5($search) : 'all';
        $roleKey = $role ?? 'all';

        return self::CACHE_LIST_PREFIX . "{$version}:{$roleKey}:{$searchHash}:{$perPage}:{$page}";
    }

    /**
     * Format Paginator to array (cache-friendly & lightweight).
     *
     * @param  LengthAwarePaginator  $paginator
     * @return array{data: array<int, object>, meta: array<string, int|null>}
     */
    private function formatPaginator(LengthAwarePaginator $paginator): array
    {
        return [
            'data' => $paginator->items(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'from' => $paginator->firstItem(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'to' => $paginator->lastItem(),
                'total' => $paginator->total(),
            ],
        ];
    }
}