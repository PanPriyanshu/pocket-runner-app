import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { Home, PlusCircle, User, MapPin, MessageSquare } from 'lucide-react';

const BottomNav = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const links = [
    { to: '/feed', icon: Home, label: 'Feed' },
    { to: '/map', icon: MapPin, label: 'Map' },
    { to: '/create', icon: PlusCircle, label: 'Post' },
    { to: '/my-orders', icon: MessageSquare, label: 'Orders' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
        {links.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${to === '/create' ? 'w-7 h-7' : ''}`} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
