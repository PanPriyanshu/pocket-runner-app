import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Clock, IndianRupee, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

type Order = Tables<'orders'>;

const categoryColors: Record<string, string> = {
  stationery: 'bg-info/10 text-info border-info/20',
  food: 'bg-warning/10 text-warning border-warning/20',
  medicine: 'bg-destructive/10 text-destructive border-destructive/20',
  electronics: 'bg-primary/10 text-primary border-primary/20',
  groceries: 'bg-success/10 text-success border-success/20',
  clothing: 'bg-secondary/10 text-secondary border-secondary/20',
  other: 'bg-muted text-muted-foreground border-border',
};

const categoryEmoji: Record<string, string> = {
  stationery: '✏️',
  food: '🍕',
  medicine: '💊',
  electronics: '🔌',
  groceries: '🛒',
  clothing: '👕',
  other: '📦',
};

interface OrderCardProps {
  order: Order;
  requesterName?: string;
  index?: number;
}

const OrderCard = ({ order, requesterName, index = 0 }: OrderCardProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className="shadow-card hover:shadow-card-hover transition-all cursor-pointer active:scale-[0.98]"
        onClick={() => navigate(`/order/${order.id}`)}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-base truncate">
                {categoryEmoji[order.category]} {order.title}
              </h3>
              {requesterName && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                  <User className="w-3 h-3" />
                  <span>{requesterName}</span>
                </div>
              )}
            </div>
            <Badge className={categoryColors[order.category] || categoryColors.other}>
              {order.category}
            </Badge>
          </div>

          {order.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{order.description}</p>
          )}

          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-primary" />
              <span className="truncate max-w-[120px]">{order.pickup_location}</span>
            </div>
            <span>→</span>
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-secondary" />
              <span className="truncate max-w-[120px]">{order.delivery_location}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 font-heading font-bold text-primary">
              <IndianRupee className="w-4 h-4" />
              <span>{Number(order.total_amount || 0).toFixed(0)}</span>
              <span className="text-xs font-normal text-muted-foreground ml-1">
                (₹{Number(order.estimated_item_cost).toFixed(0)} + ₹{Number(order.delivery_fee).toFixed(0)} tip)
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span>{formatDistanceToNow(new Date(order.created_at), { addSuffix: true })}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default OrderCard;
