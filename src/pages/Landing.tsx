import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Package, ArrowRight, ShoppingBag, IndianRupee, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const Landing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  if (user) {
    navigate('/feed');
    return null;
  }

  const features = [
    { icon: ShoppingBag, title: 'Request Anything', desc: 'Pens, medicines, snacks — from shops nearby your campus' },
    { icon: IndianRupee, title: 'Earn Pocket Money', desc: 'Pick up errands and earn ₹30-100 per delivery' },
    { icon: Users, title: 'Students Only', desc: 'Verified college students. Safe & trusted community' },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-6">
            <Package className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold font-heading mb-3">
            <span className="text-gradient">Campus Errand</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-sm mx-auto">
            Get offline items delivered by fellow students. Earn pocket money on your schedule.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="space-y-4 mb-10"
        >
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.1 }}
              className="flex items-start gap-4 p-4 rounded-xl bg-card shadow-card"
            >
              <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-heading font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="space-y-3"
        >
          <Button
            onClick={() => navigate('/auth')}
            className="w-full h-12 text-base font-heading"
          >
            Get Started <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Free for all college students in India 🇮🇳
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
