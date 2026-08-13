import { useEffect, useCallback } from 'react'
import { X, AlertTriangle, CheckCircle, Info, Loader2 } from 'lucide-react'
import { useDialog, useCloseDialog } from '../../lib/zustand/dialogStore'
import { cn } from '../../lib/utils'

const variantConfig = {
  danger: {
    icon: AlertTriangle,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    buttonBg: 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800',
    buttonShadow: 'shadow-red-500/30',
    ringColor: 'ring-red-500/20',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    buttonBg: 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700',
    buttonShadow: 'shadow-amber-500/30',
    ringColor: 'ring-amber-500/20',
  },
  success: {
    icon: CheckCircle,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
    buttonBg: 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
    buttonShadow: 'shadow-emerald-500/30',
    ringColor: 'ring-emerald-500/20',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    buttonBg: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    buttonShadow: 'shadow-blue-500/30',
    ringColor: 'ring-blue-500/20',
  },
}

const ConfirmDialog = () => {
  const dialog = useDialog()
  const closeDialog = useCloseDialog()

  const {
    open,
    title,
    description,
    variant = 'warning',
    confirmText,
    cancelText,
    showCancel,
    isLoading,
    onConfirm,
    onCancel,
  } = dialog

  // ✅ Safety fallback jika variant tidak dikenali
  const config = variantConfig[variant] || variantConfig.warning
  const Icon = config.icon

  const handleEscKey = useCallback(
    (e) => {
      if (e.key === 'Escape' && open && !isLoading) {
        onCancel?.()
      }
    },
    [open, isLoading, onCancel]
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleEscKey)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey)
      document.body.style.overflow = ''
    }
  }, [open, handleEscKey])

  if (!open) return null

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !isLoading) {
      onCancel?.()
    }
  }

  const handleConfirm = () => {
    if (!isLoading && onConfirm) onConfirm()
  }

  const handleCancel = () => {
    if (!isLoading && onCancel) onCancel()
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        <div className="px-6 pt-6 pb-4 flex items-start gap-4">
          <div className={cn('flex h-12 w-12 items-center justify-center rounded-full flex-shrink-0 ring-4', config.iconBg, config.ringColor)}>
            <Icon className={cn('h-6 w-6', config.iconColor)} />
          </div>

          <div className="flex-1 min-w-0 pt-1">
            <h3 id="confirm-dialog-title" className="text-lg font-semibold text-slate-900 leading-tight">
              {title}
            </h3>
            {description && (
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{description}</p>
            )}
          </div>

          {showCancel && !isLoading && (
            <button onClick={handleCancel} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors flex-shrink-0 group" aria-label="Close dialog">
              <X className="w-4 h-4 text-slate-400 group-hover:text-slate-600 group-hover:rotate-90 transition-all duration-200" />
            </button>
          )}
        </div>

        <div className="px-6 pb-6 pt-2 flex gap-2">
          {showCancel && (
            <button
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              'flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all shadow-lg active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2',
              config.buttonBg,
              config.buttonShadow,
              !showCancel && 'w-full'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Memproses...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ConfirmDialog