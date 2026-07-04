import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { useEffect, useState } from 'react';
import { Activity, Database, Clock, Server } from 'lucide-react';
import { useSocket } from '../contexts/SocketContext';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Monitoring() {
  const [logs, setLogs] = useState<string[]>([]);
  const { socket, isConnected } = useSocket();

  const { data: status } = useQuery({
    queryKey: ['monitoring-status'],
    queryFn: async () => {
      const response: any = await api.get('/monitoring/status');
      return response.data.data || response.data;
    },
    refetchInterval: 10000,
  });
  
  useEffect(() => {
    if (!socket) return;

    const handleEvent = (event: string) => (data: any) => {
      setLogs(prev => {
        const time = new Date().toLocaleTimeString();
        let msg = `[${time}] ${event}: `;
        if (typeof data === 'object') {
          msg += JSON.stringify(data);
        } else {
          msg += String(data);
        }
        const updated = [msg, ...prev];
        return updated.slice(0, 100);
      });
    };

    socket.on('job:completed', handleEvent('JOB_COMPLETED'));
    socket.on('job:failed', handleEvent('JOB_FAILED'));
    socket.on('job:started', handleEvent('JOB_STARTED'));
    socket.on('worker:heartbeat', handleEvent('WORKER_HEARTBEAT'));
    socket.on('system:metric', handleEvent('SYS_METRIC'));

    return () => {
      socket.off('job:completed');
      socket.off('job:failed');
      socket.off('job:started');
      socket.off('worker:heartbeat');
      socket.off('system:metric');
    };
  }, [socket]);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Activity className="mr-3 h-8 w-8 text-primary animate-pulse" />
          Live System Monitoring
        </h2>
        <div className={`flex items-center gap-2 text-sm font-medium ${isConnected ? 'text-green-500' : 'text-red-500'}`}>
          <span className="relative flex h-3 w-3">
            {isConnected && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          </span>
          {isConnected ? 'WebSocket Connected' : 'Disconnected'}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database (PostgreSQL)</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.postgres?.status === 'ok' ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Latency: {status?.postgres?.latency || '0'}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Redis Cache</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.redis?.status === 'ok' ? 'Online' : 'Offline'}
            </div>
            <p className="text-xs text-muted-foreground">
              Latency: {status?.redis?.latency || '0'}ms
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduler</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {status?.scheduler?.status === 'ok' ? 'Active' : 'Stopped'}
            </div>
            <p className="text-xs text-muted-foreground">
              Next tick: {status?.scheduler?.nextTick || 'N/A'}
            </p>
          </CardContent>
        </Card>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden min-h-[500px]">
        <CardHeader>
          <CardTitle>Real-time Stream</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden bg-slate-950 p-4 m-6 mt-0 rounded-lg text-slate-300 font-mono text-sm relative shadow-inner">
          <div className="absolute inset-0 p-4 overflow-y-auto space-y-1">
            {logs.length === 0 ? <p className="text-slate-500 italic">Waiting for events from active workers...</p> : null}
            {logs.map((log, i) => (
              <p key={i} className="whitespace-pre-wrap">{log}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}