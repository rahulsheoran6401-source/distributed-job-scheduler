import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trash2, LayoutDashboard, List, Activity, Settings, Users, BarChart3, Layers } from 'lucide-react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import toast from 'react-hot-toast';

export function ProjectDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('overview');

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: async () => {
      const response: any = await api.get(`/projects/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/projects/${id}`),
    onSuccess: () => {
      toast.success('Project deleted');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      navigate('/projects');
    }
  });

  if (isLoading) return <div className="p-8 text-center">Loading project details...</div>;
  if (!project) return <div className="p-8 text-center">Project not found</div>;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'queues', label: 'Queues', icon: Layers },
    { id: 'jobs', label: 'Jobs', icon: List },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'activity', label: 'Activity', icon: Activity },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/projects">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight flex-1">
          {project.name}
        </h2>
        <Button 
          variant="destructive"
          onClick={() => {
            if (window.confirm('Are you sure you want to delete this project?')) {
              deleteMutation.mutate();
            }
          }}
          disabled={deleteMutation.isPending}
        >
          <Trash2 className="h-4 w-4 mr-2" /> Delete Project
        </Button>
      </div>

      <div className="flex border-b border-border overflow-x-auto pb-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center whitespace-nowrap gap-2 px-4 py-2 border-b-2 font-medium text-sm ${
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
              <CardTitle>Project Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Description</p>
                <p className="mt-1">{project.description || 'No description'}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">ID</p>
                <p className="mt-1 font-mono text-sm">{project.id}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="mt-1 text-sm">{new Date(project.createdAt || Date.now()).toLocaleString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Total Queues</p>
                  <p className="text-2xl font-bold mt-1">{project.queues?.length || 0}</p>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm font-medium text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold mt-1">0</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'queues' && (
        <Card>
          <CardHeader>
            <CardTitle>Associated Queues</CardTitle>
          </CardHeader>
          <CardContent>
            {project.queues && project.queues.length > 0 ? (
              <div className="space-y-4">
                {project.queues.map((queue: any) => (
                  <div key={queue.id} className="flex justify-between items-center p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                    <div>
                      <h4 className="font-semibold text-lg">{queue.name}</h4>
                      <p className="text-sm text-muted-foreground">Priority: {queue.priority}</p>
                    </div>
                    <Link to={`/queues/${queue.id}`}>
                      <Button variant="outline" size="sm">View Queue</Button>
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground p-4 text-center border border-dashed rounded-lg">No queues associated with this project.</p>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'jobs' && (
        <Card>
          <CardHeader><CardTitle>Jobs</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">List of project jobs will appear here.</p></CardContent>
        </Card>
      )}

      {activeTab === 'analytics' && (
        <Card>
          <CardHeader><CardTitle>Analytics</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Project analytics will appear here.</p></CardContent>
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader><CardTitle>Activity</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Project activity logs will appear here.</p></CardContent>
        </Card>
      )}

      {activeTab === 'members' && (
        <Card>
          <CardHeader><CardTitle>Members</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Project team members will appear here.</p></CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <Card>
          <CardHeader><CardTitle>Settings</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Project settings go here.</p></CardContent>
        </Card>
      )}
    </div>
  );
}
