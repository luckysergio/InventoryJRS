import {
  Clock, Play, CheckCircle, XCircle, Factory, AlertCircle,
  Truck, Package as PackageIcon, FileText, ShoppingCart,
} from 'lucide-react';

// ==========================================
// PESANAN STATUS MAP (Sesuai DB Seeder)
// ==========================================
// ID harus match dengan tabel status_transaksis
export const PESANAN_STATUS_MAP = {
  PROSES: 1,
  DI_PESAN: 2,
  DI_BUAT: 3,
  SIAP: 4,
  SELESAI: 5,
  DIBATALKAN: 6,
};

// ==========================================
// PESANAN STATUS INFO (UI Config)
// ==========================================
export const PESANAN_STATUS_INFO = {
  [PESANAN_STATUS_MAP.PROSES]: {
    label: 'Proses',
    color: 'slate',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: '📝',
    nextStatus: PESANAN_STATUS_MAP.DI_PESAN,
    nextLabel: 'Lanjut ke Di Pesan',
    nextIcon: ShoppingCart,
    nextGradient: 'from-slate-500 to-slate-700',
  },
  [PESANAN_STATUS_MAP.DI_PESAN]: {
    label: 'Di Pesan',
    color: 'amber',
    bg: 'bg-amber-100',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: '🛒',
    nextStatus: PESANAN_STATUS_MAP.DI_BUAT,
    nextLabel: 'Mulai Produksi',
    nextIcon: Factory,
    nextGradient: 'from-amber-500 to-orange-600',
  },
  [PESANAN_STATUS_MAP.DI_BUAT]: {
    label: 'Di Buat',
    color: 'blue',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: '🔨',
    nextStatus: PESANAN_STATUS_MAP.SIAP,
    nextLabel: 'Tandai Siap',
    nextIcon: CheckCircle,
    nextGradient: 'from-blue-500 to-indigo-600',
  },
  [PESANAN_STATUS_MAP.SIAP]: {
    label: 'Siap',
    color: 'purple',
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    border: 'border-purple-200',
    icon: '📦',
    nextStatus: PESANAN_STATUS_MAP.SELESAI,
    nextLabel: 'Selesaikan',
    nextIcon: Truck,
    nextGradient: 'from-purple-500 to-pink-600',
  },
  [PESANAN_STATUS_MAP.SELESAI]: {
    label: 'Selesai',
    color: 'emerald',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: '✅',
    nextStatus: null,
    nextLabel: null,
    nextIcon: null,
    nextGradient: null,
  },
  [PESANAN_STATUS_MAP.DIBATALKAN]: {
    label: 'Dibatalkan',
    color: 'red',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    icon: '❌',
    nextStatus: null,
    nextLabel: null,
    nextIcon: null,
    nextGradient: null,
  },
};

export const ACTIVE_STATUSES = [
  PESANAN_STATUS_MAP.PROSES,
  PESANAN_STATUS_MAP.DI_PESAN,
  PESANAN_STATUS_MAP.DI_BUAT,
  PESANAN_STATUS_MAP.SIAP,
];

// ==========================================
// PRODUCTION STATUS CONFIG
// ==========================================
export const PRODUCTION_STATUS_CONFIG = {
  none: {
    label: 'Belum Diproduksi',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    gradient: 'from-slate-500 to-slate-700',
    icon: AlertCircle,
  },
  antri: {
    label: 'Antri Produksi',
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    gradient: 'from-slate-500 to-slate-700',
    icon: Clock,
  },
  produksi: {
    label: 'Sedang Diproduksi',
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    border: 'border-blue-200',
    gradient: 'from-blue-500 to-indigo-600',
    icon: Play,
  },
  selesai: {
    label: 'Produksi Selesai',
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    gradient: 'from-emerald-500 to-teal-600',
    icon: CheckCircle,
  },
  batal: {
    label: 'Produksi Batal',
    bg: 'bg-red-100',
    text: 'text-red-700',
    border: 'border-red-200',
    gradient: 'from-red-500 to-rose-600',
    icon: XCircle,
  },
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

export const formatRupiah = (value) =>
  new Intl.NumberFormat('id-ID').format(value || 0);

export const unformatRupiah = (value) => {
  if (!value) return 0;
  return Number(String(value).replace(/\D/g, '')) || 0;
};

export const formatTanggal = (date, style = 'long') => {
  if (!date) return '-';
  const d = new Date(date);
  if (isNaN(d.getTime())) return '-';

  if (style === 'short') {
    return d.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

export const formatProductName = (product) => {
  if (!product) return '-';
  const parts = [
    product.jenis?.nama,
    product.type?.nama,
    product.bahan?.nama,
    product.ukuran && `Ukuran: ${product.ukuran}`,
  ].filter(Boolean);
  return parts.join(' • ') || product.kode || '-';
};

export const getInvoiceNumber = (transaksi) => {
  if (!transaksi?.kode) {
    const date = new Date(transaksi?.tanggal || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `JRS/INV/${year}/${month}/${transaksi?.id || 0}`;
  }
  return transaksi.kode;
};

export const normalizeDetails = (details = []) => {
  return details.map((d) => ({
    ...d,
    total_bayar: Number(d.total_bayar) || 0,
    sisa_tagihan: Number(d.sisa_tagihan) || 0,
  }));
};

export const getOverallPesananStatus = (details = []) => {
  if (!details.length) return PESANAN_STATUS_MAP.PROSES;

  const normalized = normalizeDetails(details);
  const active = normalized.filter(
    (d) =>
      ![PESANAN_STATUS_MAP.SELESAI, PESANAN_STATUS_MAP.DIBATALKAN].includes(
        d.status_transaksi_id
      )
  );

  if (active.length === 0) {
    const adaSelesai = normalized.some(
      (d) => d.status_transaksi_id === PESANAN_STATUS_MAP.SELESAI
    );
    return adaSelesai ? PESANAN_STATUS_MAP.SELESAI : PESANAN_STATUS_MAP.DIBATALKAN;
  }

  // Prioritas workflow tertinggi (yang paling maju)
  const priorities = [
    PESANAN_STATUS_MAP.SIAP,
    PESANAN_STATUS_MAP.DI_BUAT,
    PESANAN_STATUS_MAP.DI_PESAN,
    PESANAN_STATUS_MAP.PROSES,
  ];
  for (const p of priorities) {
    if (active.some((d) => d.status_transaksi_id === p)) return p;
  }
  return PESANAN_STATUS_MAP.PROSES;
};

/**
 * Ambil info production dari detail pesanan.
 * Jika multiple productions, ambil yang paling aktif.
 */
export const getProductionInfo = (detail) => {
  const productions = detail?.productions || [];

  if (!productions || productions.length === 0) {
    return {
      status: 'none',
      production: null,
      config: PRODUCTION_STATUS_CONFIG.none,
      hasProduction: false,
    };
  }

  const sorted = [...productions].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  );

  const active =
    sorted.find((p) => p.status === 'produksi') ||
    sorted.find((p) => p.status === 'antri') ||
    sorted.find((p) => p.status === 'selesai') ||
    sorted[0];

  return {
    status: active.status,
    production: active,
    config: PRODUCTION_STATUS_CONFIG[active.status] || PRODUCTION_STATUS_CONFIG.none,
    hasProduction: true,
  };
};

export const canCreateProduction = (detail) => {
  const info = getProductionInfo(detail);
  if (!info.hasProduction) return true;
  return info.status === 'batal';
};

export const isPesananActive = (statusId) =>
  ACTIVE_STATUSES.includes(statusId);

export const isPesananFinal = (statusId) =>
  [PESANAN_STATUS_MAP.SELESAI, PESANAN_STATUS_MAP.DIBATALKAN].includes(statusId);