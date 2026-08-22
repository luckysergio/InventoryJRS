import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { subscribeToChannel, onConnectionChange } from '../lib/websocket';
import {
  useDashboardFilters,
  useDashboardRealtimeState,
  useDashboardLoginLogs,
} from '../lib/zustand/dashboardStore';
import { useAuthStore } from '../lib/zustand/authStore';
import { dashboardKeys } from './useDashboard';

// Module-level refs untuk mencegah double invocation dari React StrictMode
let globalSubscriptionRef = null;
let globalConnectionCleanupRef = null;

export const useDashboardRealtimeWebSocket = () => {
  const queryClient = useQueryClient();
  const { realtime } = useDashboardFilters();
  const { setConnectionStatus, setLastEvent } = useDashboardRealtimeState();
  const { addLoginLog } = useDashboardLoginLogs();
  const { isAuthenticated, token } = useAuthStore();

  const handleLoginEvent = useCallback((event) => {
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

    queryClient.invalidateQueries({ queryKey: dashboardKeys.loginStats() });
  }, [addLoginLog, setLastEvent, queryClient]);

  const handleDashboardEvent = useCallback((event) => {
    setLastEvent({
      type: 'dashboard.updated',
      data: event,
      timestamp: event.timestamp || new Date().toISOString(),
    });

    queryClient.invalidateQueries({
      queryKey: dashboardKeys.all,
      exact: false,
    });

    const eventType = event.type || '';
    const invalidateMap = {
      transaksi: ['transaksi'],
      pesanan: ['pesanan'],
      production: ['production'],
      product: ['product'],
      inventory: ['inventory'],
      pembayaran: ['pembayaran'],
    };

    const prefix = eventType.split('.')[0];
    const cacheKey = invalidateMap[prefix];

    if (cacheKey) {
      queryClient.invalidateQueries({
        queryKey: cacheKey,
        exact: false,
      });
    }
  }, [setLastEvent, queryClient]);

  useEffect(() => {
    const shouldConnect = realtime && isAuthenticated && !!token;

    if (!shouldConnect) {
      if (globalSubscriptionRef) {
        globalSubscriptionRef.unsubscribe();
        globalSubscriptionRef = null;
      }
      if (globalConnectionCleanupRef) {
        globalConnectionCleanupRef();
        globalConnectionCleanupRef = null;
      }
      setConnectionStatus('disconnected');
      return;
    }

    // Guard: cegah double subscription dari React StrictMode
    if (globalSubscriptionRef) {
      if (!globalConnectionCleanupRef) {
        globalConnectionCleanupRef = onConnectionChange((state) => {
          const statusMap = {
            connected: 'connected',
            connecting: 'connecting',
            unavailable: 'disconnected',
            failed: 'error',
            disconnected: 'disconnected',
          };
          setConnectionStatus(statusMap[state] || 'disconnected');
        });
      }
      return;
    }

    const handlers = {
      '.login.logged': handleLoginEvent,
      '.dashboard.updated': handleDashboardEvent,
    };

    globalSubscriptionRef = subscribeToChannel('dashboard', handlers);

    globalConnectionCleanupRef = onConnectionChange((state) => {
      const statusMap = {
        connected: 'connected',
        connecting: 'connecting',
        unavailable: 'disconnected',
        failed: 'error',
        disconnected: 'disconnected',
      };
      setConnectionStatus(statusMap[state] || 'disconnected');
    });

    // Cleanup tidak langsung dijalankan saat unmount (untuk React StrictMode)
    // Cleanup hanya dijalankan saat shouldConnect berubah ke false
  }, [
    realtime,
    isAuthenticated,
    token,
    handleLoginEvent,
    handleDashboardEvent,
    setConnectionStatus,
  ]);

  // Cleanup saat window unload (real unmount)
  useEffect(() => {
    const handleUnload = () => {
      if (globalSubscriptionRef) {
        globalSubscriptionRef.unsubscribe();
        globalSubscriptionRef = null;
      }
      if (globalConnectionCleanupRef) {
        globalConnectionCleanupRef();
        globalConnectionCleanupRef = null;
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, []);

  return {
    isSubscribed: !!globalSubscriptionRef?.subscriptionId,
  };
};