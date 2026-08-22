<?php

namespace App\Http\Resources\Dashboard;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardChartResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $resource = $this->resource;
        $data = $resource['data'] ?? [];

        return [
            'period' => $resource['period'] ?? 'monthly_chart',
            'months' => (int) ($resource['months'] ?? 6),
            'data' => collect($data)->map(function ($item) {
                return [
                    'label' => $this->safeGet($item, 'label', ''),
                    'date' => $this->safeGet($item, 'date'),
                    'revenue' => (int) $this->safeGet($item, 'revenue', 0),
                    'orders' => (int) $this->safeGet($item, 'orders', 0),
                ];
            })->values()->toArray(),
            'cached_at' => $resource['cached_at'] ?? null,
        ];
    }

    /**
     * ✅ Helper: safely get value dari array ATAU stdClass.
     *
     * @param array|object $item Data source (array atau stdClass)
     * @param string $key Key yang ingin diambil
     * @param mixed $default Default value jika key tidak ditemukan
     * @return mixed Value yang ditemukan atau default
     */
    private function safeGet(array|object $item, string $key, mixed $default = null): mixed
    {
        if (is_array($item)) {
            return $item[$key] ?? $default;
        }
        if (is_object($item)) {
            return $item->{$key} ?? $default;
        }
        return $default;
    }
}