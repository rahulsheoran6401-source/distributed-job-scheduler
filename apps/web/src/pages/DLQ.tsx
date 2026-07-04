import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';
import { api } from '../lib/api';
import { toast } from 'react-hot-toast';

interface FailedJob {
  id: string;
  queueId: string;
  queue: { name: string };
  payload: any;
  error: string;
  failedAt: string;
}

export function DLQ() {
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['dlq'],
    queryFn: async () => {
      const res = await api.get('/dlq');
      return res.data as FailedJob[];
    },
    refetchInterval: 10000,
  });

  const retryMutation = useMutation({
    mutationFn: async (id: string | 'all') => {
      if (id === 'all') {
        await api.post('/dlq/retry', { jobIds: jobs?.map(j => j.id) || [] });
      } else {
        await api.post('/dlq/retry', { jobIds: [id] });
      }
    },
    onSuccess: () => {
      toast.success('Job(s) queued for retry');
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
    },
    onError: () => toast.error('Failed to retry job(s)'),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string | 'all') => {
      if (id === 'all') {
        await api.delete('/dlq');
      } else {
        await api.delete(`/dlq/${id}`);
      }
    },
    onSuccess: () => {
      toast.success('Job(s) deleted permanently');
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
    },
    onError: () => toast.error('Failed to delete job(s)'),
  });

  if (isLoading) {
    return <div className="flex h-full items-center justify-center">Loading DLQ...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">Dead Letter Queue (DLQ)</h2>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            disabled={!jobs?.length || retryMutation.isPending}
            onClick={() => retryMutation.mutate('all')}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Replay All
          </Button>
          <Button 
            variant="destructive"
            disabled={!jobs?.length || deleteMutation.isPending}
            onClick={() => {
              if (window.confirm('Are you sure you want to purge all failed jobs? This cannot be undone.')) {
                deleteMutation.mutate('all');
              }
            }}
          >
            <Trash2 className="mr-2 h-4 w-4" /> Purge
          </Button>
        </div>
      </div>
      
      {!jobs || jobs.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground bg-card rounded-lg border">
          No failed jobs in the DLQ.
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job.id} className="border-red-200 dark:border-red-900/50">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{job.id}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Queue: {job.queue?.name || job.queueId} • Failed at: {new Date(job.failedAt).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      disabled={retryMutation.isPending}
                      onClick={() => retryMutation.mutate(job.id)}
                    >
                      Replay
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-red-600 hover:text-red-700"
                      disabled={deleteMutation.isPending}
                      onClick={() => {
                        if (window.confirm('Delete this failed job?')) {
                          deleteMutation.mutate(job.id);
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 p-4 rounded-lg text-sm font-mono overflow-x-auto whitespace-pre-wrap">
                  {job.error || 'Unknown error occurred'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
