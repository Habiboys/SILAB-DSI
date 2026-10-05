import { lazy, Suspense, useState } from "react";
import Button from "@/Components/Button";
import FormField from "@/Components/FormField";
import { toast } from "sonner";

const GeofenceMapPicker = lazy(() => import("./GeofenceMapPicker"));

export default function GeofenceFields({ form, prefix, className = "" }) {
    const [mapOpen, setMapOpen] = useState(false);

    const useCurrentPosition = () => {
        if (!navigator.geolocation) {
            toast.error("Perangkat ini tidak mendukung lokasi.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            ({ coords }) => {
                form.setData((current) => ({
                    ...current,
                    location_latitude: coords.latitude.toFixed(7),
                    location_longitude: coords.longitude.toFixed(7),
                }));
            },
            () => toast.error("Lokasi tidak tersedia. Periksa izin lokasi browser."),
            { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
        );
    };

    const selectOnMap = (latitude, longitude) => {
        form.setData((current) => ({
            ...current,
            location_latitude: latitude,
            location_longitude: longitude,
        }));
    };

    return (
        <div className={`space-y-4 border-t border-base-300 pt-4 ${className}`}>
            <FormField label="Batasi absensi berdasarkan lokasi" error={form.errors.geolocation_enabled}>
                <label className="flex min-h-11 items-center gap-3">
                    <input
                        id={`${prefix}-geolocation-enabled`}
                        type="checkbox"
                        className="checkbox checkbox-primary"
                        checked={!!form.data.geolocation_enabled}
                        onChange={(event) => form.setData("geolocation_enabled", event.target.checked)}
                    />
                    <span className="text-sm">Wajib berada di dalam radius saat check-in dan checkout</span>
                </label>
            </FormField>

            {form.data.geolocation_enabled && (
                <>
                    <p className="text-sm text-base-content/70">
                        Isi koordinat, pilih titik di peta, atau gunakan posisi perangkat saat berada di lokasi.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => setMapOpen((open) => !open)} aria-expanded={mapOpen}>
                            {mapOpen ? "Tutup peta" : "Pilih di peta"}
                        </Button>
                        <Button type="button" variant="outline" onClick={useCurrentPosition}>
                            Gunakan lokasi saya
                        </Button>
                    </div>
                    {mapOpen && (
                        <div className="space-y-2">
                            <p className="text-sm text-base-content/70">Klik peta untuk menentukan titik piket. Lingkaran menunjukkan radius absensi.</p>
                            <Suspense fallback={<div className="h-72 rounded-lg border border-base-300 bg-base-200" aria-label="Memuat peta" />}>
                                <GeofenceMapPicker
                                    latitude={form.data.location_latitude}
                                    longitude={form.data.location_longitude}
                                    radius={form.data.location_radius_meters}
                                    onSelect={selectOnMap}
                                />
                            </Suspense>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <FormField label="Latitude" error={form.errors.location_latitude} required>
                        <input
                            id={`${prefix}-location-latitude`}
                            type="number"
                            step="any"
                            min={-90}
                            max={90}
                            className="input min-h-11 w-full"
                            value={form.data.location_latitude ?? ""}
                            onChange={(event) => form.setData("location_latitude", event.target.value)}
                            required
                        />
                    </FormField>
                    <FormField label="Longitude" error={form.errors.location_longitude} required>
                        <input
                            id={`${prefix}-location-longitude`}
                            type="number"
                            step="any"
                            min={-180}
                            max={180}
                            className="input min-h-11 w-full"
                            value={form.data.location_longitude ?? ""}
                            onChange={(event) => form.setData("location_longitude", event.target.value)}
                            required
                        />
                    </FormField>
                    <FormField label="Radius (meter)" hint="Jarak maksimal dari titik lokasi, 10–10.000 meter." error={form.errors.location_radius_meters} required>
                        <input
                            id={`${prefix}-location-radius`}
                            type="number"
                            min={10}
                            max={10000}
                            className="input min-h-11 w-full"
                            value={form.data.location_radius_meters ?? 100}
                            onChange={(event) => form.setData("location_radius_meters", event.target.value)}
                            required
                        />
                    </FormField>
                    </div>
                </>
            )}
        </div>
    );
}
