import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Server, PowerOff } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface Worker {
  id: string;
  status: 'ONLINE' | 'DRAINING' | 'OFFLINE';
  lastHeartbeat: string;
  concurrency: number;
  activeJobs: number;
}

export function Workers() {
  const queryClient = useQueryClient();

  const { data: workers, isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: async () => {
      const res = await api.get('/workers');
      return res.data as Worker[];
    },
    refetchInterval: 5000,
  });

  const drainMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.post(`/workers/${id}/drain`);
    },
    onSuccess: () => {
      toast.success('Worker is now draining');
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    },
    onError: () => {
      toast.error('Failed to drain worker');
    }
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading workers...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Workers</h2>
      </div>
      
      {!workers || workers.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          No active workers found. Start a worker node to see it here.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {workers.map((worker) => (
            <Card key={worker.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold flex items-center">
                  <Server className="h-4 w-4 mr-2 text-primary" />
                  {worker.id}
                </CardTitle>
                <Badge 
                  variant={worker.status === 'ONLINE' ? 'success' : worker.status === 'DRAINING' ? 'warning' : 'destructive'}
                >
                  {worker.status}
                </Badge>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Active Jobs</span>
                    <span className="font-medium">{worker.activeJobs} / {worker.concurrency}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Last Heartbeat</span>
                    <span className="font-medium">{new Date(worker.lastHeartbeat).toLocaleTimeString()}</span>
                  </div>
                </div>
                
                <div className="pt-2 border-t flex justify-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={worker.status !== 'ONLINE' || drainMutation.isPending}
                    onClick={() => {
                      if (window.confirm('Are you sure you want to drain this worker? It will finish current jobs and stop accepting new ones.')) {
                        drainMutation.mutate(worker.id);
                      }
                    }}
                  >
                    <PowerOff className="h-4 w-4 mr-2" /> Drain
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
