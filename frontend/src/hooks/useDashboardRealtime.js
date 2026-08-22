import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToChannel, onConnectionChange } from '../lib/websocket';
import { 
  useDashboardFilters, 
  useDashboardRealtimeState, 
  useDashboardLoginLogs 
} from '../lib/zustand/dashboardStore';
import { useAuthStore } from '../lib/zustand/authStore';
import { dashboardKeys } from './useDashboard';

export const useDashboardRealtimeWebSocket = () => {
  const queryClient = useQueryClient();
  const { realtime } = useDashboardFilters();
  const { setConnectionStatus, setLastEvent } = useDashboardRealtimeState();
  const { addLoginLog } = useDashboardLoginLogs();
  const { isAuthenticated, token } = useAuthStore();
  
  const subscriptionRef = useRef(null);
  const unsubscribeConnectionRef = useRef(null);

  useEffect(() => {
    const shouldConnect = realtime && isAuthenticated && !!token;
    
    if (!shouldConnect) {
      console.log('⏸️ WebSocket disabled:', { 
        realtime, 
        isAuthenticated, 
        hasToken: !!token 
      });
      
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      if (unsubscribeConnectionRef.current) {
        unsubscribeConnectionRef.current();
        unsubscribeConnectionRef.current = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    console.log('🚀 Initializing WebSocket subscription...');

    // ✅ SUBSCRIBE TO DASHBOARD CHANNEL
    const subscription = subscribeToChannel('dashboard', {
      
      // ✅ Event: login.logged (PENTING: nama event harus match dengan broadcastAs())
      '.login.logged': (event) => {
        console.log('🔐 Login event received:', event);
        
        const newLog = {
          id: event.id || Date.now(),
          email: event.email_attempted || event.email,
          ip: event.ip_address,
          success: event.success,
          failure_reason: event.failure_reason,
          user: event.user,
          time_ago: event.time_ago || 'Baru saja',
          timestamp: event.timestamp || new Date().toISOString(),
        };

        addLoginLog(newLog);

        setLastEvent({
          type: 'login.logged',
          data: newLog,
          timestamp: new Date().toISOString(),
        });

        // ✅ Invalidate login stats
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.loginStats(),
        });
      },

      // ✅ Event: dashboard.updated
      '.dashboard.updated': (event) => {
        console.log('📊 Dashboard event received:', event);

        setLastEvent({
          type: 'dashboard.updated',
          data: event,
          timestamp: event.timestamp || new Date().toISOString(),
        });

        // ✅ PENTING: Invalidate DASHBOARD STATS dengan exact:false
        queryClient.invalidateQueries({
          queryKey: dashboardKeys.all,
          exact: false,
        });

        // Smart invalidation berdasarkan event type
        const eventType = event.type || '';
        const invalidateMap = {
          'transaksi': ['transaksi'],
          'pesanan': ['pesanan'],
          'production': ['production'],
          'product': ['product'],
          'inventory': ['inventory'],
          'pembayaran': ['pembayaran'],
        };

        const prefix = eventType.split('.')[0];
        const cacheKey = invalidateMap[prefix];
        
        if (cacheKey) {
          queryClient.invalidateQueries({
            queryKey: cacheKey,
            exact: false,
          });
        }
      },
    });

    subscriptionRef.current = subscription;

    if (!subscription.isConnected) {
      console.warn('⚠️ Failed to subscribe to dashboard channel');
      setConnectionStatus('error');
      return;
    }

    // Track connection status
    unsubscribeConnectionRef.current = onConnectionChange((state) => {
      const statusMap = {
        connected: 'connected',
        connecting: 'connecting',
        unavailable: 'disconnected',
        failed: 'error',
        disconnected: 'disconnected',
      };
      
      const status = statusMap[state] || 'disconnected';
      setConnectionStatus(status);
      console.log(`🔌 WebSocket status: ${status}`);
    });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      
      if (unsubscribeConnectionRef.current) {
        unsubscribeConnectionRef.current();
        unsubscribeConnectionRef.current = null;
      }
    };
  }, [
    realtime, 
    isAuthenticated, 
    token,
    queryClient, 
    addLoginLog, 
    setConnectionStatus, 
    setLastEvent,
  ]);

  return {
    isSubscribed: !!subscriptionRef.current?.isConnected,
  };
};