import { create } from 'zustand'

export const useDialogStore = create((set) => ({
  dialog: {
    open: false,
    title: '',
    description: '',
    variant: 'warning',
    confirmText: 'Konfirmasi',
    cancelText: 'Batal',
    showCancel: true,
    isLoading: false,
    onConfirm: null,
    onCancel: null,
  },

  openDialog: (config) => {
    return new Promise((resolve) => {
      set({
        dialog: {
          open: true,
          title: config.title || 'Konfirmasi',
          description: config.description || '',
          variant: config.variant || 'warning',
          confirmText: config.confirmText || 'Konfirmasi',
          cancelText: config.cancelText || 'Batal',
          showCancel: config.showCancel !== undefined ? config.showCancel : true,
          isLoading: false,
          onConfirm: () => {
            set((state) => ({ dialog: { ...state.dialog, isLoading: true } }))
            if (config.onConfirm) {
              Promise.resolve(config.onConfirm())
                .then(() => {
                  resolve(true)
                  set((state) => ({ dialog: { ...state.dialog, open: false, isLoading: false } }))
                })
                .catch(() => {
                  resolve(false)
                  set((state) => ({ dialog: { ...state.dialog, isLoading: false } }))
                })
            } else {
              resolve(true)
              set((state) => ({ dialog: { ...state.dialog, open: false, isLoading: false } }))
            }
          },
          onCancel: () => {
            resolve(false)
            set((state) => ({ dialog: { ...state.dialog, open: false, isLoading: false } }))
            if (config.onCancel) config.onCancel()
          },
        },
      })
    })
  },

  closeDialog: () =>
    set((state) => ({
      dialog: { ...state.dialog, open: false, isLoading: false },
    })),
}))

export const useDialog = () => useDialogStore((state) => state.dialog)
export const useOpenDialog = () => useDialogStore((state) => state.openDialog)
export const useCloseDialog = () => useDialogStore((state) => state.closeDialog)