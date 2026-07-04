import { Bell, Moon, Sun, User, LogOut, Settings, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const response: any = await api.get('/notifications');
      return response.data || response;
    },
    refetchInterval: 10000,
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => api.post('/notifications/mark-read'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white dark:bg-slate-950 px-6 relative">
      <div className="flex flex-1 items-center gap-6">
        <h1 className="text-lg font-semibold tracking-tight">PulseQueue <span className="text-sm font-normal text-muted-foreground ml-2">Personal Workspace</span></h1>
        <div className="hidden md:flex relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search jobs, queues..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 pl-9"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>
        <div className="relative">
          <Button variant="ghost" size="icon" onClick={() => setNotifOpen(!notifOpen)}>
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-2 flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
            )}
          </Button>

          {notifOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)}></div>
              <div className="absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-card border z-20 overflow-hidden flex flex-col max-h-96">
                <div className="px-4 py-3 border-b flex justify-between items-center bg-muted/50">
                  <h3 className="font-semibold text-sm">Notifications</h3>
                  {unreadCount > 0 && (
                    <button 
                      className="text-xs text-primary hover:underline flex items-center"
                      onClick={() => markAllReadMutation.mutate()}
                    >
                      <Check className="h-3 w-3 mr-1" /> Mark all read
                    </button>
                  )}
                </div>
                <div className="overflow-y-auto flex-1">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    notifications.slice(0, 5).map((n: any) => (
                      <div key={n.id} className={`px-4 py-3 border-b last:border-0 ${!n.read ? 'bg-primary/5' : ''}`}>
                        <p className="text-sm font-medium">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.createdAt).toLocaleTimeString()}</p>
                      </div>
                    ))
                  )}
                </div>
                <div className="p-2 border-t bg-muted/30 text-center">
                  <Link 
                    to="/notifications" 
                    className="text-xs text-primary hover:underline p-1 inline-block"
                    onClick={() => setNotifOpen(false)}
                  >
                    View all notifications
                  </Link>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="relative">
          <button 
            className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary focus:outline-none focus:ring-2 focus:ring-ring"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <User className="h-4 w-4" />
          </button>
          
          {dropdownOpen && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setDropdownOpen(false)}
              ></div>
              <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-card border z-20 overflow-hidden">
                <div className="px-4 py-3 border-b text-sm">
                  <p className="font-medium truncate">{user?.name || 'User'}</p>
                  <p className="text-muted-foreground truncate">{user?.email}</p>
                </div>
                <div className="py-1">
                  <Link 
                    to="/settings" 
                    className="flex items-center px-4 py-2 text-sm hover:bg-muted"
                    onClick={() => setDropdownOpen(false)}
                  >
                    <Settings className="mr-2 h-4 w-4" /> Account Settings
                  </Link>
                  <button 
                    onClick={() => { setDropdownOpen(false); logout(); }}
                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-muted"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}