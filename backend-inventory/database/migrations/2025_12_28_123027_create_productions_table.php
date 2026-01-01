<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('productions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('product_id')
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('transaksi_detail_id')
                ->nullable()
                ->constrained('transaksi_details')
                ->nullOnDelete();

            $table->enum('jenis_pembuatan', ['pesanan', 'inventory']);

            $table->integer('qty');

            $table->enum('status', [
                'antri',
                'produksi',
                'selesai',
                'batal'
            ])->default('antri');

            $table->dateTime('tanggal_mulai')->nullable();
            $table->dateTime('tanggal_selesai')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('productions');
    }
};
