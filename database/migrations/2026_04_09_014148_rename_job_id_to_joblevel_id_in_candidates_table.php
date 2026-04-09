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
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropForeign(['job_id']);
            $table->renameColumn('job_id', 'joblevel_id');
            $table->foreign('joblevel_id')->references('id')->on('joblevels')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('candidates', function (Blueprint $table) {
            $table->dropForeign(['joblevel_id']);
            $table->renameColumn('joblevel_id', 'job_id');
            $table->foreign('job_id')->references('id')->on('joblevels')->onDelete('cascade');
        });
    }
};
