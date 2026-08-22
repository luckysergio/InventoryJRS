<?php

declare(strict_types=1);

namespace App\Events\Dashboard;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class DashboardUpdated implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public string $type;
    public array $metadata;

    /**
     * Create a new event instance.
     */
    public function __construct(string $type, array $metadata = [])
    {
        $this->type = $type;
        $this->metadata = $metadata;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('dashboard'),
        ];
    }

    /**
     * The event's broadcast name.
     * Frontend listen: channel.listen('.dashboard.updated', callback)
     */
    public function broadcastAs(): string
    {
        return 'dashboard.updated';
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'type' => $this->type,
            'metadata' => $this->metadata,
            'timestamp' => now()->toIso8601String(),
            'time_ago' => now()->diffForHumans(),
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