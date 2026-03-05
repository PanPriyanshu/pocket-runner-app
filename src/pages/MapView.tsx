import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useGeolocation } from '@/hooks/useGeolocation';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

type Order = Tables<'orders'>;

const MapView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const { position, requestPosition } = useGeolocation();

  useEffect(() => {
    requestPosition();
    const fetch = async () => {
      const { data } = await supabase
        .from('orders')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(20);
      setOrders(data || []);
      setLoading(false);
    };
    fetch();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || loading) return;

    const lat = position?.latitude ?? 20.5937;
    const lng = position?.longitude ?? 78.9629;

    if (mapInstance.current) {
      mapInstance.current.remove();
    }

    const map = L.map(mapRef.current).setView([lat, lng], position ? 14 : 5);
    mapInstance.current = map;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Current location marker
    if (position) {
      L.circleMarker([position.latitude, position.longitude], {
        radius: 10,
        fillColor: 'hsl(210, 100%, 52%)',
        color: 'white',
        weight: 3,
        fillOpacity: 0.9,
      })
        .addTo(map)
        .bindPopup('📍 You are here');
    }

    // Order markers
    orders.forEach((order) => {
      const hasPickup = order.pickup_latitude && order.pickup_longitude;
      const hasDelivery = order.delivery_latitude && order.delivery_longitude;

      if (hasPickup) {
        L.marker([order.pickup_latitude!, order.pickup_longitude!])
          .addTo(map)
          .bindPopup(`
            <strong>${order.title}</strong><br/>
            📦 ${order.pickup_location} → ${order.delivery_location}<br/>
            💰 ₹${Number(order.total_amount || 0).toFixed(0)}
          `)
          .on('click', () => navigate(`/order/${order.id}`));
      } else if (hasDelivery) {
        L.marker([order.delivery_latitude!, order.delivery_longitude!])
          .addTo(map)
          .bindPopup(`
            <strong>${order.title}</strong><br/>
            🏠 ${order.delivery_location}<br/>
            💰 ₹${Number(order.total_amount || 0).toFixed(0)}
          `)
          .on('click', () => navigate(`/order/${order.id}`));
      }
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [loading, position, orders]);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-heading text-xl font-bold mb-4">
          <MapPin className="w-5 h-5 inline text-primary mr-1" />
          Nearby Errands
        </h2>

        <div
          ref={mapRef}
          className="rounded-xl overflow-hidden mb-4"
          style={{ height: '300px' }}
        />

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No nearby errands</p>
        ) : (
          <div className="space-y-2">
            {orders.map((order) => (
              <Card
                key={order.id}
                className="cursor-pointer hover:shadow-card-hover transition-all active:scale-[0.98]"
                onClick={() => navigate(`/order/${order.id}`)}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{order.title}</p>
                    <p className="text-xs text-muted-foreground truncate">{order.pickup_location} → {order.delivery_location}</p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-xs">
                    ₹{Number(order.total_amount || 0).toFixed(0)}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default MapView;
