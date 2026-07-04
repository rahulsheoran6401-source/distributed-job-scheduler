import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';
import { Loader2, Eye, EyeOff, LayoutGrid } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema)
  });

  const onSubmit = async (data: z.infer<typeof loginSchema>) => {
    try {
      setIsLoading(true);
      const res = await api.post('/auth/login', data);
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      // error toast handled by interceptor
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full items-center justify-center bg-[conic-gradient(at_top_right,_var(--tw-gradient-stops))] from-indigo-900 via-purple-900 to-black p-4 sm:p-8">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
      
      <div className="z-10 mb-8 text-center">
        <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-lg">
          JOB SCHEDULER
        </h1>
        <p className="text-indigo-200 mt-2 font-medium tracking-wide">ENTERPRISE EDITION</p>
      </div>

      <Card className="relative w-full max-w-lg border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl overflow-hidden group">
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <CardHeader className="space-y-4 pb-8 pt-10 px-10 relative z-10">
          <div className="flex justify-center mb-2">
            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 transform transition-transform group-hover:scale-105 duration-500">
              <LayoutGrid className="text-white h-7 w-7" />
            </div>
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight text-center text-white">
            Welcome back
          </CardTitle>
          <CardDescription className="text-center text-gray-400 text-base">
            Enter your credentials to access your workspace
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-10 pb-10 relative z-10">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none text-gray-300" htmlFor="email">Email Address</label>
              <input 
                id="email" 
                type="email" 
                className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-md text-white shadow-sm transition-all focus:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent placeholder:text-gray-500"
                placeholder="name@company.com"
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-red-400 mt-1">{errors.email.message}</p>}
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium leading-none text-gray-300" htmlFor="password">Password</label>
                <a href="#" className="text-sm font-medium text-indigo-400 hover:text-indigo-300 hover:underline transition-colors">
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <input 
                  id="password" 
                  type={showPassword ? "text" : "password"} 
                  className="flex h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-md text-white shadow-sm transition-all focus:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-transparent placeholder:text-gray-500"
                  placeholder="••••••••"
                  {...register('password')}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && <p className="text-sm text-red-400 mt-1">{errors.password.message}</p>}
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input type="checkbox" id="remember" className="h-4 w-4 rounded border-gray-600 bg-white/5 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-gray-900" />
              <label htmlFor="remember" className="text-sm font-medium text-gray-300 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Remember me for 30 days
              </label>
            </div>

            <Button 
              type="submit" 
              className="w-full h-12 mt-4 text-md font-semibold bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white border-0 shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Authenticating...
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            <div className="text-center text-sm mt-8 text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-indigo-400 font-semibold hover:text-indigo-300 hover:underline transition-colors">
                Create one now
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
