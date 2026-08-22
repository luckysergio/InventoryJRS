<?php

declare(strict_types=1);

namespace App\Traits;

use App\Events\Dashboard\DashboardUpdated;
use Illuminate\Support\Facades\Log;

trait BroadcastsDashboardEvents
{
    protected function broadcastDashboardEvent(string $type, array $metadata = []): void
    {
        try {
            // ✅ HAPUS ->toOthers() agar user yang trigger juga terima event
            broadcast(new DashboardUpdated($type, $metadata));
            
            Log::info('Dashboard event broadcasted', [
                'type' => $type,
                'metadata' => $metadata,
            ]);
        } catch (\Throwable $e) {
            Log::warning('Failed to broadcast dashboard event', [
                'type' => $type,
                'error' => $e->getMessage(),
            ]);
        }
    }

    protected function broadcastTransaksiEvent(string $action, array $metadata = []): void
    {
        $this->broadcastDashboardEvent("transaksi.{$action}", $metadata);
    }

    protected function broadcastPesananEvent(string $action, array $metadata = []): void
    {
        $this->broadcastDashboardEvent("pesanan.{$action}", $metadata);
    }

    protected function broadcastProductEvent(string $action, array $metadata = []): void
    {
        $this->broadcastDashboardEvent("product.{$action}", $metadata);
    }

    protected function broadcastProductionEvent(string $action, array $metadata = []): void
    {
        $this->broadcastDashboardEvent("production.{$action}", $metadata);
    }
}