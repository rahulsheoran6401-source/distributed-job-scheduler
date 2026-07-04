import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, ListTree, ActivitySquare, Users, AlertOctagon, BarChart3, Settings, ServerCrash } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Projects', href: '/projects', icon: FolderKanban },
  { name: 'Queues', href: '/queues', icon: ListTree },
  { name: 'Jobs', href: '/jobs', icon: ActivitySquare },
  { name: 'Workers', href: '/workers', icon: Users },
  { name: 'DLQ', href: '/dlq', icon: AlertOctagon },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Monitoring', href: '/monitoring', icon: ServerCrash },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const location = useLocation();
  
  return (
    <div className="flex h-full w-64 flex-col border-r bg-slate-50 dark:bg-slate-950">
      <div className="flex h-14 items-center border-b px-4">
        <div className="flex items-center gap-2 font-semibold text-primary">
          <ActivitySquare className="h-6 w-6" />
          <span>JobScheduler OS</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="grid gap-1 px-2">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}