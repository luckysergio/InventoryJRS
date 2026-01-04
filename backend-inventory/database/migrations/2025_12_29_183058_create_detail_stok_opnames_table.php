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
        Schema::create('detail_stok_opnames', function (Blueprint $table) {
            $table->id();
            $table->foreignId('stok_opname_id')->constrained()->onDelete('cascade');
            $table->foreignId('inventory_id')->constrained()->onDelete('cascade');
            $table->integer('stok_sistem');
            $table->integer('stok_real')->nullable();
            $table->integer('selisih')->nullable();
            $table->text('keterangan')->nullable();
            $table->timestamps();

            $table->unique(['stok_opname_id', 'inventory_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('detail_stok_opnames');
    }
};
