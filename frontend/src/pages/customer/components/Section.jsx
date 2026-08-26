import { cn } from '../../../lib/utils';

const Section = ({
  id,
  title,
  subtitle,
  children,
  className,
  align = 'center',
  background = 'white',
  aos = 'fade-up',
  padding = 'default',
}) => {
  const bgClasses = {
    white: 'bg-white',
    light: 'bg-gradient-to-br from-brand-50 via-ocean-50 to-white',
    dark: 'bg-gradient-to-br from-slate-900 to-brand-900 text-white',
    cyan: 'bg-gradient-to-br from-brand-500 to-ocean-500 text-white',
  };

  const paddingClasses = {
    none: '',
    small: 'py-12 sm:py-16',
    default: 'py-16 sm:py-20 lg:py-24',
    large: 'py-20 sm:py-28 lg:py-32',
  };

  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
  };

  const justifyClasses = {
    left: 'items-start',
    center: 'items-center',
    right: 'items-end',
  };

  return (
    <section
      id={id}
      className={cn(
        'relative overflow-hidden',
        bgClasses[background],
        paddingClasses[padding],
        className
      )}
      data-aos={aos}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        {(title || subtitle) && (
          <div
            className={cn(
              'flex flex-col max-w-3xl mx-auto mb-12 lg:mb-16',
              alignClasses[align],
              justifyClasses[align]
            )}
          >
            {subtitle && (
              <p className="text-sm font-bold uppercase tracking-widest text-brand-600 mb-3">
                {subtitle}
              </p>
            )}
            {title && (
              <h2
                className={cn(
                  'text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-balance',
                  background === 'dark' || background === 'cyan'
                    ? 'text-white'
                    : 'text-slate-900'
                )}
              >
                {title}
              </h2>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
};

export default Section;