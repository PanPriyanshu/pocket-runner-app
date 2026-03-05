import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type Order = Tables<'orders'>;

const MapView = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
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

  // Note: Full Leaflet map requires an API tile provider.
  // For now, show a list-based "map view" with location info.

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-heading text-xl font-bold mb-4">
          <MapPin className="w-5 h-5 inline text-primary mr-1" />
          Nearby Errands
        </h2>

        <div className="rounded-xl overflow-hidden mb-4 bg-muted aspect-video flex items-center justify-center">
          <div className="text-center p-6">
            <MapPin className="w-10 h-10 text-primary mx-auto mb-2 animate-pulse-soft" />
            <p className="text-sm text-muted-foreground">Map view coming soon!</p>
            <p className="text-xs text-muted-foreground mt-1">Browse nearby errands below</p>
          </div>
        </div>

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
