import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';
import OrderCard from '@/components/OrderCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

type Order = Tables<'orders'>;

const MyOrders = () => {
  const { user } = useAuth();
  const [myRequests, setMyRequests] = useState<Order[]>([]);
  const [myDeliveries, setMyDeliveries] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const [{ data: reqs }, { data: dels }] = await Promise.all([
        supabase.from('orders').select('*').eq('requester_id', user.id).order('created_at', { ascending: false }),
        supabase.from('orders').select('*').eq('deliverer_id', user.id).order('created_at', { ascending: false }),
      ]);
      setMyRequests(reqs || []);
      setMyDeliveries(dels || []);
      setLoading(false);
    };
    fetch();
  }, [user]);

  if (loading) {
    return <div className="pt-20 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <h2 className="font-heading text-xl font-bold mb-4">My Orders</h2>
        <Tabs defaultValue="requests">
          <TabsList className="w-full">
            <TabsTrigger value="requests" className="flex-1">My Requests ({myRequests.length})</TabsTrigger>
            <TabsTrigger value="deliveries" className="flex-1">My Deliveries ({myDeliveries.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="requests" className="space-y-3 mt-3">
            {myRequests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No requests yet</p>
            ) : (
              myRequests.map((o, i) => <OrderCard key={o.id} order={o} index={i} />)
            )}
          </TabsContent>
          <TabsContent value="deliveries" className="space-y-3 mt-3">
            {myDeliveries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No deliveries yet. Pick an errand from the feed!</p>
            ) : (
              myDeliveries.map((o, i) => <OrderCard key={o.id} order={o} index={i} />)
            )}
          </TabsContent>
        </Tabs>
      </motion.div>
    </div>
  );
};

export default MyOrders;
