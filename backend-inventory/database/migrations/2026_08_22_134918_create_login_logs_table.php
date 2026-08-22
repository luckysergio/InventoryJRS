<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('login_logs', function (Blueprint $table) {
            $table->id();
            
            $table->unsignedBigInteger('user_id')->nullable()->index();
            
            $table->string('email', 255)->index();
            
            $table->ipAddress('ip_address')->index();
            
            $table->text('user_agent')->nullable();
            
            $table->boolean('success')->default(false)->index();
            
            $table->string('failure_reason', 255)->nullable();
            
            $table->timestamp('created_at')->index();
            $table->timestamp('updated_at')->nullable();
            
            $table->index(['email', 'success', 'created_at'], 'idx_email_success_created');
            
            $table->foreign('user_id')
                  ->references('id')
                  ->on('users')
                  ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('login_logs');
    }
};