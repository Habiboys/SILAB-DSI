<?php

namespace Tests\Unit;

use App\Models\PeriodePiket;
use App\Services\PiketGeofenceService;
use PHPUnit\Framework\TestCase;

class PiketGeofenceServiceTest extends TestCase
{
    public function test_enabled_geofence_classifies_inside_outside_and_missing_position(): void
    {
        $periode = new PeriodePiket([
            'geolocation_enabled' => true,
            'location_latitude' => -0.9140000,
            'location_longitude' => 100.4600000,
            'location_radius_meters' => 100,
        ]);
        $service = new PiketGeofenceService();

        $this->assertSame('inside', $service->evaluate($periode, -0.9140000, 100.4600000)['status']);
        $this->assertSame('outside', $service->evaluate($periode, -0.9040000, 100.4600000)['status']);
        $this->assertSame('unverified', $service->evaluate($periode, null, null)['status']);
    }

    public function test_disabled_geofence_does_not_require_position(): void
    {
        $periode = new PeriodePiket(['geolocation_enabled' => false]);

        $this->assertSame('disabled', (new PiketGeofenceService())->evaluate($periode, null, null)['status']);
    }
}
