import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { useQueryClient } from '@tanstack/react-query';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ socket: null, isConnected: false });

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem('token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const socketUrl = apiUrl.includes('/api/v1') ? apiUrl.replace('/api/v1', '') : apiUrl;
    
    const socketInstance = io(socketUrl, {
      auth: {
        token,
      },
    });

    socketInstance.on('connect', () => {
      setIsConnected(true);
    });

    socketInstance.on('disconnect', () => {
      setIsConnected(false);
    });

    // Global listeners for real-time refetching
    socketInstance.on('job:completed', () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socketInstance.on('job:failed', () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      queryClient.invalidateQueries({ queryKey: ['dlq'] });
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
    });

    socketInstance.on('worker:heartbeat', () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user, queryClient]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
