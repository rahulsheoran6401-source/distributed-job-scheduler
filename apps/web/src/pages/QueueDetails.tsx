import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, Play, Pause, Settings, Activity, List, LayoutDashboard, RefreshCw, Zap, AlertCircle } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export function QueueDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: queue, isLoading } = useQuery({
    queryKey: ['queue', id],
    queryFn: async () => {
      const response: any = await api.get(`/queues/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const pauseMutation = useMutation({
    mutationFn: () => api.post(`/queues/${id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', id] });
      toast.success('Queue paused');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: () => api.post(`/queues/${id}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queue', id] });
      toast.success('Queue resumed');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/queues/${id}`),
    onSuccess: () => {
      toast.success('Queue deleted');
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      navigate('/queues');
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading queue details...</div>;
  if (!queue) return <div className="p-8 text-center">Queue not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'jobs', label: 'Jobs', icon: List },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/queues">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight flex-1">
          {queue.name}
        </h2>
        <div className="flex gap-2">
          {queue.isPaused ? (
            <Button variant="outline" onClick={() => resumeMutation.mutate()} disabled={resumeMutation.isPending}>
              <Play className="h-4 w-4 mr-2" /> Resume
            </Button>
          ) : (
            <Button variant="outline" onClick={() => pauseMutation.mutate()} disabled={pauseMutation.isPending}>
              <Pause className="h-4 w-4 mr-2" /> Pause
            </Button>
          )}
          <Button 
            variant="destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this queue?')) {
                deleteMutation.mutate();
              }
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
              activeTab === tab.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Queue Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={queue.isPaused ? 'warning' : 'success'} className="mt-1">
                  {queue.isPaused ? 'Paused' : 'Active'}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Project</p>
                <p className="mt-1">
                  {queue.project ? (
                    <Link to={`/projects/${queue.project.id}`} className="text-primary hover:underline">
                      {queue.project.name}
                    </Link>
                  ) : 'Unknown'}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="mt-1 text-sm">{new Date(queue.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Jobs in Queue</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="flex justify-around py-6 text-center">
                 <div>
                   <p className="text-4xl font-bold">{queue.stats?.waiting || 0}</p>
                   <p className="text-sm text-muted-foreground mt-2">Waiting (Queued)</p>
                 </div>
                 <div>
                   <p className="text-4xl font-bold text-primary">{queue.stats?.active || 0}</p>
                   <p className="text-sm text-muted-foreground mt-2">Active (Running)</p>
                 </div>
               </div>
               <div className="text-center mt-4 border-t border-border pt-4">
                 <Link to={`/jobs?queue=${queue.id}`}>
                   <Button variant="outline" className="mt-2 w-full">View all jobs in this queue</Button>
                 </Link>
               </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'settings' && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Retry Policy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Retries</p>
                <p className="mt-1 text-xl font-semibold">{queue.settings?.maxRetries ?? 3}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Backoff Strategy</p>
                <p className="mt-1 font-medium capitalize">{queue.settings?.backoffStrategy ?? 'exponential'}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-4 w-4" /> Concurrency</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Max Concurrent Jobs</p>
                <p className="mt-1 text-xl font-semibold">{queue.settings?.concurrency ?? 10}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertCircle className="h-4 w-4" /> Priority</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue Priority Level</p>
                <p className="mt-1 text-xl font-semibold">{queue.priority ?? 'Normal'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'jobs' && (
        <Card>
          <CardHeader>
             <CardTitle>Recent Jobs</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Job list will be rendered here...</p>
          </CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader>
             <CardTitle>Queue Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground">Activity logs for this queue will appear here.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
