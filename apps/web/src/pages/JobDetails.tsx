import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Trash, XCircle, Code, FileText, AlertTriangle, History, Clock } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('payload');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: async () => {
      const response: any = await api.get(`/jobs/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const retryMutation = useMutation({
    mutationFn: () => api.post(`/jobs/${id}/retry`),
    onSuccess: () => {
      toast.success('Job retry initiated');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    }
  });

  const cancelMutation = useMutation({
    mutationFn: () => api.post(`/jobs/${id}/cancel`),
    onSuccess: () => {
      toast.success('Job cancelled');
      queryClient.invalidateQueries({ queryKey: ['job', id] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/jobs/${id}`),
    onSuccess: () => {
      toast.success('Job deleted');
      navigate('/jobs');
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading job details...</div>;
  if (!job) return <div className="p-8 text-center">Job not found</div>;

  const tabs = [
    { id: 'payload', label: 'Payload', icon: Code },
    { id: 'logs', label: 'Execution Logs', icon: FileText },
    { id: 'timeline', label: 'Timeline', icon: Clock },
    { id: 'retries', label: 'Retry History', icon: History },
  ];

  if (job.error) {
    tabs.splice(1, 0, { id: 'error', label: 'Error Message', icon: AlertTriangle });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight flex-1 flex items-center gap-2">
          Job Details <span className="text-muted-foreground text-xl font-normal">#{id}</span>
          <Badge 
            variant={job.status === 'FAILED' ? 'destructive' : job.status === 'COMPLETED' ? 'success' : 'secondary'} 
            className="ml-2"
          >
            {job.status}
          </Badge>
        </h2>
        <div className="flex gap-2">
          {job.status !== 'COMPLETED' && job.status !== 'CANCELLED' && (
            <Button 
              variant="outline" 
              onClick={() => cancelMutation.mutate()}
              disabled={cancelMutation.isPending}
            >
              <XCircle className="h-4 w-4 mr-2" /> Cancel
            </Button>
          )}
          <Button 
            variant="outline" 
            onClick={() => retryMutation.mutate()}
            disabled={retryMutation.isPending}
          >
            <RefreshCw className="h-4 w-4 mr-2" /> Retry
          </Button>
          <Button 
            variant="destructive"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this job?')) deleteMutation.mutate();
            }}
            disabled={deleteMutation.isPending}
          >
            <Trash className="h-4 w-4 mr-2" /> Delete
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-1 md:col-span-3">
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queue</p>
                <p className="font-medium mt-1">{job.queue}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="font-medium mt-1">{job.type || 'immediate'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm mt-1">{new Date(job.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Attempts</p>
                <p className="font-medium mt-1">{job.attempts || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="col-span-1 md:col-span-3">
          <div className="flex border-b border-border overflow-x-auto pb-1 mb-6">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id 
                    ? tab.id === 'error' ? 'border-red-500 text-red-500' : 'border-primary text-primary' 
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'payload' && (
            <Card>
              <CardContent className="pt-6">
                <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(job.payload, null, 2) || '{}'}
                </pre>
              </CardContent>
            </Card>
          )}

          {activeTab === 'error' && job.error && (
            <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-900">
              <CardContent className="pt-6">
                <p className="text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">{job.error}</p>
              </CardContent>
            </Card>
          )}

          {activeTab === 'logs' && (
            <Card>
              <CardContent className="pt-6">
                {job.logs && job.logs.length > 0 ? (
                  <div className="bg-slate-950 text-slate-300 p-4 rounded-lg text-sm font-mono space-y-2">
                    {job.logs.map((log: any, idx: number) => (
                      <p key={idx}>[{new Date(log.timestamp).toLocaleTimeString()}] {log.message}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No execution logs available.</p>
                )}
              </CardContent>
            </Card>
          )}

          {activeTab === 'timeline' && (
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-32 text-sm text-muted-foreground text-right">{new Date(job.createdAt).toLocaleString()}</div>
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <div className="font-medium">Job Created</div>
                  </div>
                  {job.startedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm text-muted-foreground text-right">{new Date(job.startedAt).toLocaleString()}</div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      <div className="font-medium">Job Started</div>
                    </div>
                  )}
                  {job.finishedAt && (
                    <div className="flex items-center gap-4">
                      <div className="w-32 text-sm text-muted-foreground text-right">{new Date(job.finishedAt).toLocaleString()}</div>
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <div className="font-medium">Job Finished</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'retries' && (
            <Card>
              <CardContent className="pt-6">
                {job.retries && job.retries.length > 0 ? (
                  <div className="space-y-4">
                    {job.retries.map((retry: any, idx: number) => (
                      <div key={idx} className="flex justify-between items-center p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">Attempt #{idx + 1}</p>
                          <p className="text-sm text-muted-foreground">{new Date(retry.timestamp).toLocaleString()}</p>
                        </div>
                        <Badge variant={retry.status === 'FAILED' ? 'destructive' : 'secondary'}>{retry.status}</Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-8">No retry history available.</p>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}