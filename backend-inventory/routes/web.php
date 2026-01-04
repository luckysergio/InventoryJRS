<?php

use App\Http\Controllers\api\PesananTransaksiController;
use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/pesanan/{id}/nota', [PesananTransaksiController::class, 'printNota'])
    ->name('pesanan.nota');
