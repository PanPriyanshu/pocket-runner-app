import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';
import OrderCard from '@/components/OrderCard';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Constants } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';

type Order = Tables<'orders'>;

const CATEGORIES = ['all', ...Constants.public.Enums.item_category];

const Feed = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    let query = supabase
      .from('orders')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (selectedCategory !== 'all') {
      query = query.eq('category', selectedCategory as any);
    }

    const { data } = await query;
    if (data) {
      setOrders(data);
      // Fetch requester names
      const ids = [...new Set(data.map((o) => o.requester_id))];
      if (ids.length > 0) {
        const { data: profs } = await supabase
          .from('profiles')
          .select('user_id, full_name')
          .in('user_id', ids);
        if (profs) {
          const map: Record<string, string> = {};
          profs.forEach((p) => (map[p.user_id] = p.full_name));
          setProfiles(map);
        }
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, [selectedCategory]);

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel('orders-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders();
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [selectedCategory]);

  const filtered = orders.filter(
    (o) =>
      o.title.toLowerCase().includes(search.toLowerCase()) ||
      o.description.toLowerCase().includes(search.toLowerCase())
  );

  const categoryEmoji: Record<string, string> = {
    all: '🔥',
    stationery: '✏️',
    food: '🍕',
    medicine: '💊',
    electronics: '🔌',
    groceries: '🛒',
    clothing: '👕',
    other: '📦',
  };

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-4">
        <h2 className="font-heading text-xl font-bold mb-3">Open Errands</h2>
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search errands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <Badge
              key={cat}
              variant={selectedCategory === cat ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap shrink-0"
              onClick={() => setSelectedCategory(cat)}
            >
              {categoryEmoji[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Badge>
          ))}
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-4xl mb-2">📭</p>
          <p className="text-muted-foreground">No open errands yet. Be the first to post!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              requesterName={profiles[order.requester_id] || 'Student'}
              index={i}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Feed;
