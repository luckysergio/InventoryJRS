<?php

namespace App\Http\Resources\Dashboard;

use App\Models\LoginLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LoginLogResource extends JsonResource
{
    /**
     * Flag untuk menentukan apakah resource ini ditampilkan sebagai detail lengkap.
     */
    private bool $isDetail;

    /**
     * Create a new resource instance.
     *
     * @param  LoginLog|mixed  $resource
     * @param  bool            $isDetail
     * @return void
     */
    public function __construct(mixed $resource, bool $isDetail = false)
    {
        parent::__construct($resource);
        $this->isDetail = $isDetail;
    }

    /**
     * Transform the resource into an array.
     */
    public function toArray(Request $request): array
    {
        /** @var LoginLog $log */
        $log = $this->resource;

        $base = [
            'id'              => $log->id,
            'type'            => 'login',
            'success'         => (bool) $log->success,
            'failure_reason'  => $log->failure_reason,
            'email_attempted' => $log->email,
            'ip_address'      => $log->ip_address,
            'user'            => $log->user ? [
                'id'    => $log->user->id,
                'name'  => $log->user->name,
                'email' => $log->user->email,
                'role'  => $log->user->role ?? null,
            ] : null,
            'timestamp'       => $log->created_at?->toIso8601String(),
            'time_ago'        => $log->created_at?->diffForHumans() ?? 'Baru saja',
        ];

        if ($this->isDetail) {
            $base['user_agent'] = $log->user_agent;
            $base['browser']    = $log->browser;
            $base['os']         = $log->os;
            $base['device']     = $log->device;
            $base['created_at'] = $log->created_at?->format('d M Y, H:i:s');
            $base['updated_at'] = $log->updated_at?->toIso8601String();
        }

        return $base;
    }

    /**
     * Static factory: buat resource mode LIST.
     */
    public static function makeList(mixed $resource): static
    {
        return new static($resource, false);
    }

    /**
     * Static factory: buat resource mode DETAIL.
     */
    public static function makeDetail(mixed $resource): static
    {
        return new static($resource, true);
    }
}