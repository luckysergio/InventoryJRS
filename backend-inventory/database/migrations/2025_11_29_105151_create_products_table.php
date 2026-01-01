<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            $table->string('kode')->unique();

            $table->foreignId('jenis_id')
                ->constrained('jenis_products')
                ->cascadeOnDelete();

            $table->foreignId('type_id')
                ->nullable()
                ->constrained('type_products')
                ->nullOnDelete();

            $table->foreignId('bahan_id')
                ->nullable()
                ->constrained('bahan_products')
                ->nullOnDelete();

            $table->string('ukuran');

            $table->text('keterangan')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
