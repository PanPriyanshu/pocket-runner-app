import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { ArrowLeft, MapPin, IndianRupee, User, Star, Send, CheckCircle2, Package, Loader2, ExternalLink, Navigation } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import RouteMap from '@/components/RouteMap';
import { useGeolocation, getDistanceKm } from '@/hooks/useGeolocation';

type Order = Tables<'orders'>;
type Message = Tables<'messages'>;
type Profile = Tables<'profiles'>;

const statusConfig: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: 'Waiting for deliverer', color: 'bg-warning/10 text-warning', emoji: '⏳' },
  accepted: { label: 'Deliverer on the way', color: 'bg-info/10 text-info', emoji: '🏃' },
  picked_up: { label: 'Item picked up', color: 'bg-primary/10 text-primary', emoji: '🛍️' },
  delivered: { label: 'Delivered – confirm receipt', color: 'bg-success/10 text-success', emoji: '📬' },
  confirmed: { label: 'Completed', color: 'bg-success/10 text-success', emoji: '✅' },
  cancelled: { label: 'Cancelled', color: 'bg-destructive/10 text-destructive', emoji: '❌' },
};

const ARRIVAL_THRESHOLD_KM = 0.1; // 100 meters

const OrderDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [requester, setRequester] = useState<Profile | null>(null);
  const [deliverer, setDeliverer] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [arrivalPrompted, setArrivalPrompted] = useState(false);

  const isDeliverer = user?.id === order?.deliverer_id;
  const shouldWatch = isDeliverer && (order?.status === 'accepted' || order?.status === 'picked_up');
  const { position } = useGeolocation(shouldWatch);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase.from('orders').select('*').eq('id', id).single();
    if (data) {
      setOrder(data);
      const { data: req } = await supabase.from('profiles').select('*').eq('user_id', data.requester_id).single();
      setRequester(req);
      if (data.deliverer_id) {
        const { data: del } = await supabase.from('profiles').select('*').eq('user_id', data.deliverer_id).single();
        setDeliverer(del);
      }
    }
    setLoading(false);
  }, [id]);

  const fetchMessages = useCallback(async () => {
    if (!id) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('order_id', id)
      .order('created_at', { ascending: true });
    if (data) setMessages(data);
  }, [id]);

  useEffect(() => {
    fetchOrder();
    fetchMessages();
  }, [fetchOrder, fetchMessages]);

  // Realtime
  useEffect(() => {
    if (!id) return;
    const ch = supabase
      .channel(`order-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders', filter: `id=eq.${id}` }, () => fetchOrder())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `order_id=eq.${id}` }, () => fetchMessages())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [id, fetchOrder, fetchMessages]);

  // Arrival detection for deliverer
  useEffect(() => {
    if (!position || !order || !isDeliverer || arrivalPrompted) return;

    if (order.status === 'picked_up' && order.delivery_latitude && order.delivery_longitude) {
      const dist = getDistanceKm(
        position.latitude, position.longitude,
        order.delivery_latitude, order.delivery_longitude
      );
      if (dist <= ARRIVAL_THRESHOLD_KM) {
        setArrivalPrompted(true);
        toast.info('🎉 You\'ve arrived at the delivery location! Mark as delivered?', {
          duration: 10000,
          action: {
            label: 'Mark Delivered',
            onClick: () => markDelivered(),
          },
        });
      }
    }

    if (order.status === 'accepted' && order.pickup_latitude && order.pickup_longitude) {
      const dist = getDistanceKm(
        position.latitude, position.longitude,
        order.pickup_latitude, order.pickup_longitude
      );
      if (dist <= ARRIVAL_THRESHOLD_KM) {
        setArrivalPrompted(true);
        toast.info('📦 You\'ve arrived at the pickup location!', { duration: 5000 });
      }
    }
  }, [position, order, isDeliverer, arrivalPrompted]);

  const isRequester = user?.id === order?.requester_id;

  const acceptOrder = async () => {
    if (!order || !user) return;
    setActionLoading(true);
    await supabase.from('orders').update({ deliverer_id: user.id, status: 'accepted' }).eq('id', order.id);
    toast.success('You accepted this errand!');
    setActionLoading(false);
  };

  const updateStatus = async (status: string) => {
    if (!order) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: status as any }).eq('id', order.id);
    toast.success('Status updated');
    setActionLoading(false);
  };

  const markDelivered = async () => {
    if (!order) return;
    setActionLoading(true);
    await supabase.from('orders').update({ status: 'delivered' as any }).eq('id', order.id);
    toast.success('Marked as delivered! Waiting for confirmation.');
    setActionLoading(false);
  };

  const confirmDelivery = async () => {
    if (!order || !user) return;
    setActionLoading(true);
    await supabase.from('orders').update({ requester_confirmed: true, status: 'confirmed' }).eq('id', order.id);

    // Credit deliverer earnings + rating via security definer function
    if (order.deliverer_id) {
      const { error } = await supabase.rpc('credit_deliverer', {
        _order_id: order.id,
        _deliverer_id: order.deliverer_id,
        _delivery_fee: Number(order.delivery_fee || 0),
        _rating: rating > 0 ? rating : null,
      });
      if (error) {
        console.error('credit_deliverer error:', error);
        toast.error('Failed to credit earnings');
      }
    }

    toast.success('Delivery confirmed! Earnings credited 🎉');
    setActionLoading(false);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !order || !user) return;
    await supabase.from('messages').insert({
      order_id: order.id,
      sender_id: user.id,
      content: newMessage.trim(),
    });
    setNewMessage('');
  };

  const getUPILink = () => {
    if (!order?.upi_id) return null;
    const amount = Number(order.total_amount || 0);
    return `upi://pay?pa=${encodeURIComponent(order.upi_id)}&pn=CampusErrand&am=${amount}&cu=INR&tn=${encodeURIComponent(`Campus Errand: ${order.title}`)}`;
  };

  if (loading) {
    return (
      <div className="pt-20 flex justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="pt-20 text-center">
        <p className="text-muted-foreground">Order not found</p>
      </div>
    );
  }

  const status = statusConfig[order.status] || statusConfig.pending;
  const hasMapData = (order.pickup_latitude && order.pickup_longitude) || (order.delivery_latitude && order.delivery_longitude);
  const showMap = hasMapData && order.status !== 'pending' && order.status !== 'cancelled' && order.status !== 'confirmed';

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Route Map */}
        {showMap && (
          <Card className="shadow-card mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base flex items-center gap-2">
                <Navigation className="w-4 h-4 text-primary" /> Live Route
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <RouteMap
                pickupLat={order.pickup_latitude}
                pickupLng={order.pickup_longitude}
                deliveryLat={order.delivery_latitude}
                deliveryLng={order.delivery_longitude}
                currentLat={isDeliverer ? position?.latitude : null}
                currentLng={isDeliverer ? position?.longitude : null}
                pickupLabel={order.pickup_location}
                deliveryLabel={order.delivery_location}
              />
              {isDeliverer && position && (
                <p className="text-xs text-muted-foreground text-center mt-2">
                  📍 Your location is updating live
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Card className="shadow-card mb-4">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="font-heading text-lg">{order.title}</CardTitle>
              <Badge className={status.color}>{status.emoji} {status.label}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {order.description && <p className="text-sm text-muted-foreground">{order.description}</p>}

            {order.item_link && (
              <a href={order.item_link} target="_blank" rel="noopener noreferrer"
                className="text-sm text-primary flex items-center gap-1 hover:underline">
                <ExternalLink className="w-3 h-3" /> Item reference link
              </a>
            )}

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-primary shrink-0" />
                <span><strong>Pickup:</strong> {order.pickup_location}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-secondary shrink-0" />
                <span><strong>Deliver to:</strong> {order.delivery_location}</span>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-accent">
              <div className="flex items-center gap-1 font-heading font-bold text-lg">
                <IndianRupee className="w-5 h-5" />
                {Number(order.total_amount || 0).toFixed(0)}
              </div>
              <div className="text-xs text-muted-foreground">
                Item: ₹{Number(order.estimated_item_cost).toFixed(0)} + Tip: ₹{Number(order.delivery_fee).toFixed(0)}
              </div>
            </div>

            {requester && (
              <div className="flex items-center gap-2 text-sm">
                <User className="w-4 h-4 text-muted-foreground" />
                <span>Posted by <strong>{requester.full_name || 'Student'}</strong></span>
                {requester.average_rating && Number(requester.average_rating) > 0 && (
                  <span className="flex items-center gap-0.5 text-warning">
                    <Star className="w-3 h-3 fill-current" /> {Number(requester.average_rating).toFixed(1)}
                  </span>
                )}
              </div>
            )}

            {deliverer && (
              <div className="flex items-center gap-2 text-sm">
                <Package className="w-4 h-4 text-muted-foreground" />
                <span>Delivering: <strong>{deliverer.full_name || 'Student'}</strong></span>
              </div>
            )}

            <div className="text-xs text-muted-foreground">
              Posted {formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {order.status === 'pending' && !isRequester && (
                <Button onClick={acceptOrder} disabled={actionLoading} className="w-full">
                  {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Package className="w-4 h-4 mr-2" />}
                  Accept this Errand
                </Button>
              )}

              {isDeliverer && order.status === 'accepted' && (
                <Button onClick={() => updateStatus('picked_up')} disabled={actionLoading} className="w-full">
                  🛍️ Mark as Picked Up
                </Button>
              )}

              {isDeliverer && order.status === 'picked_up' && (
                <Button onClick={markDelivered} disabled={actionLoading} className="w-full">
                  📬 Mark as Delivered
                </Button>
              )}

              {isRequester && order.status === 'delivered' && (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Rate the deliverer:</p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <button key={s} onClick={() => setRating(s)}>
                          <Star className={`w-6 h-6 ${s <= rating ? 'fill-warning text-warning' : 'text-muted-foreground'}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button onClick={confirmDelivery} disabled={actionLoading} variant="success" className="w-full">
                    <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm Receipt & Credit ₹{Number(order.delivery_fee).toFixed(0)}
                  </Button>
                </div>
              )}

              {isRequester && (order.status === 'delivered' || order.status === 'confirmed') && order.upi_id && (
                <a href={getUPILink() || '#'} className="block">
                  <Button variant="outline" className="w-full">
                    <IndianRupee className="w-4 h-4 mr-2" /> Pay via UPI (₹{Number(order.total_amount || 0).toFixed(0)})
                  </Button>
                </a>
              )}

              {isRequester && order.status === 'pending' && (
                <Button variant="outline" onClick={() => updateStatus('cancelled')} disabled={actionLoading}
                  className="w-full text-destructive">
                  Cancel Errand
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Chat */}
        {(isRequester || isDeliverer) && order.status !== 'pending' && order.status !== 'cancelled' && (
          <Card className="shadow-card">
            <CardHeader className="pb-2">
              <CardTitle className="font-heading text-base">Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto mb-3">
                {messages.length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-4">No messages yet. Coordinate here!</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-2 rounded-lg text-sm max-w-[80%] ${
                        msg.sender_id === user?.id
                          ? 'ml-auto bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      {msg.content}
                    </div>
                  ))
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                />
                <Button size="icon" onClick={sendMessage}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  );
};

export default OrderDetail;
