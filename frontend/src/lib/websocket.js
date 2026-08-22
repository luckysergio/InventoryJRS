import Echo from 'laravel-echo';
import Pusher from 'pusher-js';

window.Pusher = Pusher;

// ==========================================
// CONFIG HELPERS
// ==========================================

const getBaseUrl = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  return apiUrl.replace(/\/api\/?$/, '').replace(/\/$/, '');
};

const getAuthToken = () => {
  try {
    const authStore = window.__AUTH_STORE__ || null;
    if (authStore) {
      const token = authStore.getState().token;
      if (token) return token.replace(/^Bearer\s+/i, '').trim();
    }

    const persisted = localStorage.getItem('jrs-auth-storage');
    if (persisted) {
      try {
        const parsed = JSON.parse(persisted);
        const token = parsed?.state?.token;
        if (token) return token.replace(/^Bearer\s+/i, '').trim();
      } catch (e) {
        // ignore parse errors
      }
    }

    const keys = ['token', 'auth_token', 'access_token'];
    for (const key of keys) {
      const token = localStorage.getItem(key);
      if (token) return token.replace(/^Bearer\s+/i, '').trim();
    }

    return null;
  } catch (error) {
    return null;
  }
};

// ==========================================
// SINGLETON ECHO INSTANCE
// ==========================================

let echoInstance = null;
const connectionListeners = new Set();

const createEchoInstance = () => {
  if (echoInstance) return echoInstance;

  const baseUrl = getBaseUrl();

  echoInstance = new Echo({
    broadcaster: 'pusher',
    key: import.meta.env.VITE_PUSHER_APP_KEY,
    cluster: import.meta.env.VITE_PUSHER_APP_CLUSTER,
    forceTLS: false,
    encrypted: false,
    authEndpoint: `${baseUrl}/api/broadcasting/auth`,
    auth: {
      headers: {
        Accept: 'application/json',
      },
    },
    authorizer: (channel, options) => {
      return {
        authorize: (socketId, callback) => {
          const currentToken = getAuthToken();

          if (!currentToken) {
            callback(new Error('No auth token'), null);
            return;
          }

          fetch(options.authEndpoint, {
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
                throw new Error(`HTTP ${response.status}`);
              }
              return response.json();
            })
            .then((data) => {
              callback(null, data);
            })
            .catch((error) => {
              callback(error, null);
            });
        },
      };
    },
  });

  const connection = echoInstance.connector?.pusher?.connection;
  if (connection) {
    connection.bind('state_change', (states) => {
      connectionListeners.forEach((cb) => {
        try { cb(states.current); } catch (e) { /* ignore */ }
      });
    });

    connection.bind('connected', () => {
      connectionListeners.forEach((cb) => {
        try { cb('connected'); } catch (e) { /* ignore */ }
      });
    });

    connection.bind('disconnected', () => {
      connectionListeners.forEach((cb) => {
        try { cb('disconnected'); } catch (e) { /* ignore */ }
      });
    });

    connection.bind('error', () => {
      connectionListeners.forEach((cb) => {
        try { cb('error'); } catch (e) { /* ignore */ }
      });
    });
  }

  return echoInstance;
};

// ==========================================
// EXPORTED FUNCTIONS
// ==========================================

export const getEcho = () => {
  if (!getAuthToken()) return null;
  return createEchoInstance();
};

/**
 * ✅ DEFENSIVE DESTROY:
 * - Set echoInstance = null DULU untuk prevent concurrent calls
 * - Check connection state sebelum disconnect
 * - Aman dipanggil berkali-kali tanpa warning
 */
export const destroyEcho = () => {
  if (!echoInstance) return;

  const instance = echoInstance;
  echoInstance = null; // ✅ Set null DULU (critical!)

  try {
    const connection = instance.connector?.pusher?.connection;
    const state = connection?.state;

    // Hanya disconnect jika belum closed/closing
    if (state && (state === 'closed' || state === 'closing')) {
      return;
    }

    try {
      instance.leaveAllChannels?.();
    } catch (e) {
      // ignore
    }

    try {
      instance.disconnect?.();
    } catch (e) {
      // ignore disconnect errors
    }
  } catch (e) {
    // ignore all errors during cleanup
  }
};

export const resetEcho = () => {
  destroyEcho();
  return createEchoInstance();
};

export const registerAuthStore = (authStore) => {
  window.__AUTH_STORE__ = authStore;
};

export const subscribeToChannel = (channelName, handlers = {}) => {
  const echo = getEcho();
  if (!echo) {
    return {
      channel: null,
      unsubscribe: () => {},
      subscriptionId: null,
    };
  }

  const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const doSubscribe = () => {
    try {
      const channel = echo.private(channelName);

      if (typeof channel.subscribed === 'function') {
        channel.subscribed(() => {});
      }

      if (typeof channel.error === 'function') {
        channel.error(() => {});
      }

      Object.entries(handlers).forEach(([event, handler]) => {
        const wrappedHandler = (data) => {
          try {
            handler(data);
          } catch (error) {
            // ignore handler errors
          }
        };
        channel.listen(event, wrappedHandler);
      });

      return {
        channel,
        subscriptionId,
        unsubscribe: () => {
          try {
            echo.leaveChannel(channelName);
          } catch (e) {
            // ignore
          }
        },
      };
    } catch (error) {
      return {
        channel: null,
        unsubscribe: () => {},
        subscriptionId: null,
      };
    }
  };

  const connection = echo.connector?.pusher?.connection;
  const isConnected = connection?.state === 'connected';

  if (isConnected) {
    return doSubscribe();
  }

  // Wait for connection
  let isSubscribed = false;
  let result = {
    channel: null,
    unsubscribe: () => {},
    subscriptionId,
  };

  const cleanupFns = [];

  const onConnected = () => {
    if (isSubscribed) return;
    isSubscribed = true;
    cleanupFns.forEach((cb) => { try { cb(); } catch (e) { /* ignore */ } });
    cleanupFns.length = 0;
    result = doSubscribe();
  };

  if (connection) {
    connection.bind('connected', onConnected);
    cleanupFns.push(() => {
      try { connection.unbind('connected', onConnected); } catch (e) { /* ignore */ }
    });
  }

  const timeoutId = setTimeout(() => {
    if (!isSubscribed) {
      isSubscribed = true;
      cleanupFns.forEach((cb) => { try { cb(); } catch (e) { /* ignore */ } });
      cleanupFns.length = 0;
      result = doSubscribe();
    }
  }, 10000);

  cleanupFns.push(() => clearTimeout(timeoutId));

  return {
    get channel() { return result.channel; },
    subscriptionId,
    unsubscribe: () => {
      cleanupFns.forEach((cb) => { try { cb(); } catch (e) { /* ignore */ } });
      cleanupFns.length = 0;
      result.unsubscribe();
    },
  };
};

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

export const onConnectionChange = (callback) => {
  const echo = getEcho();
  if (!echo) {
    callback('disconnected');
    return () => {};
  }

  connectionListeners.add(callback);
  const state = echo.connector?.pusher?.connection?.state || 'disconnected';
  try { callback(state); } catch (e) { /* ignore */ }

  return () => {
    connectionListeners.delete(callback);
  };
};

export default {
  getEcho,
  destroyEcho,
  resetEcho,
  registerAuthStore,
  subscribeToChannel,
  getConnectionStatus,
  onConnectionChange,
};