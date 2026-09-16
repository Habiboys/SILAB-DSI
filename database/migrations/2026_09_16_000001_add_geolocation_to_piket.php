<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('periode_piket', function (Blueprint $table) {
            $table->boolean('geolocation_enabled')->default(false);
            $table->decimal('location_latitude', 10, 7)->nullable();
            $table->decimal('location_longitude', 10, 7)->nullable();
            $table->unsignedInteger('location_radius_meters')->default(100);
            $table->unsignedTinyInteger('location_threshold_percent')->default(80);
        });

        Schema::table('absensi', function (Blueprint $table) {
            $table->decimal('checkin_latitude', 10, 7)->nullable();
            $table->decimal('checkin_longitude', 10, 7)->nullable();
            $table->decimal('checkin_distance_meters', 10, 2)->nullable();
            $table->decimal('checkout_latitude', 10, 7)->nullable();
            $table->decimal('checkout_longitude', 10, 7)->nullable();
            $table->decimal('checkout_distance_meters', 10, 2)->nullable();
            $table->unsignedInteger('location_samples_inside')->default(0);
            $table->unsignedInteger('location_samples_outside')->default(0);
            $table->unsignedTinyInteger('location_percent')->nullable();
            $table->string('location_status')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('absensi', function (Blueprint $table) {
            $table->dropColumn([
                'checkin_latitude', 'checkin_longitude', 'checkin_distance_meters',
                'checkout_latitude', 'checkout_longitude', 'checkout_distance_meters',
                'location_samples_inside', 'location_samples_outside',
                'location_percent', 'location_status',
            ]);
        });

        Schema::table('periode_piket', function (Blueprint $table) {
            $table->dropColumn([
                'geolocation_enabled', 'location_latitude', 'location_longitude',
                'location_radius_meters', 'location_threshold_percent',
            ]);
        });
    }
};
