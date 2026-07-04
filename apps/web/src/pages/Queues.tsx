import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { Plus, Edit2, Trash2, Play, Pause } from 'lucide-react';
import { Link } from 'react-router-dom';

interface Queue {
  id: string;
  name: string;
  description: string | null;
  projectId: string;
  priority: number;
  isPaused: boolean;
  project?: {
    id: string;
    name: string;
  };
  stats?: {
    waiting: number;
    active: number;
  };
  _count?: {
    jobs?: number;
  };
}

interface Project {
  id: string;
  name: string;
}

const queueSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  projectId: z.string().min(1, 'Project is required'),
  priority: z.coerce.number().min(0, 'Priority must be 0 or greater'),
});
type QueueFormData = z.infer<typeof queueSchema>;

export function Queues() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingQueue, setEditingQueue] = useState<Queue | null>(null);

  const { data: queues = [], isLoading } = useQuery<Queue[]>({
    queryKey: ['queues'],
    queryFn: async () => (await api.get('/queues')).data,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<QueueFormData>({
    resolver: zodResolver(queueSchema),
  });

  const openModal = (queue?: Queue) => {
    if (queue) {
      setEditingQueue(queue);
      reset({ name: queue.name, projectId: queue.projectId, priority: queue.priority });
    } else {
      setEditingQueue(null);
      reset({ name: '', projectId: projects[0]?.id || '', priority: 0 });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingQueue(null);
    reset();
  };

  const createMutation = useMutation({
    mutationFn: (data: QueueFormData) => api.post('/queues', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Queue created successfully');
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: QueueFormData }) => api.put(`/queues/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Queue updated successfully');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/queues/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Queue deleted successfully');
    },
  });

  const pauseMutation = useMutation({
    mutationFn: (id: string) => api.post(`/queues/${id}/pause`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Queue paused');
    },
  });

  const resumeMutation = useMutation({
    mutationFn: (id: string) => api.post(`/queues/${id}/resume`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['queues'] });
      toast.success('Queue resumed');
    },
  });

  const onSubmit = (data: QueueFormData) => {
    if (editingQueue) {
      updateMutation.mutate({ id: editingQueue.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div>Loading queues...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Queues</h2>
        <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> Create Queue</Button>
      </div>
      
      <div className="space-y-4">
        {queues.length === 0 ? (
          <div className="text-center text-muted-foreground py-10">No queues found. Create one!</div>
        ) : (
          queues.map((queue) => (
            <Card key={queue.id}>
              <CardContent className="flex items-center justify-between p-6">
                <div className="space-y-1">
                  <Link to={`/queues/${queue.id}`}>
                    <h3 className="font-semibold text-lg hover:underline cursor-pointer">{queue.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    Project: {queue.project?.name || 'Unknown'} • Priority: {queue.priority}
                  </p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{queue.stats?.waiting || 0}</div>
                    <div className="text-xs text-muted-foreground">Waiting</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{queue.stats?.active || 0}</div>
                    <div className="text-xs text-muted-foreground">Active</div>
                  </div>
                  
                  <Badge variant={queue.isPaused ? 'warning' : 'success'}>
                    {queue.isPaused ? 'Paused' : 'Active'}
                  </Badge>
                  
                  <div className="flex gap-2">
                    {queue.isPaused ? (
                      <Button variant="outline" size="sm" onClick={() => resumeMutation.mutate(queue.id)}>
                        <Play className="h-4 w-4 mr-1" /> Resume
                      </Button>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => pauseMutation.mutate(queue.id)}>
                        <Pause className="h-4 w-4 mr-1" /> Pause
                      </Button>
                    )}
                    <Button variant="outline" size="icon" onClick={() => openModal(queue)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                      if (window.confirm('Are you sure you want to delete this queue?')) {
                        deleteMutation.mutate(queue.id);
                      }
                    }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editingQueue ? 'Edit Queue' : 'Create Queue'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Queue Name"
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1">Project</label>
                <select
                  {...register('projectId')}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="">Select a project...</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {errors.projectId && <p className="text-destructive text-sm mt-1">{errors.projectId.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <input
                  type="number"
                  {...register('priority')}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0"
                />
                {errors.priority && <p className="text-destructive text-sm mt-1">{errors.priority.message}</p>}
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingQueue ? 'Save Changes' : 'Create Queue'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
