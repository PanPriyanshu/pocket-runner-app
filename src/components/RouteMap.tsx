import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

interface RouteMapProps {
  pickupLat?: number | null;
  pickupLng?: number | null;
  deliveryLat?: number | null;
  deliveryLng?: number | null;
  currentLat?: number | null;
  currentLng?: number | null;
  pickupLabel?: string;
  deliveryLabel?: string;
  className?: string;
}

const greenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const redIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const RouteMap = ({
  pickupLat, pickupLng, deliveryLat, deliveryLng,
  currentLat, currentLng,
  pickupLabel = 'Pickup', deliveryLabel = 'Delivery',
  className = '',
}: RouteMapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapRef.current) return;

    // Determine center
    const hasPickup = pickupLat != null && pickupLng != null;
    const hasDelivery = deliveryLat != null && deliveryLng != null;
    const hasCurrent = currentLat != null && currentLng != null;

    if (!hasPickup && !hasDelivery && !hasCurrent) return;

    const centerLat = hasCurrent ? currentLat! : hasPickup ? pickupLat! : deliveryLat!;
    const centerLng = hasCurrent ? currentLng! : hasPickup ? pickupLng! : deliveryLng!;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView([centerLat, centerLng], 14);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
    }).addTo(map);

    const bounds: L.LatLngExpression[] = [];

    if (hasPickup) {
      L.marker([pickupLat!, pickupLng!], { icon: greenIcon })
        .addTo(map)
        .bindPopup(`📦 ${pickupLabel}`);
      bounds.push([pickupLat!, pickupLng!]);
    }

    if (hasDelivery) {
      L.marker([deliveryLat!, deliveryLng!], { icon: redIcon })
        .addTo(map)
        .bindPopup(`🏠 ${deliveryLabel}`);
      bounds.push([deliveryLat!, deliveryLng!]);
    }

    if (hasCurrent) {
      L.marker([currentLat!, currentLng!], { icon: blueIcon })
        .addTo(map)
        .bindPopup('📍 You are here');
      bounds.push([currentLat!, currentLng!]);
    }

    // Draw route line between pickup and delivery
    if (hasPickup && hasDelivery) {
      const routePoints: L.LatLngExpression[] = [];
      if (hasCurrent) routePoints.push([currentLat!, currentLng!]);
      routePoints.push([pickupLat!, pickupLng!]);
      routePoints.push([deliveryLat!, deliveryLng!]);

      L.polyline(routePoints, {
        color: 'hsl(160, 84%, 36%)',
        weight: 4,
        opacity: 0.8,
        dashArray: '10, 10',
      }).addTo(map);
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [40, 40] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [pickupLat, pickupLng, deliveryLat, deliveryLng, currentLat, currentLng]);

  return (
    <div
      ref={mapRef}
      className={`w-full rounded-xl overflow-hidden ${className}`}
      style={{ height: '250px' }}
    />
  );
};

export default RouteMap;
