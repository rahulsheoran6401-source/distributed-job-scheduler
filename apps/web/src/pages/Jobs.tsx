import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, X, Trash2, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

const createJobSchema = z.object({
  queue: z.string().min(1, 'Queue is required'),
  type: z.enum(['immediate', 'delayed', 'scheduled', 'recurring', 'batch']),
  payload: z.string().refine((val) => {
    try { JSON.parse(val); return true; } catch { return false; }
  }, 'Must be valid JSON'),
  delay: z.number().optional(),
  cron: z.string().optional(),
  runAt: z.string().optional()
});

type CreateJobForm = z.infer<typeof createJobSchema>;

const JOB_STATUSES = [
  'DRAFT', 'QUEUED', 'DELAYED', 'SCHEDULED', 'RECURRING',
  'RUNNING', 'COMPLETED', 'FAILED', 'RETRYING', 'CANCELLED', 'DLQ'
];

export function Jobs() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [queue, setQueue] = useState('');
  const [status, setStatus] = useState('');
  const [project, setProject] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJobs, setSelectedJobs] = useState<string[]>([]);

  const { data: queuesData } = useQuery({
    queryKey: ['queues'],
    queryFn: async () => (await api.get('/queues')).data
  });

  const { data: projectsData } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get('/projects')).data
  });

  const { data: jobs, isLoading } = useQuery({
    queryKey: ['jobs', search, queue, status, project, sortBy, sortOrder],
    queryFn: async () => {
      const response = await api.get('/jobs', {
        params: { search, queue, status, project, sortBy, sortOrder }
      });
      return response.data;
    }
  });

  const createJobMutation = useMutation({
    mutationFn: (data: any) => api.post('/jobs', data),
    onSuccess: () => {
      toast.success('Job created successfully');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setIsModalOpen(false);
    }
  });

  const deleteJobsMutation = useMutation({
    mutationFn: (jobIds: string[]) => Promise.all(jobIds.map(id => api.delete(`/jobs/${id}`))),
    onSuccess: () => {
      toast.success('Selected jobs deleted');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJobs([]);
    }
  });

  const retryJobsMutation = useMutation({
    mutationFn: (jobIds: string[]) => Promise.all(jobIds.map(id => api.post(`/jobs/${id}/retry`))),
    onSuccess: () => {
      toast.success('Selected jobs retried');
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setSelectedJobs([]);
    }
  });

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<CreateJobForm>({
    resolver: zodResolver(createJobSchema),
    defaultValues: {
      type: 'immediate',
      payload: '{}'
    }
  });

  const jobType = watch('type');

  const cloneJob = (job: any) => {
    reset({
      queue: job.queue,
      type: job.type || 'immediate',
      payload: JSON.stringify(job.payload, null, 2),
    });
    setIsModalOpen(true);
  };

  const onSubmit = (data: CreateJobForm) => {
    const payloadParsed = JSON.parse(data.payload);
    const body: any = {
      queue: data.queue,
      type: data.type,
      payload: payloadParsed,
    };
    if (data.type === 'delayed') body.delay = Number(data.delay);
    if (data.type === 'scheduled') body.runAt = data.runAt;
    if (data.type === 'recurring') body.cron = data.cron;

    createJobMutation.mutate(body);
  };

  const toggleSelectAll = () => {
    if (selectedJobs.length === jobs?.length) {
      setSelectedJobs([]);
    } else {
      setSelectedJobs(jobs?.map((j: any) => j.id) || []);
    }
  };

  const toggleSelectJob = (id: string) => {
    if (selectedJobs.includes(id)) {
      setSelectedJobs(selectedJobs.filter(jId => jId !== id));
    } else {
      setSelectedJobs([...selectedJobs, id]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
        <Button onClick={() => { reset(); setIsModalOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Create Job
        </Button>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Job ID or Tags..."
            className="w-full pl-9 pr-4 py-2 bg-transparent outline-none text-sm"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-px h-6 bg-border hidden sm:block"></div>
        <select 
          className="bg-transparent text-sm outline-none"
          value={queue}
          onChange={(e) => setQueue(e.target.value)}
        >
          <option value="">All Queues</option>
          {queuesData?.map((q: any) => (
            <option key={q.id} value={q.name}>{q.name}</option>
          ))}
        </select>
        <select 
          className="bg-transparent text-sm outline-none"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Statuses</option>
          {JOB_STATUSES.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select 
          className="bg-transparent text-sm outline-none"
          value={project}
          onChange={(e) => setProject(e.target.value)}
        >
          <option value="">All Projects</option>
          {projectsData?.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <select 
          className="bg-transparent text-sm outline-none"
          value={`${sortBy}:${sortOrder}`}
          onChange={(e) => {
            const [sBy, sOrd] = e.target.value.split(':');
            setSortBy(sBy);
            setSortOrder(sOrd);
          }}
        >
          <option value="createdAt:desc">Newest First</option>
          <option value="createdAt:asc">Oldest First</option>
        </select>
      </div>

      {selectedJobs.length > 0 && (
        <div className="flex items-center gap-4 bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border">
          <span className="text-sm font-medium">{selectedJobs.length} job(s) selected</span>
          <Button variant="outline" size="sm" onClick={() => retryJobsMutation.mutate(selectedJobs)}>
            <RefreshCw className="w-4 h-4 mr-2" /> Retry Selected
          </Button>
          <Button variant="destructive" size="sm" onClick={() => deleteJobsMutation.mutate(selectedJobs)}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
          </Button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-4 w-10">
                <input 
                  type="checkbox" 
                  checked={jobs?.length > 0 && selectedJobs.length === jobs?.length}
                  onChange={toggleSelectAll}
                />
              </th>
              <th className="px-6 py-4">Job ID</th>
              <th className="px-6 py-4">Queue</th>
              <th className="px-6 py-4">Type</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {isLoading ? (
              <tr><td colSpan={7} className="text-center py-8">Loading...</td></tr>
            ) : jobs && jobs.length > 0 ? (
              jobs.map((job: any) => (
                <tr key={job.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="px-6 py-4">
                    <input 
                      type="checkbox" 
                      checked={selectedJobs.includes(job.id)}
                      onChange={() => toggleSelectJob(job.id)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium">
                    <Link to={`/jobs/${job.id}`} className="hover:underline text-primary">
                      {job.id}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">{job.queue}</td>
                  <td className="px-6 py-4 text-muted-foreground">{job.type || 'immediate'}</td>
                  <td className="px-6 py-4">
                    <Badge variant={job.status === 'FAILED' ? 'destructive' : job.status === 'COMPLETED' ? 'success' : 'secondary'}>
                      {job.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground">
                    {new Date(job.createdAt).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button variant="ghost" size="sm" onClick={() => cloneJob(job)}>Clone</Button>
                    <Link to={`/jobs/${job.id}`}>
                      <Button variant="ghost" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No jobs found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg w-full max-w-md p-6 relative">
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-bold mb-4">Create Job</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Queue</label>
                <input
                  {...register('queue')}
                  className="w-full px-3 py-2 bg-transparent border rounded-md"
                  placeholder="e.g. export_jobs"
                />
                {errors.queue && <p className="text-red-500 text-xs mt-1">{errors.queue.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  {...register('type')}
                  className="w-full px-3 py-2 bg-transparent border rounded-md"
                >
                  <option value="immediate">Immediate</option>
                  <option value="delayed">Delayed</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="recurring">Recurring</option>
                  <option value="batch">Batch</option>
                </select>
              </div>

              {jobType === 'delayed' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Delay (ms)</label>
                  <input
                    type="number"
                    {...register('delay', { valueAsNumber: true })}
                    className="w-full px-3 py-2 bg-transparent border rounded-md"
                  />
                </div>
              )}

              {jobType === 'scheduled' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Run At (ISO String)</label>
                  <input
                    {...register('runAt')}
                    className="w-full px-3 py-2 bg-transparent border rounded-md"
                    placeholder="2024-01-01T00:00:00Z"
                  />
                </div>
              )}

              {jobType === 'recurring' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Cron Expression</label>
                  <input
                    {...register('cron')}
                    className="w-full px-3 py-2 bg-transparent border rounded-md"
                    placeholder="* * * * *"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">
                  {jobType === 'batch' ? 'Jobs Payload (JSON Array of Job Data)' : 'Payload (JSON)'}
                </label>
                <textarea
                  {...register('payload')}
                  rows={4}
                  className="w-full px-3 py-2 bg-transparent border rounded-md font-mono text-sm"
                />
                {errors.payload && <p className="text-red-500 text-xs mt-1">{errors.payload.message}</p>}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" disabled={createJobMutation.isPending}>
                  {createJobMutation.isPending ? 'Creating...' : 'Create Job'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
