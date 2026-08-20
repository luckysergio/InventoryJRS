import { useOpenDialog } from '../lib/zustand/dialogStore'

export const useConfirmDialog = () => {
  const openDialog = useOpenDialog()

  const normalizeArgs = (title, description, third, fourth) => {
    if (third && typeof third === 'object' && !Array.isArray(third)) {
      return { title, description, ...third }
    }
    return {
      title,
      description,
      ...(typeof third === 'string' ? { confirmText: third } : {}),
      ...(typeof fourth === 'string' ? { cancelText: fourth } : {}),
    }
  }

  const confirm = async (config) => {
    return await openDialog(config)
  }

  const danger = async (title, description, third, fourth) => {
    const normalized = normalizeArgs(title, description, third, fourth)
    return await confirm({
      variant: 'danger',
      confirmText: 'Ya, Hapus',
      cancelText: 'Batal',
      ...normalized,
    })
  }

  const warning = async (title, description, third, fourth) => {
    const normalized = normalizeArgs(title, description, third, fourth)
    return await confirm({
      variant: 'warning',
      confirmText: 'Ya, Lanjutkan',
      cancelText: 'Batal',
      ...normalized,
    })
  }

  const success = async (title, description, third) => {
    const normalized = normalizeArgs(title, description, third)
    return await confirm({
      variant: 'success',
      confirmText: 'OK',
      showCancel: false,
      ...normalized,
    })
  }

  const info = async (title, description, third) => {
    const normalized = normalizeArgs(title, description, third)
    return await confirm({
      variant: 'info',
      confirmText: 'Mengerti',
      showCancel: false,
      ...normalized,
    })
  }

  return { confirm, danger, warning, success, info }
}