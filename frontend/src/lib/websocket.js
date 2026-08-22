import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// ==========================================
// CONFIG HELPERS
// ==========================================

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  // Hapus /api dari akhir jika ada (karena kita akan tambah manual)
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

/**
 * ✅ Ambil token dari Zustand store (sumber kebenaran tunggal)
 * BUKAN dari localStorage langsung karena zustand persist
 * menyimpan di key 'jrs-auth-storage' dengan format JSON
 */
const getAuthToken = () => {
  try {
    // Coba import useAuthStore (hindari circular dependency)
    const authStore = window.__AUTH_STORE__ || null;
    
    if (authStore) {
      const token = authStore.getState().token;
      if (token) return token.replace(/^Bearer\s+/i, '').trim();
    }
    
    // Fallback: parse dari zustand persist storage
    const persisted = localStorage.getItem('jrs-auth-storage');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        const token = parsed?.state?.token;
        if (token) return token.replace(/^Bearer\s+/i, '').trim();
      } catch (e) {
        console.warn('Failed to parse auth storage:', e);
      }
    }
    
    // Last fallback: direct localStorage
    const keys = ['token', 'auth_token', 'access_token'];
    for (const key of keys) {
      const token = localStorage.getItem(key);
      if (token) return token.replace(/^Bearer\s+/i, '').trim();
    }
    
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// ==========================================
// LAZY SINGLETON ECHO INSTANCE
// ==========================================

let echoInstance = null;
let connectionListeners = new Set();
let isInitialized = false;

/**
 * ✅ Create Echo instance (lazy - dibuat saat pertama kali diperlukan)
 */
const createEchoInstance = () => {
  if (echoInstance) return echoInstance;

  const token = getAuthToken();
  const baseUrl = getBaseUrl();
  
  console.log('🔧 Creating Echo instance', {
    hasToken: !!token,
    tokenPreview: token ? `${token.substring(0, 20)}...` : null,
    baseUrl,
    pusherKey: import.meta.env.VITE_PUSHER_APP_KEY ? '✓ set' : '✗ missing',
  });

  if (!token) {
    console.warn('⚠️ No token available - Echo will not authenticate private channels');
  }

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: false,
    encrypted: false,
    
    // ✅ Auth endpoint
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    
    auth: {
      headers: {
        Accept: 'application/json',
      },
    },
    
    // ✅ Custom authorizer - reactive token setiap request
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          // RE-FETCH token fresh setiap authorize (auto-update saat refresh token)
          const currentToken = getAuthToken();
          const authUrl = options.authEndpoint;
          
          console.log('🔐 Authorizing channel:', {
            channel: channel.name,
            socketId,
            authUrl,
            hasToken: !!currentToken,
            tokenLength: currentToken?.length || 0,
          });

          if (!currentToken) {
            console.error('❌ No token available - user not logged in?');
            callback(new Error('No auth token'), null);
            return;
          }

          fetch(authUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              Authorization: `Bearer ${currentToken}`,
            },
            body: JSON.stringify({
              socket_id: socketId,
              channel_name: channel.name,
            }),
          })
            .then(async (response) => {
              if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Auth failed:', response.status, errorText);
                throw new Error(`HTTP ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              console.log('✅ WebSocket auth successful');
              callback(null, data);
            })
            .catch((error) => {
              console.error('❌ WebSocket auth error:', error.message);
              callback(error, null);
            });
        },
      };
    },
  });

  // Attach connection listeners
  const connection = echoInstance.connector?.pusher?.connection;
  if (connection) {
    connection.bind('state_change', (states) => {
      connectionListeners.forEach((cb) => {
        try { cb(states.current); } catch (e) {}
      });
    });
    connection.bind('connected', () => {
      connectionListeners.forEach((cb) => {
        try { cb('connected'); } catch (e) {}
      });
    });
    connection.bind('disconnected', () => {
      connectionListeners.forEach((cb) => {
        try { cb('disconnected'); } catch (e) {}
      });
    });
    connection.bind('error', () => {
      connectionListeners.forEach((cb) => {
        try { cb('error'); } catch (e) {}
      });
    });
  }

  isInitialized = true;
  return echoInstance;
};

/**
 * ✅ Get or create Echo instance
 */
export const getEcho = () => {
  if (!getAuthToken()) {
    console.warn('⚠️ getEcho() called without token');
    return null;
  }
  return createEchoInstance();
};

/**
 * ✅ Destroy Echo instance (untuk logout)
 */
export const destroyEcho = () => {
  if (echoInstance) {
    try {
      echoInstance.leaveAllChannels?.();
      echoInstance.disconnect?.();
    } catch (e) {
      console.warn('Error destroying Echo:', e);
    }
    echoInstance = null;
    isInitialized = false;
    console.log('🔌 Echo instance destroyed');
  }
};

/**
 * ✅ Reset Echo (untuk refresh token)
 */
export const resetEcho = () => {
  destroyEcho();
  return createEchoInstance();
};

// ==========================================
// HELPER FUNCTIONS
// ==========================================

/**
 * Register auth store reference (panggil sekali saat app init)
 */
export const registerAuthStore = (authStore) => {
  window.__AUTH_STORE__ = authStore;
};

/**
 * Subscribe ke private channel
 */
export const subscribeToChannel = (channelName, handlers = {}) => {
  const echo = getEcho();
  if (!echo) {
    console.warn('⚠️ Cannot subscribe - Echo not initialized or no token');
    return { 
      channel: null, 
      unsubscribe: () => {},
      isConnected: false,
    };
  }

  try {
    const channel = echo.private(channelName);

    Object.entries(handlers).forEach(([event, handler]) => {
      channel.listen(event, handler);
    });

    return {
      channel,
      unsubscribe: () => {
        try {
          echo.leaveChannel(channelName);
        } catch (e) {
          console.warn('Error unsubscribing:', e);
        }
      },
      isConnected: true,
    };
  } catch (error) {
    console.error('❌ Failed to subscribe to channel:', error);
    return {
      channel: null,
      unsubscribe: () => {},
      isConnected: false,
    };
  }
};

/**
 * Get current connection status
 */
export const getConnectionStatus = () => {
  if (!echoInstance) return 'disconnected';
  
  const connection = echoInstance.connector?.pusher?.connection;
  if (!connection) return 'disconnected';
  
  const stateMap = {
    connected: 'connected',
    connecting: 'connecting',
    unavailable: 'disconnected',
    failed: 'error',
    disconnected: 'disconnected',
  };
  
  return stateMap[connection.state] || 'disconnected';
};

/**
 * Listen to connection state changes
 */
export const onConnectionChange = (callback) => {
  const echo = getEcho();
  if (!echo) {
    callback('disconnected');
    return () => {};
  }

  connectionListeners.add(callback);
  
  // Initial state
  const state = echo.connector?.pusher?.connection?.state || 'disconnected';
  try { callback(state); } catch (e) {}

  return () => {
    connectionListeners.delete(callback);
  };
};

/**
 * Check if Echo is initialized
 */
export const isEchoInitialized = () => isInitialized;

export default {
  getEcho,
  destroyEcho,
  resetEcho,
  registerAuthStore,
  subscribeToChannel,
  getConnectionStatus,
  onConnectionChange,
  isEchoInitialized,
};