import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { User, Star, Package, IndianRupee, Edit2, Check, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

const Profile = () => {
  const { profile, refreshProfile, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    college_name: profile?.college_name || '',
    hostel_room: profile?.hostel_room || '',
    phone: profile?.phone || '',
  });

  // Refresh profile data when page is visited
  useEffect(() => {
    refreshProfile();
  }, []);

  const handleSave = async () => {
    if (!user) return;
    const { error } = await supabase
      .from('profiles')
      .update(form)
      .eq('user_id', user.id);
    if (error) {
      toast.error('Failed to update profile');
    } else {
      toast.success('Profile updated!');
      await refreshProfile();
      setEditing(false);
    }
  };

  if (!profile) return null;

  const stats = [
    { icon: Package, label: 'Deliveries', value: profile.total_deliveries || 0 },
    { icon: User, label: 'Requests', value: profile.total_requests || 0 },
    { icon: IndianRupee, label: 'Earned', value: `₹${Number(profile.total_earnings || 0).toFixed(0)}` },
    { icon: Star, label: 'Rating', value: Number(profile.average_rating || 0) > 0 ? Number(profile.average_rating).toFixed(1) : '—' },
  ];

  return (
    <div className="pt-16 pb-20 px-4 max-w-lg mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="shadow-card mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-2xl font-heading font-bold">
                {(profile.full_name || 'S').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <h2 className="font-heading font-bold text-lg">{profile.full_name || 'Student'}</h2>
                <p className="text-sm text-muted-foreground">{profile.student_email}</p>
                {profile.is_verified && (
                  <div className="flex items-center gap-1 text-xs text-primary mt-0.5">
                    <ShieldCheck className="w-3 h-3" /> Verified Student
                  </div>
                )}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setEditing(!editing)}>
                {editing ? <Check className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {stats.map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center p-3 rounded-lg bg-muted">
                  <Icon className="w-5 h-5 mx-auto mb-1 text-primary" />
                  <p className="font-heading font-bold text-lg">{value}</p>
                  <p className="text-[10px] text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {editing && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="font-heading text-base">Edit Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label>Full Name</Label>
                  <Input value={form.full_name} onChange={(e) => setForm((f) => ({ ...f, full_name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>College</Label>
                  <Input value={form.college_name} onChange={(e) => setForm((f) => ({ ...f, college_name: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Hostel / Room</Label>
                  <Input value={form.hostel_room} onChange={(e) => setForm((f) => ({ ...f, hostel_room: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
                </div>
                <Button onClick={handleSave} className="w-full">Save Changes</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default Profile;
