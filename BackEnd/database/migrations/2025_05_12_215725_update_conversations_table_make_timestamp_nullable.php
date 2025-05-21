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
        Schema::table('conversations', function (Blueprint $table) {
            // Check if timestamp column exists
            if (Schema::hasColumn('conversations', 'timestamp')) {
                // Make the timestamp column nullable
                $table->timestamp('timestamp')->nullable()->default(now())->change();
            } else {
                // Add the timestamp column if it doesn't exist
                $table->timestamp('timestamp')->nullable()->default(now());
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('conversations', function (Blueprint $table) {
            // If the timestamp column exists, make it NOT NULL again
            if (Schema::hasColumn('conversations', 'timestamp')) {
                $table->timestamp('timestamp')->nullable(false)->change();
            }
        });
    }
};
