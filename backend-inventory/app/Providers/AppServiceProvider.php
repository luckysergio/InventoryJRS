<?php

declare(strict_types=1);

namespace App\Providers;

use App\Models\User;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        Gate::policy(User::class, UserPolicy::class);

        $this->setupBroadcasting();
    }

    private function setupBroadcasting(): void
    {
        try {
            Broadcast::routes([
                'middleware' => ['jwt.auth'],
                'prefix' => 'api',
            ]);

            $channelsFile = base_path('routes/channels.php');
            if (file_exists($channelsFile)) {
                require $channelsFile;
            }

            Log::info('BroadcastServiceProvider booted successfully', [
                'driver' => config('broadcasting.default'),
                'channels_file' => file_exists($channelsFile),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Broadcast setup failed - real-time features may not work', [
                'error' => $e->getMessage(),
            ]);
        }
    }
}