import { useAuth } from '@/contexts/AuthContext';
import { Package, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const TopBar = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-lg border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Package className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-heading font-bold text-lg text-gradient">Campus Errand</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }}
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </header>
  );
};

export default TopBar;
