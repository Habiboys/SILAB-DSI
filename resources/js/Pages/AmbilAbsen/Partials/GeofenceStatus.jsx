export default function GeofenceStatus({ periode, distance, error }) {
    if (!periode?.geolocation_enabled) return null;

    const radius = Number(periode.location_radius_meters || 100);
    const inside = distance !== null && distance <= radius;

    return (
        <div className={`mx-6 mt-6 rounded-lg border p-4 ${inside ? "border-success/30 bg-success/10" : "border-warning/30 bg-warning/10"}`} role="status">
            <p className="font-medium text-base-content">
                {distance === null
                    ? "Menunggu lokasi perangkat"
                    : inside
                      ? "Anda berada di area piket"
                      : "Anda berada di luar area piket"}
            </p>
            <p className="mt-1 text-sm text-base-content/70">
                {distance === null
                    ? "Izinkan akses lokasi untuk check-in atau checkout."
                    : `Jarak sekitar ${Math.round(distance)} meter dari titik piket; batas ${radius} meter.`}
            </p>
            {error && <p className="mt-2 text-sm text-error">{error}</p>}
        </div>
    );
}
