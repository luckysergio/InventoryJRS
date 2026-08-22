<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\LoginLog;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LoginLogged implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public LoginLog $log;

    public function __construct(LoginLog $log)
    {
        $this->log = $log;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('dashboard'),
        ];
    }

    public function broadcastAs(): string
    {
        return 'login.logged';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'id' => $this->log->id,
            'type' => 'login',
            'success' => (bool) $this->log->success,
            'failure_reason' => $this->log->failure_reason,
            'email_attempted' => $this->log->email,
            'ip_address' => $this->log->ip_address,
            'user_agent' => $this->log->user_agent,
            'user' => $this->log->user ? [
                'id' => $this->log->user->id,
                'name' => $this->log->user->name,
                'email' => $this->log->user->email,
                'role' => $this->log->user->role ?? null,
            ] : null,
            'timestamp' => $this->log->created_at?->toIso8601String(),
            'time_ago' => $this->log->created_at?->diffForHumans() ?? 'Baru saja',
        ];
    }

    /**
     * The name of the queue on which to place the broadcasting job.
     */
    public function broadcastQueue(): string
    {
        return 'broadcasts';
    }

    /**
     * Determine if the event should be broadcast immediately.
     */
    public function broadcastWhen(): bool
    {
        return true;
    }
}