const fs = require('fs');
const path = require('path');

const files = {
  'apps/web/package.json': `{
  "name": "web",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    "preview": "vite preview"
  },
  "dependencies": {
    "clsx": "^2.0.0",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "recharts": "^2.10.3",
    "socket.io-client": "^4.7.2",
    "tailwind-merge": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@vitejs/plugin-react": "^4.2.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.31",
    "tailwindcss": "^3.3.5",
    "typescript": "^5.2.2",
    "vite": "^5.0.0"
  }
}`,
  'apps/web/tsconfig.json': `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`,
  'apps/web/tsconfig.node.json': `{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}`,
  'apps/web/vite.config.ts': `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    }
  }
});`,
  'apps/web/tailwind.config.js': `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        border: 'hsl(var(--border))',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
  darkMode: 'class',
}`,
  'apps/web/postcss.config.js': `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
  'apps/web/index.html': `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Job Scheduler System</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  </head>
  <body class="bg-background text-foreground">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`,
  'apps/web/src/index.css': `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --primary: 243 75% 59%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96.1%;
    --secondary-foreground: 222.2 47.4% 11.2%;
    --muted: 210 40% 96.1%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96.1%;
    --accent-foreground: 222.2 47.4% 11.2%;
    --border: 214.3 31.8% 91.4%;
    --radius: 0.5rem;
  }
 
  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --primary: 243 75% 59%;
    --primary-foreground: 222.2 47.4% 11.2%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground font-sans;
  }
}`,
  'apps/web/src/lib/utils.ts': `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}`,
  'apps/web/src/components/ui/card.tsx': `import * as React from "react"
import { cn } from "@/lib/utils"

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-xl border bg-white dark:bg-slate-900 text-foreground shadow-sm", className)} {...props} />
))
Card.displayName = "Card"

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("font-semibold leading-none tracking-tight", className)} {...props} />
))
CardTitle.displayName = "CardTitle"

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
CardContent.displayName = "CardContent"

export { Card, CardHeader, CardTitle, CardContent }`,
  'apps/web/src/components/ui/button.tsx': `import * as React from "react"
import { cn } from "@/lib/utils"

const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' | 'destructive', size?: 'default' | 'sm' | 'lg' | 'icon' }>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    const variants = {
      default: "bg-primary text-primary-foreground hover:bg-primary/90",
      outline: "border border-input bg-transparent hover:bg-accent hover:text-accent-foreground",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      destructive: "bg-red-500 text-white hover:bg-red-600"
    }
    const sizes = {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9"
    }
    return (
      <button
        ref={ref}
        className={cn("inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", variants[variant], sizes[size], className)}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }`,
  'apps/web/src/components/ui/badge.tsx': `import * as React from "react"
import { cn } from "@/lib/utils"

function Badge({ className, variant = "default", ...props }: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" }) {
  const variants = {
    default: "border-transparent bg-primary text-primary-foreground",
    secondary: "border-transparent bg-secondary text-secondary-foreground",
    destructive: "border-transparent bg-red-500 text-white",
    success: "border-transparent bg-green-500 text-white",
    warning: "border-transparent bg-yellow-500 text-white",
    outline: "text-foreground"
  }
  return (
    <div className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors", variants[variant], className)} {...props} />
  )
}

export { Badge }`,
  'apps/web/src/components/layout/Sidebar.tsx': `import { Link, useLocation } from 'react-router-dom';
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
}`,
  'apps/web/src/components/layout/Header.tsx': `import { Bell, Moon, Sun } from 'react-icons/fa'; // Wait, let's use lucide-react instead
import { Bell as BellIcon, Moon as MoonIcon, Sun as SunIcon, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

export function Header() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <header className="flex h-14 items-center justify-between border-b bg-white dark:bg-slate-950 px-6">
      <div className="flex flex-1">
        <h1 className="text-lg font-semibold">Workspace</h1>
      </div>
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
          {theme === 'light' ? <MoonIcon className="h-5 w-5" /> : <SunIcon className="h-5 w-5" />}
        </Button>
        <Button variant="ghost" size="icon">
          <BellIcon className="h-5 w-5" />
        </Button>
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center text-primary">
          <User className="h-4 w-4" />
        </div>
      </div>
    </header>
  )
}`,
  'apps/web/src/components/layout/AppLayout.tsx': `import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

export function AppLayout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50 dark:bg-slate-950/50">
          <Outlet />
        </main>
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Dashboard.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', completed: 400, failed: 24 },
  { name: '04:00', completed: 300, failed: 13 },
  { name: '08:00', completed: 550, failed: 45 },
  { name: '12:00', completed: 700, failed: 89 },
  { name: '16:00', completed: 420, failed: 34 },
  { name: '20:00', completed: 380, failed: 11 },
];

export function Dashboard() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Jobs Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,800</div>
            <p className="text-xs text-muted-foreground">+20% from yesterday</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Workers</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 / 12</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Wait Time</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">Down from 60ms</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">DLQ Size</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">42</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
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
                <BarChart data={data}>
                  <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1,2,3,4,5].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">Job user_export_123 completed</p>
                    <p className="text-xs text-muted-foreground">2 minutes ago in queue 'exports'</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Projects.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function Projects() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Projects</h2>
        <Button><Plus className="mr-2 h-4 w-4" /> Create Project</Button>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1,2,3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>Project Alpha {i}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">Core services for handling user data export pipelines.</p>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-slate-600">3 Queues</span>
                <span className="text-primary font-medium cursor-pointer hover:underline">View Details</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Queues.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export function Queues() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Queues</h2>
        <Button>Create Queue</Button>
      </div>
      
      <div className="space-y-4">
        {[1,2,3,4].map((i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-6">
              <div className="space-y-1">
                <h3 className="font-semibold text-lg">data_export_queue_{i}</h3>
                <p className="text-sm text-muted-foreground">Project: Core Services • Priority: High</p>
              </div>
              <div className="flex items-center gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold">124</div>
                  <div className="text-xs text-muted-foreground">Waiting</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">5</div>
                  <div className="text-xs text-muted-foreground">Active</div>
                </div>
                <Badge variant={i === 2 ? 'warning' : 'success'}>{i === 2 ? 'Paused' : 'Active'}</Badge>
                <Button variant="outline" size="sm">Manage</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Jobs.tsx': `import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Jobs() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Jobs</h2>
      </div>

      <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input type="text" placeholder="Search by Job ID or Tags..." className="w-full pl-9 pr-4 py-2 bg-transparent outline-none text-sm" />
        </div>
        <div className="w-px h-6 bg-border"></div>
        <select className="bg-transparent text-sm outline-none">
          <option>All Queues</option>
          <option>export_jobs</option>
          <option>email_jobs</option>
        </select>
        <select className="bg-transparent text-sm outline-none">
          <option>All Statuses</option>
          <option>COMPLETED</option>
          <option>FAILED</option>
          <option>RUNNING</option>
        </select>
        <Button variant="outline" size="sm"><Filter className="h-4 w-4 mr-2" /> Filters</Button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border shadow-sm overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-50 dark:bg-slate-950 text-slate-500 font-medium border-b">
            <tr>
              <th className="px-6 py-4">Job ID</th>
              <th className="px-6 py-4">Queue</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Created At</th>
              <th className="px-6 py-4">Duration</th>
              <th className="px-6 py-4"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {[1,2,3,4,5,6].map((i) => (
              <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                <td className="px-6 py-4 font-medium"><Link to={\`/jobs/job-\${i}\`} className="hover:underline text-primary">job_c83d92_{i}</Link></td>
                <td className="px-6 py-4 text-muted-foreground">export_jobs</td>
                <td className="px-6 py-4">
                  <Badge variant={i % 3 === 0 ? 'destructive' : i % 2 === 0 ? 'success' : 'secondary'}>
                    {i % 3 === 0 ? 'FAILED' : i % 2 === 0 ? 'COMPLETED' : 'RUNNING'}
                  </Badge>
                </td>
                <td className="px-6 py-4 text-muted-foreground">2 mins ago</td>
                <td className="px-6 py-4 text-muted-foreground">{i % 3 === 0 ? '-' : '1.2s'}</td>
                <td className="px-6 py-4 text-right">
                  <Button variant="ghost" size="sm">View</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="p-4 border-t flex justify-between items-center text-sm text-muted-foreground">
          <span>Showing 1 to 10 of 2,450 results</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled>Previous</Button>
            <Button variant="outline" size="sm">Next</Button>
          </div>
        </div>
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/JobDetails.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, RefreshCw, Trash } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

export function JobDetails() {
  const { id } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/jobs">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <h2 className="text-3xl font-bold tracking-tight flex-1">Job Details <span className="text-muted-foreground text-xl font-normal ml-2">#{id}</span></h2>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="h-4 w-4 mr-2" /> Retry</Button>
          <Button variant="destructive"><Trash className="h-4 w-4 mr-2" /> Delete</Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Payload</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
{JSON.stringify({
  userId: "usr_8f92j",
  exportType: "csv",
  dateRange: { start: "2023-01-01", end: "2023-12-31" },
  notifyEmail: "admin@example.com"
}, null, 2)}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Properties</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <Badge variant="success" className="mt-1">COMPLETED</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Queue</p>
              <p className="font-medium mt-1">export_jobs</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Assigned Worker</p>
              <p className="font-medium mt-1">worker-node-1</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created At</p>
              <p className="text-sm mt-1">Oct 24, 2023 10:45 AM</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Execution Time</p>
              <p className="text-sm mt-1">1,240 ms</p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Execution Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-slate-950 text-slate-300 p-4 rounded-lg text-sm font-mono space-y-2">
              <p>[10:45:01] Job claimed by worker-node-1</p>
              <p>[10:45:01] Starting export process for userId: usr_8f92j</p>
              <p>[10:45:02] Fetching records from database...</p>
              <p>[10:45:02] Found 14,293 records.</p>
              <p>[10:45:02] Generating CSV file...</p>
              <p className="text-green-400">[10:45:02] Export completed successfully. File uploaded to S3.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Workers.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Server } from 'lucide-react';

export function Workers() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Workers</h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1,2,3,4,5].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold flex items-center">
                <Server className="h-4 w-4 mr-2 text-primary" />
                worker-node-{i}
              </CardTitle>
              <Badge variant={i === 3 ? 'warning' : 'success'}>{i === 3 ? 'DRAINING' : 'ONLINE'}</Badge>
            </CardHeader>
            <CardContent className="pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Jobs</span>
                <span className="font-medium">4</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Uptime</span>
                <span className="font-medium">5d 12h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">CPU Usage</span>
                <span className="font-medium">45%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Memory</span>
                <span className="font-medium">1.2 GB</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/DLQ.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Trash2 } from 'lucide-react';

export function DLQ() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight text-red-600 dark:text-red-500">Dead Letter Queue (DLQ)</h2>
        <div className="flex gap-2">
          <Button variant="outline"><RefreshCw className="mr-2 h-4 w-4" /> Replay All</Button>
          <Button variant="destructive"><Trash2 className="mr-2 h-4 w-4" /> Purge</Button>
        </div>
      </div>
      
      <div className="space-y-4">
        {[1,2,3].map((i) => (
          <Card key={i} className="border-red-200 dark:border-red-900/50">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg">job_f392kd_{i}</h3>
                  <p className="text-sm text-muted-foreground mt-1">Queue: email_notifications • Failed at: Oct 24, 2023 11:30 AM</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">Replay</Button>
                  <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">Delete</Button>
                </div>
              </div>
              <div className="bg-red-50 dark:bg-red-950/20 text-red-900 dark:text-red-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                <p className="font-bold mb-2">Error: ConnectionTimeout - Failed to connect to SMTP server</p>
                <p>at SMTPClient._connect (node_modules/smtp/index.js:45:12)</p>
                <p>at processTicksAndRejections (node:internal/process/task_queues:96:5)</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Analytics.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', throughput: 120 },
  { time: '04:00', throughput: 300 },
  { time: '08:00', throughput: 800 },
  { time: '12:00', throughput: 1200 },
  { time: '16:00', throughput: 900 },
  { time: '20:00', throughput: 400 },
];

export function Analytics() {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
      
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>System Throughput (Jobs/sec)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}`,
  'apps/web/src/pages/Monitoring.tsx': `import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';

export function Monitoring() {
  const [logs, setLogs] = useState<string[]>([]);
  
  useEffect(() => {
    // Simulating Live WebSockets for System Monitoring
    const interval = setInterval(() => {
      setLogs(prev => {
        const newLog = \`[\${new Date().toLocaleTimeString()}] SYS_METRIC: CPU: \${Math.floor(Math.random()*40 + 20)}% | RAM: \${Math.floor(Math.random()*20 + 40)}% | Active Jobs: \${Math.floor(Math.random()*10)}\`;
        const updated = [newLog, ...prev];
        return updated.slice(0, 50); // Keep last 50
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight flex items-center">
          <Activity className="mr-3 h-8 w-8 text-primary animate-pulse" />
          Live System Monitoring
        </h2>
        <div className="flex items-center gap-2 text-sm text-green-500 font-medium">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
          </span>
          WebSocket Connected
        </div>
      </div>
      
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle>Real-time Stream</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden bg-slate-950 p-4 m-6 mt-0 rounded-lg text-slate-300 font-mono text-sm relative shadow-inner">
          <div className="absolute inset-0 p-4 overflow-y-auto space-y-1">
            {logs.length === 0 ? <p className="text-slate-500 italic">Waiting for events...</p> : null}
            {logs.map((log, i) => (
              <p key={i} className="whitespace-pre-wrap">{log}</p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}`,
  'apps/web/src/pages/Settings.tsx': `import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>General Settings</CardTitle>
          <CardDescription>Configure your organization and workspace preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Organization Name</label>
            <input type="text" className="w-full p-2 rounded-md border bg-transparent" defaultValue="Acme Corp" />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Retention Period (Days)</label>
            <input type="number" className="w-full p-2 rounded-md border bg-transparent" defaultValue="30" />
          </div>
          <Button>Save Changes</Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Danger Zone</CardTitle>
          <CardDescription>Irreversible actions.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive">Delete Organization</Button>
        </CardContent>
      </Card>
    </div>
  )
}`,
  'apps/web/src/App.tsx': `import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Projects } from './pages/Projects';
import { Queues } from './pages/Queues';
import { Jobs } from './pages/Jobs';
import { JobDetails } from './pages/JobDetails';
import { Workers } from './pages/Workers';
import { DLQ } from './pages/DLQ';
import { Analytics } from './pages/Analytics';
import { Monitoring } from './pages/Monitoring';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/queues" element={<Queues />} />
          <Route path="/jobs" element={<Jobs />} />
          <Route path="/jobs/:id" element={<JobDetails />} />
          <Route path="/workers" element={<Workers />} />
          <Route path="/dlq" element={<DLQ />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/monitoring" element={<Monitoring />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}`,
  'apps/web/src/main.tsx': `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);`
};

for (const [filepath, content] of Object.entries(files)) {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\\n', 'utf8');
}
console.log('React frontend code generated successfully in apps/web.');
