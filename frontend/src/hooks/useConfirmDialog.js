import { useOpenDialog } from '../lib/zustand/dialogStore'

export const useConfirmDialog = () => {
  const openDialog = useOpenDialog()

  const confirm = async (config) => {
    return await openDialog(config)
  }

  const danger = async (title, description, options = {}) => {
    return await confirm({
      title,
      description,
      variant: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      ...options,
    })
  }

  const warning = async (title, description, options = {}) => {
    return await confirm({
      title,
      description,
      variant: 'warning',
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      ...options,
    })
  }

  const success = async (title, description, options = {}) => {
    return await confirm({
      title,
      description,
      variant: 'success',
      confirmText: 'OK',
      showCancel: false,
      ...options,
    })
  }

  const info = async (title, description, options = {}) => {
    return await confirm({
      title,
      description,
      variant: 'info',
      confirmText: 'Mengerti',
      showCancel: false,
      ...options,
    })
  }

  return { confirm, danger, warning, success, info }
}