import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft, IndianRupee, MapPin, Send, LocateFixed } from 'lucide-react';
import { Constants } from '@/integrations/supabase/types';
import { motion } from 'framer-motion';
import { useGeolocation } from '@/hooks/useGeolocation';

const CATEGORIES = Constants.public.Enums.item_category;

const categoryEmoji: Record<string, string> = {
  stationery: '✏️', food: '🍕', medicine: '💊',
  electronics: '🔌', groceries: '🛒', clothing: '👕', other: '📦',
};

const CreateOrder = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { position, requestPosition, loading: geoLoading } = useGeolocation();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'other' as string,
    estimated_item_cost: '',
    delivery_fee: '50',
    pickup_location: '',
    delivery_location: '',
    upi_id: '',
    item_link: '',
    pickup_latitude: null as number | null,
    pickup_longitude: null as number | null,
    delivery_latitude: null as number | null,
    delivery_longitude: null as number | null,
  });

  const suggestTip = (cost: number) => {
    if (cost <= 100) return 30;
    if (cost <= 300) return 50;
    return 70;
  };

  const handleCostChange = (val: string) => {
    const cost = parseFloat(val) || 0;
    setForm((f) => ({
      ...f,
      estimated_item_cost: val,
      delivery_fee: String(suggestTip(cost)),
    }));
  };

  const useCurrentAsDelivery = () => {
    if (position) {
      setForm((f) => ({
        ...f,
        delivery_latitude: position.latitude,
        delivery_longitude: position.longitude,
      }));
      toast.success('Current location set as delivery point');
    } else {
      requestPosition();
    }
  };

  // When position becomes available after requesting
  useEffect(() => {
    if (position && !form.delivery_latitude) {
      setForm((f) => ({
        ...f,
        delivery_latitude: position.latitude,
        delivery_longitude: position.longitude,
      }));
      toast.success('Current location set as delivery point');
    }
  }, [position]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.pickup_location || !form.delivery_location) {
      toast.error('Please fill in required fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.from('orders').insert({
      requester_id: user.id,
      title: form.title,
      description: form.description,
      category: form.category as any,
      estimated_item_cost: parseFloat(form.estimated_item_cost) || 0,
      delivery_fee: parseFloat(form.delivery_fee) || 30,
      pickup_location: form.pickup_location,
      delivery_location: form.delivery_location,
      pickup_latitude: form.pickup_latitude,
      pickup_longitude: form.pickup_longitude,
      delivery_latitude: form.delivery_latitude,
      delivery_longitude: form.delivery_longitude,
      upi_id: form.upi_id,
      item_link: form.item_link || null,
    });

    if (error) {
      toast.error('Failed to create errand');
    } else {
      toast.success('Errand posted! 🎉');
      navigate('/feed');
    }
    setLoading(false);
  };

  const total = (parseFloat(form.estimated_item_cost) || 0) + (parseFloat(form.delivery_fee) || 0);

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="font-heading">Post an Errand</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>What do you need? *</Label>
                <Input
                  placeholder="e.g., Cello Gripper pen, blue"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {categoryEmoji[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Details / Instructions</Label>
                <Textarea
                  placeholder="Brand preference, size, quantity, etc."
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Item link (optional)</Label>
                <Input
                  placeholder="https://..."
                  value={form.item_link}
                  onChange={(e) => setForm((f) => ({ ...f, item_link: e.target.value }))}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> Item Cost *
                  </Label>
                  <Input
                    type="number"
                    placeholder="200"
                    value={form.estimated_item_cost}
                    onChange={(e) => handleCostChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    <IndianRupee className="w-3 h-3" /> Delivery Tip
                  </Label>
                  <Input
                    type="number"
                    placeholder="50"
                    value={form.delivery_fee}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_fee: e.target.value }))}
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-accent text-accent-foreground text-sm">
                Total: <span className="font-bold font-heading">₹{total.toFixed(0)}</span>
                <span className="text-xs ml-1">(item + tip to deliverer)</span>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-primary" /> Pickup Location *
                </Label>
                <Input
                  placeholder="e.g., Sharma Stationery, Main Market"
                  value={form.pickup_location}
                  onChange={(e) => setForm((f) => ({ ...f, pickup_location: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-secondary" /> Delivery Location *
                </Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., Room 204, Boys Hostel 3"
                    value={form.delivery_location}
                    onChange={(e) => setForm((f) => ({ ...f, delivery_location: e.target.value }))}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={useCurrentAsDelivery}
                    disabled={geoLoading}
                    title="Use my current location"
                  >
                    <LocateFixed className={`w-4 h-4 ${geoLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                {form.delivery_latitude && (
                  <p className="text-xs text-muted-foreground">
                    📍 GPS: {form.delivery_latitude.toFixed(5)}, {form.delivery_longitude?.toFixed(5)}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Your UPI ID (for payment)</Label>
                <Input
                  placeholder="yourname@upi"
                  value={form.upi_id}
                  onChange={(e) => setForm((f) => ({ ...f, upi_id: e.target.value }))}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                <Send className="w-4 h-4 mr-2" />
                {loading ? 'Posting...' : 'Post Errand'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default CreateOrder;
