import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, FolderGit2 } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'react-hot-toast';
import { EmptyState } from '@/components/ui/empty-state';

interface Project {
  id: string;
  name: string;
  description: string | null;
  _count?: {
    queues: number;
  };
  queues?: any[];
}

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
});
type ProjectFormData = z.infer<typeof projectSchema>;

export function Projects() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data,
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
  });

  const openModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      reset({ name: project.name, description: project.description || '' });
    } else {
      setEditingProject(null);
      reset({ name: '', description: '' });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
    reset();
  };

  const createMutation = useMutation({
    mutationFn: (data: ProjectFormData) => api.post('/projects', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project created successfully');
      closeModal();
    },
    onError: () => {
      // errors handled by api interceptor
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectFormData }) => api.put(`/projects/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project updated successfully');
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Project deleted successfully');
    },
  });

  const onSubmit = (data: ProjectFormData) => {
    if (editingProject) {
      updateMutation.mutate({ id: editingProject.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (isLoading) return <div>Loading projects...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button onClick={() => openModal()}><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
      </div>
      
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderGit2}
          title="No Projects Yet"
          description="Create your first project to start managing queues and jobs."
          actionLabel="Create Project"
          onAction={() => openModal()}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.id} className="relative group">
              <CardHeader className="pr-12">
                <CardTitle className="truncate">{project.name}</CardTitle>
                <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openModal(project)} className="text-muted-foreground hover:text-primary">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => {
                    if (window.confirm('Are you sure you want to delete this project?')) {
                      deleteMutation.mutate(project.id);
                    }
                  }} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4 truncate">{project.description || 'No description'}</p>
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-slate-600">
                    {project._count?.queues ?? project.queues?.length ?? 0} Queues
                  </span>
                  <Link to={`/projects/${project.id}`}>
                    <span className="text-primary font-medium cursor-pointer hover:underline">View Details</span>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg w-full max-w-md p-6">
            <h3 className="text-lg font-semibold mb-4">{editingProject ? 'Edit Project' : 'Create Project'}</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  {...register('name')}
                  className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Project Name"
                />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  {...register('description')}
                  className="w-full flex min-h-[80px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Project Description"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button type="button" variant="outline" onClick={closeModal}>Cancel</Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingProject ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
