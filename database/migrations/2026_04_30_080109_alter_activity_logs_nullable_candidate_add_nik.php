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
        Schema::table('activity_logs', function (Blueprint $table) {
            // Drop old non-nullable FK
            $table->dropForeign(['candidate_id']);
            $table->unsignedBigInteger('candidate_id')->nullable()->change();
            $table->foreign('candidate_id')->references('id')->on('candidates')->nullOnDelete();

            // Store NIK directly so logs survive even without a local candidate record
            $table->string('nik')->nullable()->after('candidate_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activity_logs', function (Blueprint $table) {
            $table->dropColumn('nik');
            $table->dropForeign(['candidate_id']);
            $table->unsignedBigInteger('candidate_id')->nullable(false)->change();
            $table->foreign('candidate_id')->references('id')->on('candidates')->onDelete('cascade');
        });
    }
};
