import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, Filter } from 'lucide-react';
import { api } from '../lib/api';

interface ThroughputData {
  time: string;
  throughput: number;
}

export function Analytics() {
  const [dateFilter, setDateFilter] = useState('24h');
  const [queueFilter, setQueueFilter] = useState('all');
  const [projectFilter, setProjectFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['analytics', 'throughput', dateFilter, queueFilter, projectFilter],
    queryFn: async () => {
      const res = await api.get('/analytics/throughput', {
        params: { timeframe: dateFilter, queue: queueFilter, project: projectFilter }
      });
      return res.data as ThroughputData[];
    },
    refetchInterval: 10000,
  });

  const exportCSV = () => {
    if (!data) return;
    const csv = 'Time,Throughput\n' + data.map(d => `${d.time},${d.throughput}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `throughput-analytics-${dateFilter}.csv`;
    a.click();
  };

  const exportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={exportCSV}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={exportPDF}>
            <Download className="mr-2 h-4 w-4" /> Export PDF
          </Button>
        </div>
      </div>
      
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Timeframe</label>
              <select 
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="1h">Last 1 Hour</option>
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Project</label>
              <select 
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={projectFilter}
                onChange={(e) => setProjectFilter(e.target.value)}
              >
                <option value="all">All Projects</option>
                <option value="default">Default Project</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm text-muted-foreground">Queue</label>
              <select 
                className="flex h-9 w-32 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={queueFilter}
                onChange={(e) => setQueueFilter(e.target.value)}
              >
                <option value="all">All Queues</option>
                <option value="emails">Emails</option>
                <option value="reports">Reports</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>System Throughput (Jobs/sec)</CardTitle>
            <CardDescription>Live job processing throughput based on selected filters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              {isLoading ? (
                <div className="h-full flex items-center justify-center text-muted-foreground">Loading chart data...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorThroughput" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <Tooltip />
                    <Area type="monotone" dataKey="throughput" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorThroughput)" />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
