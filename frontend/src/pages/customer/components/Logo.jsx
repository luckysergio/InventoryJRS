import { useState } from 'react';
import { cn } from '../../../lib/utils';

/**
 * Logo component dengan fallback otomatis.
 * Jika /Logo/logo.png gagal dimuat, tampil badge "JRS".
 */
const Logo = ({ size = 'md', withText = true, light = false, className }) => {
  const [failed, setFailed] = useState(false);

  const sizeClasses = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
  };

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      {failed ? (
        <span
          className={cn(
            'flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-ocean-500 font-display font-black text-white shadow-md',
            sizeClasses[size]
          )}
        >
          JRS
        </span>
      ) : (
        <img
          src="/Logo/logo.png"
          alt="Logo Jaya Rubber Seal"
          className={cn('w-auto object-contain drop-shadow-sm', sizeClasses[size])}
          onError={() => setFailed(true)}
          loading="eager"
        />
      )}

      {withText && (
        <span className="hidden sm:block leading-tight">
          <span
            className={cn(
              'block font-display text-base font-extrabold tracking-tight',
              light ? 'text-white' : 'text-slate-900'
            )}
          >
            Jaya Rubber Seal
          </span>
          <span
            className={cn(
              'block text-[10px] font-medium',
              light ? 'text-white/70' : 'text-slate-500'
            )}
          >
            Rubber & Seal Specialist
          </span>
        </span>
      )}
    </span>
  );
};

export default Logo;