import { useEffect, useState, useCallback } from 'react';

export const useRecaptcha = () => {
  const [isReady, setIsReady] = useState(false);
  const siteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  useEffect(() => {
    if (window.grecaptcha) {
      setIsReady(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://www.google.com/recaptcha/api.js?render=${siteKey}`;
    script.async = true;
    script.defer = true;
    
    script.onload = () => {
      setIsReady(true);
    };
    
    script.onerror = () => {
      console.error('Failed to load reCAPTCHA script');
    };

    document.head.appendChild(script);

    return () => {
    };
  }, [siteKey]);

  const execute = useCallback(async (action = 'login') => {
    if (!window.grecaptcha) {
      throw new Error('reCAPTCHA belum dimuat');
    }
    return await window.grecaptcha.execute(siteKey, { action });
  }, [siteKey]);

  return { isReady, execute };
};