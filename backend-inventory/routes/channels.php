<?php

use Illuminate\Support\Facades\Broadcast;
use App\Models\User;


Broadcast::channel('dashboard', function (User $user) {
    return $user->hasAnyRole(['admin', 'admin_toko', 'operator']);
});

Broadcast::channel('user.{id}', function (User $user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('admin', function (User $user) {
    return $user->hasRole('admin');
});