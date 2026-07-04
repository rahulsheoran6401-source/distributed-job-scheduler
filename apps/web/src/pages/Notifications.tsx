import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, Check } from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export function Notifications() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response: any = await api.get('/notifications');
      return response.data.data || response.data;
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-read'),
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading notifications...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bell className="h-8 w-8" /> Notifications
        </h2>
        {notifications.length > 0 && (
          <Button variant="outline" onClick={() => markAllReadMutation.mutate()} disabled={markAllReadMutation.isPending}>
            <Check className="h-4 w-4 mr-2" /> Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center text-muted-foreground">
              You have no notifications.
            </CardContent>
          </Card>
        ) : (
          notifications.map((notif: any) => (
            <Card key={notif.id} className={notif.read ? 'opacity-75' : ''}>
              <CardContent className="p-4 flex items-start gap-4">
                <div className={`mt-1 h-2 w-2 rounded-full ${notif.read ? 'bg-transparent' : 'bg-primary'}`} />
                <div className="flex-1">
                  <h4 className="font-semibold">{notif.title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
