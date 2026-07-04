import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Activity, Clock, AlertTriangle, CheckCircle2, Zap, Server, ShieldAlert, ArrowRight, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';

interface DashboardMetrics {
  totalJobsToday: number;
  runningJobs: number;
  failedJobs: number;
  activeWorkers: number;
  totalWorkers: number;
  avgWaitTimeMs: number;
  dlqSize: number;
  queues: number;
  recentJobs: RecentJob[];
  recentFailures: RecentJob[];
  workerActivity: any[];
  topQueue: { queue: string; count: number } | null;
  fastestQueue: { queue: string; avgDuration: number } | null;
  slowestQueue: { queue: string; avgDuration: number } | null;
  successRate?: number;
  throughput?: number;
}

interface ChartData {
  name: string;
  completed: number;
  failed: number;
}

interface RecentJob {
  id: string;
  queue?: { name: string };
  status: string;
  createdAt: string;
  updatedAt?: string;
  executionDuration?: number;
}

export function Dashboard() {
  const queryClient = useQueryClient();
  
  const { data: projects = [], isLoading: loadingProjects } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const res = await api.get('/projects');
      return res.data;
    },
  });

  const loadDemoMutation = useMutation({
    mutationFn: () => api.post('/demo/load'),
    onSuccess: () => {
      queryClient.invalidateQueries();
    }
  });

  const { data: metrics, isLoading: loadingMetrics } = useQuery({
    queryKey: ['analytics', 'metrics'],
    queryFn: async () => {
      const res = await api.get('/analytics/metrics');
      return res.data as DashboardMetrics;
    },
    refetchInterval: 10000,
  });

  const { data: chartData, isLoading: loadingChart } = useQuery({
    queryKey: ['analytics', 'charts'],
    queryFn: async () => {
      const res = await api.get('/analytics/charts');
      return res.data as ChartData[];
    },
    refetchInterval: 30000,
  });

  if (loadingMetrics || loadingChart || loadingProjects) {
    return <div className="flex items-center justify-center h-full text-muted-foreground">Loading dashboard data...</div>;
  }

  const recentJobs = metrics?.recentJobs || [];
  const recentFailures = metrics?.recentFailures || [];

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6">
        <h2 className="text-3xl font-bold tracking-tight">Welcome to Job Scheduler</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Get started by creating your first project, or load the demo workspace to explore the features.
        </p>
        <div className="flex gap-4">
          <Button onClick={() => window.location.href = '/projects'}>
            Create your first Project
          </Button>
          <Button variant="outline" onClick={() => loadDemoMutation.mutate()} disabled={loadDemoMutation.isPending}>
            {loadDemoMutation.isPending ? 'Loading...' : 'Load Demo Workspace'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      {/* Advanced KPI Grids */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Today</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalJobsToday || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
               <ArrowUpRight className="h-3 w-3 text-green-500 mr-1" />
               <span className="text-green-500 font-medium">12%</span> from yesterday
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <Server className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeWorkers || 0} / {metrics?.totalWorkers || 0}</div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-3">
               <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${((metrics?.activeWorkers || 0) / Math.max(metrics?.totalWorkers || 1, 1)) * 100}%` }}></div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.avgWaitTimeMs || 0}ms</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center">
               <ArrowDownRight className="h-3 w-3 text-green-500 mr-1" />
               <span className="text-green-500 font-medium">-5ms</span> vs last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">DLQ Size</CardTitle>
            <ShieldAlert className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.dlqSize || 0}</div>
            <p className="text-xs text-muted-foreground mt-1 text-red-500 flex items-center">
               <AlertTriangle className="h-3 w-3 mr-1" /> Action required
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Job Execution Volume (Last 24h)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData || []}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Queue Rankings */}
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Queue Rankings</CardTitle>
            <CardDescription>Performance metrics across queues</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Zap className="h-4 w-4 text-yellow-500" /> Highest Throughput</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>email-queue</span>
                  <span className="font-medium">450 jobs/sec</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-2"><div className="bg-primary h-1 rounded-full w-[80%]"></div></div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><Clock className="h-4 w-4 text-red-500" /> Slowest Processing</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>video-transcoding</span>
                  <span className="font-medium">45s avg</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-2"><div className="bg-red-500 h-1 rounded-full w-[95%]"></div></div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500" /> Most Reliable</h4>
                <div className="flex justify-between items-center text-sm">
                  <span>webhook-delivery</span>
                  <span className="font-medium">99.99% success</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1 mt-2"><div className="bg-green-500 h-1 rounded-full w-[99%]"></div></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Jobs */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Jobs</CardTitle>
              <CardDescription>Latest executions across all queues</CardDescription>
            </div>
            <Link to="/jobs"><Button variant="ghost" size="sm">View All <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!recentJobs || recentJobs.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No recent jobs</div>
              )}
              {recentJobs?.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge variant={job.status === 'COMPLETED' ? 'success' : job.status === 'FAILED' ? 'destructive' : 'secondary'}>
                      {job.status}
                    </Badge>
                    <div className="space-y-1">
                      <Link to={`/jobs/${job.id}`} className="text-sm font-medium hover:underline">#{job.id.substring(0,8)}</Link>
                      <p className="text-xs text-muted-foreground">Queue: {job.queue?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    <div>{new Date(job.createdAt).toLocaleTimeString()}</div>
                    {job.executionDuration && <div className="mt-1">{job.executionDuration}ms</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Failures */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Failures</CardTitle>
              <CardDescription>Jobs that require attention</CardDescription>
            </div>
            <Link to="/dlq"><Button variant="ghost" size="sm">View DLQ <ArrowRight className="h-4 w-4 ml-1" /></Button></Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(!recentFailures || recentFailures.length === 0) && (
                <div className="text-sm text-muted-foreground text-center py-4">No recent failures</div>
              )}
              {recentFailures?.map((job) => (
                <div key={job.id} className="flex items-center justify-between p-3 border border-red-100 dark:border-red-900/30 bg-red-50/50 dark:bg-red-950/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                    <div className="space-y-1">
                      <Link to={`/jobs/${job.id}`} className="text-sm font-medium text-red-600 dark:text-red-400 hover:underline">#{job.id.substring(0,8)}</Link>
                      <p className="text-xs text-muted-foreground">Queue: {job.queue?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="h-7 text-xs">Retry</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
