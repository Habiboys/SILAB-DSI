<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('struktur', function (Blueprint $table) {
            $table->id();
            $table->string('struktur');
            $table->unsignedBigInteger('laboratorium_id');
            $table->foreign('laboratorium_id')->references('id')->on('laboratorium')->onDelete('cascade');
            $table->boolean('have_member');
            $table->boolean('isdosen');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('struktur');
    }
};