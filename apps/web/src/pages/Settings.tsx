import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export function Settings() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'account' | 'notifications' | 'preferences'>('account');
  const [updatingProfile, setUpdatingProfile] = useState(false);
  const [updatingPassword, setUpdatingPassword] = useState(false);

  const { register: registerProfile, handleSubmit: handleProfile, formState: { errors: profileErrors } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
    }
  });

  const { register: registerPassword, handleSubmit: handlePassword, formState: { errors: passwordErrors }, reset: resetPassword } = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema)
  });

  const onProfileSubmit = async (data: z.infer<typeof profileSchema>) => {
    try {
      setUpdatingProfile(true);
      await api.put('/auth/update', data);
      toast.success('Profile updated successfully');
      // In a real app we'd want to refresh the user context here
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setUpdatingProfile(false);
    }
  };

  const onPasswordSubmit = async (data: z.infer<typeof passwordSchema>) => {
    try {
      setUpdatingPassword(true);
      await api.put('/auth/password', data);
      toast.success('Password changed successfully');
      resetPassword();
    } catch (err) {
      // Error handled by interceptor
    } finally {
      setUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>

      <div className="flex space-x-1 border-b">
        <button 
          onClick={() => setActiveTab('account')} 
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'account' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Account
        </button>
        <button 
          onClick={() => setActiveTab('notifications')} 
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'notifications' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Notifications
        </button>
        <button 
          onClick={() => setActiveTab('preferences')} 
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${activeTab === 'preferences' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Preferences
        </button>
      </div>
      
      {activeTab === 'account' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleProfile(onProfileSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Email Address (Read-only)</label>
                  <input type="email" disabled className="w-full p-2 rounded-md border bg-muted/50 cursor-not-allowed" value={user?.email || ''} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Full Name</label>
                  <input type="text" {...registerProfile('name')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  {profileErrors.name && <p className="text-sm text-red-500">{profileErrors.name.message}</p>}
                </div>
                <Button type="submit" disabled={updatingProfile}>
                  {updatingProfile ? 'Saving...' : 'Save Profile'}
                </Button>
              </form>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>Ensure your account is using a long, random password to stay secure.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePassword(onPasswordSubmit)} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Current Password</label>
                  <input type="password" {...registerPassword('currentPassword')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  {passwordErrors.currentPassword && <p className="text-sm text-red-500">{passwordErrors.currentPassword.message}</p>}
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">New Password</label>
                  <input type="password" {...registerPassword('newPassword')} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50" />
                  {passwordErrors.newPassword && <p className="text-sm text-red-500">{passwordErrors.newPassword.message}</p>}
                </div>
                <Button type="submit" disabled={updatingPassword}>
                  {updatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger Zone</CardTitle>
              <CardDescription>Irreversible actions</CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="destructive" onClick={() => {
                if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
                  toast.error('Not implemented in this demo');
                }
              }}>Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notification Preferences</CardTitle>
            <CardDescription>Choose what notifications you want to receive</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive daily digests of your job statuses.</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System Alerts</p>
                <p className="text-sm text-muted-foreground">Get notified when queue gets stuck or workers fail.</p>
              </div>
              <input type="checkbox" className="h-4 w-4 rounded border-gray-300" defaultChecked />
            </div>
            <Button className="mt-4">Save Preferences</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>General Preferences</CardTitle>
            <CardDescription>Customize your workspace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Timezone</label>
              <select className="w-full md:w-1/2 p-2 rounded-md border bg-transparent">
                <option>UTC</option>
                <option>America/New_York</option>
                <option>Europe/London</option>
                <option>Asia/Kolkata</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Date Format</label>
              <select className="w-full md:w-1/2 p-2 rounded-md border bg-transparent">
                <option>MM/DD/YYYY</option>
                <option>DD/MM/YYYY</option>
                <option>YYYY-MM-DD</option>
              </select>
            </div>
            <Button className="mt-4">Save Settings</Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}