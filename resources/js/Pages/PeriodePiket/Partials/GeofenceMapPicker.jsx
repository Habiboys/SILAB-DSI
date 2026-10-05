import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

function coordinates(latitude, longitude) {
    if (latitude === "" || longitude === "" || latitude == null || longitude == null) {
        return null;
    }

    const lat = Number(latitude);
    const lng = Number(longitude);
    return Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
        ? [lat, lng]
        : null;
}

export default function GeofenceMapPicker({ latitude, longitude, radius, onSelect }) {
    const containerRef = useRef(null);
    const mapRef = useRef(null);
    const pointRef = useRef(null);
    const circleRef = useRef(null);
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;

    useEffect(() => {
        const initial = coordinates(latitude, longitude);
        const map = L.map(containerRef.current, { scrollWheelZoom: false })
            .setView(initial ?? [-2.5, 118], initial ? 16 : 5);
        mapRef.current = map;

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(map);

        map.on("click", ({ latlng }) => onSelectRef.current(latlng.lat.toFixed(7), latlng.lng.toFixed(7)));
        const resize = requestAnimationFrame(() => map.invalidateSize());

        return () => {
            cancelAnimationFrame(resize);
            map.remove();
            mapRef.current = null;
            pointRef.current = null;
            circleRef.current = null;
        };
    }, []);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const point = coordinates(latitude, longitude);
        if (!point) {
            pointRef.current?.remove();
            circleRef.current?.remove();
            pointRef.current = null;
            circleRef.current = null;
            return;
        }

        const meters = Number(radius);
        const validRadius = Number.isFinite(meters) && meters >= 10 && meters <= 10000;
        if (validRadius) {
            if (circleRef.current) {
                circleRef.current.setLatLng(point).setRadius(meters);
            } else {
                circleRef.current = L.circle(point, {
                    radius: meters,
                    color: "var(--color-primary)",
                    fillColor: "var(--color-primary)",
                    fillOpacity: 0.14,
                    weight: 2,
                }).addTo(map);
            }
        } else {
            circleRef.current?.remove();
            circleRef.current = null;
        }

        if (pointRef.current) {
            pointRef.current.setLatLng(point);
        } else {
            pointRef.current = L.circleMarker(point, {
                radius: 6,
                color: "var(--color-primary)",
                fillColor: "var(--color-primary)",
                fillOpacity: 1,
                weight: 2,
            }).addTo(map);
        }
        map.panTo(point);
    }, [latitude, longitude, radius]);

    return (
        <div
            ref={containerRef}
            className="relative z-0 h-72 w-full overflow-hidden rounded-lg border border-base-300"
            aria-label="Peta untuk memilih titik piket"
        />
    );
}
