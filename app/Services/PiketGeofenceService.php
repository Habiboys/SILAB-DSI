<?php

namespace App\Services;

use App\Models\PeriodePiket;

class PiketGeofenceService
{
    public function evaluate(?PeriodePiket $periode, ?float $latitude, ?float $longitude): array
    {
        if (!$periode?->geolocation_enabled) {
            return ['status' => 'disabled', 'distance' => null, 'inside' => null];
        }

        if ($latitude === null || $longitude === null || $periode->location_latitude === null || $periode->location_longitude === null) {
            return ['status' => 'unverified', 'distance' => null, 'inside' => null];
        }

        $distance = $this->distanceMeters($latitude, $longitude, (float) $periode->location_latitude, (float) $periode->location_longitude);

        return [
            'status' => $distance <= (int) $periode->location_radius_meters ? 'inside' : 'outside',
            'distance' => round($distance, 2),
            'inside' => $distance <= (int) $periode->location_radius_meters,
        ];
    }

    public function distanceMeters(float $lat1, float $lon1, float $lat2, float $lon2): float
    {
        $earthRadius = 6371000;
        $lat = deg2rad($lat2 - $lat1);
        $lon = deg2rad($lon2 - $lon1);
        $a = sin($lat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($lon / 2) ** 2;
        return $earthRadius * 2 * asin(min(1, sqrt($a)));
    }
}
