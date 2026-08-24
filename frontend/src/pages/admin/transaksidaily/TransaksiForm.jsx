import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  X, Plus, Trash2, Search, ChevronDown, ChevronUp,
  Package, Loader2, User, Calendar, CheckCircle2, DollarSign,
  Tag, AlertCircle, Sparkles, TrendingUp, Lock, Unlock, Pencil,
  Crown, Info, Save, RefreshCw,
} from "lucide-react";
import { useTransaksiModals } from "../../../lib/zustand/transaksiStore";
import {
  useCreateTransaksi,
  useUpdateTransaksi,
  useStatusTransaksiList,
} from "../../../hooks/useTransaksi";
import {
  useCustomersFull,
  useProductsFull,
  useJenisDropdown,
  useTypesDropdown,
  useHargaByProduct,
  useCreateHarga,
} from "../../../hooks/useMasterData";
import { useStokMap } from "../../../hooks/useInventory";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import {
  formatRupiah,
  unformatRupiah,
  formatProductName,
  formatTanggal,
  STATUS_MAP,
} from "./utils/transaksiUtils";
import { cn } from "../../../lib/utils";

// ==========================================
// HELPERS
// ==========================================
const getSafeKey = (item, index, prefix = "item") => {
  if (!item) return `${prefix}-fallback-${index}`;
  const id = item.id ?? item.value ?? item._id;
  if (id !== undefined && id !== null && id !== "") {
    return `${prefix}-${id}`;
  }
  return `${prefix}-index-${index}`;
};

const getStokFromMap = (productId, stokMap) => {
  if (!productId || !stokMap) return 0;
  return stokMap.get(Number(productId)) ?? 0;
};

// ==========================================
// DROPDOWN POSITIONING
// ==========================================
const useDropdownPosition = (open) => {
  const triggerRef = useRef(null);
  const [style, setStyle] = useState(null);

  const update = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const MAX_H = 420;
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    if (spaceBelow >= 260 || spaceBelow >= spaceAbove) {
      setStyle({
        top: rect.bottom + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(200, Math.min(MAX_H, spaceBelow)),
      });
    } else {
      setStyle({
        bottom: window.innerHeight - rect.top + 6,
        left: rect.left,
        width: rect.width,
        maxHeight: Math.max(200, Math.min(MAX_H, spaceAbove)),
      });
    }
  }, []);

  useEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, update]);

  return { triggerRef, style };
};

const DropdownPortal = ({ open, style, onClose, children }) => {
  if (!open || !style) return null;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[80]" onClick={onClose} />
      <div
        style={style}
        className="fixed z-[85] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden flex flex-col animate-fadeIn"
      >
        {children}
      </div>
    </>,
    document.body
  );
};

const createEmptyDetail = (statusProsesId) => ({
  id: undefined,
  product_id: "",
  qty: 1,
  discount: 0,
  catatan: "",
  status_transaksi_id: statusProsesId,
  harga_product_id: "",
  harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
  selected_harga: 0,
  harga_label: "",
});

// ==========================================
// HARGA SELECTOR
// ==========================================
const HargaSelector = ({
  detailIndex,
  detail,
  productId,
  customerId,
  customerName,
  onUpdateHarga,
  disabled,
}) => {
  const { 
    data: hargaList = [], 
    isLoading, 
    isFetching,
    refetch,
    dataUpdatedAt,
  } = useHargaByProduct(productId, customerId);
  
  const createHargaMut = useCreateHarga();
  const [showNewForm, setShowNewForm] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const hargaUmum = useMemo(
    () => hargaList.filter((h) => !h.customer_id),
    [hargaList]
  );
  const hargaKhusus = useMemo(
    () => hargaList.filter((h) => h.customer_id && String(h.customer_id) === String(customerId)),
    [hargaList, customerId]
  );

  useEffect(() => {
    if (productId) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, customerId]);

  const prevCustomerIdRef = useRef(customerId);
  useEffect(() => {
    const prevId = String(prevCustomerIdRef.current || "");
    const currId = String(customerId || "");

    if (prevId !== currId && detail.harga_product_id) {
      const selectedHarga = hargaList.find((h) => String(h.id) === String(detail.harga_product_id));

      if (selectedHarga?.customer_id && String(selectedHarga.customer_id) !== currId) {
        onUpdateHarga(detailIndex, {
          harga_product_id: "",
          harga_baru: { harga: "", keterangan: "", tanggal_berlaku: new Date().toISOString().split("T")[0] },
          selected_harga: 0,
          harga_label: "",
        });
        setShowNewForm(false);
      }
    }
    prevCustomerIdRef.current = customerId;
  }, [customerId, hargaList, detail.harga_product_id, detailIndex, onUpdateHarga]);

  useEffect(() => {
    if (!detail.harga_product_id && detail.harga_baru?.harga) {
      setShowNewForm(true);
    }
  }, [detail.harga_product_id, detail.harga_baru?.harga]);

  useEffect(() => {
    if (isDropdownOpen && productId && !isLoading) {
      refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen, productId]);

  const currentSelection = detail.harga_product_id
    ? String(detail.harga_product_id)
    : showNewForm
      ? "tambah_harga_khusus"
      : "";

  const handleSelect = (value) => {
    if (value === "tambah_harga_khusus") {
      setShowNewForm(true);
      onUpdateHarga(detailIndex, {
        harga_product_id: "",
        harga_baru: {
          harga: detail.harga_baru?.harga || "",
          keterangan: detail.harga_baru?.keterangan || "",
          tanggal_berlaku: detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
        },
        selected_harga: Number(detail.harga_baru?.harga) || 0,
        harga_label: "",
      });
      return;
    }

    setShowNewForm(false);
    const selected = hargaList.find((h) => String(h.id) === String(value));
    onUpdateHarga(detailIndex, {
      harga_product_id: value,
      harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
      selected_harga: Number(selected?.harga) || 0,
      harga_label: selected
        ? `Rp ${formatRupiah(selected.harga)} • ${selected.keterangan || (selected.customer_id ? `Harga Khusus ${customerName || "Customer"}` : "Harga Umum")}`
        : "",
    });
  };

  const handleNewHargaChange = (field, value) => {
    const updated = {
      harga: detail.harga_baru?.harga || "",
      keterangan: detail.harga_baru?.keterangan || "",
      tanggal_berlaku: detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0],
      [field]: value,
    };

    onUpdateHarga(detailIndex, {
      harga_product_id: "",
      harga_baru: updated,
      selected_harga: field === "harga" ? Number(value) : Number(detail.harga_baru?.harga) || 0,
      harga_label: updated.harga ? `Rp ${formatRupiah(updated.harga)} • ${updated.keterangan || "Harga Baru"}` : "",
    });
  };

  const handleSubmitNewHarga = async () => {
    if (!detail.harga_baru?.harga) return;

    try {
      const payload = {
        product_id: Number(productId),
        customer_id: customerId ? Number(customerId) : null,
        harga: Number(detail.harga_baru.harga),
        keterangan: detail.harga_baru.keterangan?.trim() || (customerId ? `Harga khusus ${customerName}` : 'Harga baru'),
        tanggal_berlaku: detail.harga_baru.tanggal_berlaku || new Date().toISOString().split("T")[0],
      };

      const newHarga = await createHargaMut.mutateAsync(payload);
      await refetch();
      await new Promise(resolve => setTimeout(resolve, 100));
      await refetch();

      onUpdateHarga(detailIndex, {
        harga_product_id: String(newHarga.id),
        harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
        selected_harga: Number(newHarga.harga),
        harga_label: `Rp ${formatRupiah(newHarga.harga)} • ${newHarga.keterangan || 'Harga baru dibuat'}`,
      });
      
      setShowNewForm(false);
    } catch (err) {
      console.error('[HargaSelector] Gagal buat harga:', err);
    }
  };

  const handleCancelNewHarga = () => {
    setShowNewForm(false);
    onUpdateHarga(detailIndex, {
      harga_product_id: "",
      harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
      selected_harga: 0,
      harga_label: "",
    });
  };

  if (!productId) return null;

  if (isLoading && !dataUpdatedAt) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-3 px-4 bg-slate-50 rounded-lg border border-slate-200">
        <Loader2 size={14} className="animate-spin text-indigo-600" />
        <span>Memuat daftar harga...</span>
      </div>
    );
  }

  const hasCustomerPrice = hargaKhusus.length > 0 && customerId;
  const hasAnyHarga = hargaList.length > 0;
  const isSubmittingNew = createHargaMut.isPending;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
          <Tag size={13} className="text-indigo-600" />
          Pilih Harga
        </label>

        <div className="flex items-center gap-2 flex-wrap">
          {hasCustomerPrice && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <Crown size={10} />
              Harga Khusus {customerName || "Customer"}
            </span>
          )}
          
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching || disabled}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition disabled:opacity-50"
            title="Refresh daftar harga"
          >
            <RefreshCw size={12} className={isFetching ? "animate-spin text-indigo-600" : "text-slate-500"} />
          </button>

          {detail.selected_harga > 0 && (
            <span className="text-xs font-bold text-green-700 bg-green-50 px-2 py-0.5 rounded-full">
              Rp {formatRupiah(detail.selected_harga)}
            </span>
          )}
        </div>
      </div>

      {!customerId && hargaUmum.length > 0 && (
        <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
          <Info size={12} className="flex-shrink-0 mt-0.5" />
          <p>Pilih customer untuk menampilkan harga khusus. Saat ini hanya <strong>Harga Umum</strong>.</p>
        </div>
      )}

      <select
        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-200 focus:outline-none focus:border-indigo-400 disabled:bg-slate-100 disabled:cursor-not-allowed transition"
        value={currentSelection}
        onChange={(e) => handleSelect(e.target.value)}
        onFocus={() => setIsDropdownOpen(true)}
        onBlur={() => setIsDropdownOpen(false)}
        disabled={disabled || isSubmittingNew}
      >
        <option value="">-- Pilih Harga --</option>

        {hargaKhusus.length > 0 && (
          <optgroup label={`💎 Harga Khusus ${customerName || "Customer"}`}>
            {hargaKhusus.map((h) => (
              <option key={`khusus-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)}
                {h.keterangan ? ` • ${h.keterangan}` : ""}
                {" "}✨ Khusus
              </option>
            ))}
          </optgroup>
        )}

        {hargaUmum.length > 0 && (
          <optgroup label="💲 Harga Umum">
            {hargaUmum.map((h) => (
              <option key={`umum-${h.id}`} value={String(h.id)}>
                Rp {formatRupiah(h.harga)}
                {h.keterangan ? ` • ${h.keterangan}` : ""}
                {" "}({formatTanggal(h.tanggal_berlaku, "short")})
              </option>
            ))}
          </optgroup>
        )}

        {hargaUmum.length === 0 && hargaKhusus.length === 0 && (
          <option value="" disabled>
            Belum ada harga untuk produk ini
          </option>
        )}

        <option value="tambah_harga_khusus">
          {customerId ? `+ Buat Harga Khusus untuk ${customerName || "Customer"}` : "+ Buat Harga Baru"}
        </option>
      </select>

      {customerId && hargaKhusus.length === 0 && hargaUmum.length > 0 && !detail.harga_product_id && !showNewForm && (
        <div className="flex items-start gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600">
          <Info size={12} className="flex-shrink-0 mt-0.5 text-slate-400" />
          <p>
            <strong>{customerName}</strong> belum memiliki harga khusus untuk produk ini.
            Gunakan harga umum atau <strong>buat harga khusus baru</strong>.
          </p>
        </div>
      )}

      {!hasAnyHarga && !showNewForm && !disabled && (
        <div className="flex items-start gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <AlertCircle size={14} className="flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Belum ada harga untuk produk ini</p>
            <p className="text-amber-600 mt-0.5">Silakan buat harga baru untuk melanjutkan</p>
          </div>
        </div>
      )}

      {showNewForm && (
        <div className={cn(
          "p-4 rounded-xl border space-y-3 animate-fadeIn",
          customerId
            ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200"
            : "bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200"
        )}>
          <div className={cn(
            "flex items-center gap-2 pb-2 border-b",
            customerId ? "border-amber-200" : "border-blue-200"
          )}>
            <div className="p-1.5 bg-white rounded-lg shadow-sm">
              {customerId ? <Crown size={14} className="text-amber-600" /> : <Sparkles size={14} className="text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className={cn("text-sm font-semibold", customerId ? "text-amber-900" : "text-blue-900")}>
                {customerId ? `Harga Khusus: ${customerName || "Customer"}` : "Harga Baru"}
              </p>
              {customerId && (
                <p className="text-[10px] text-amber-700">Harga ini akan tersimpan untuk customer ini</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">
                Harga (Rp) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.harga ? formatRupiah(detail.harga_baru.harga) : ""}
                onChange={(e) => handleNewHargaChange("harga", unformatRupiah(e.target.value))}
                disabled={disabled || isSubmittingNew}
                autoFocus
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Keterangan</label>
              <input
                type="text"
                placeholder={customerId ? "Harga khusus..." : "Keterangan..."}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.keterangan || ""}
                onChange={(e) => handleNewHargaChange("keterangan", e.target.value)}
                disabled={disabled || isSubmittingNew}
              />
            </div>

            <div>
              <label className="block text-[10px] font-medium text-slate-600 mb-1 uppercase">Berlaku Mulai</label>
              <input
                type="date"
                className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                value={detail.harga_baru?.tanggal_berlaku || new Date().toISOString().split("T")[0]}
                onChange={(e) => handleNewHargaChange("tanggal_berlaku", e.target.value)}
                disabled={disabled || isSubmittingNew}
              />
            </div>
          </div>

          {detail.harga_baru?.harga > 0 && !isSubmittingNew && (
            <div className={cn(
              "pt-2 border-t flex items-center justify-between text-xs",
              customerId ? "border-amber-200" : "border-blue-200"
            )}>
              <span className="text-slate-600">Preview:</span>
              <span className={cn("font-bold", customerId ? "text-amber-900" : "text-blue-900")}>
                Rp {formatRupiah(detail.harga_baru.harga)}
              </span>
            </div>
          )}

          <div className={cn(
            "pt-3 border-t flex gap-2",
            customerId ? "border-amber-200" : "border-blue-200"
          )}>
            <button
              type="button"
              onClick={handleCancelNewHarga}
              disabled={isSubmittingNew}
              className="flex-1 px-4 py-2 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSubmitNewHarga}
              disabled={disabled || isSubmittingNew || !detail.harga_baru?.harga}
              className={cn(
                "flex-1 px-4 py-2 text-sm font-bold text-white rounded-lg transition shadow-sm disabled:opacity-50 flex items-center justify-center gap-2",
                customerId
                  ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  : "bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600"
              )}
            >
              {isSubmittingNew ? (
                <><Loader2 size={14} className="animate-spin" /> Menyimpan...</>
              ) : (
                <><Save size={14} /> Simpan Harga</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==========================================
// CUSTOMER DROPDOWN
// ==========================================
const CustomerDropdown = ({ customers, selectedId, onSelect, onCreateNew, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef(null);
  const { triggerRef, style } = useDropdownPosition(isOpen);

  const normalizedCustomers = useMemo(() => {
    return (customers || []).map((c, idx) => ({
      _key: getSafeKey(c, idx, 'customer'),
      id: c.id ?? c.value,
      name: c.name ?? c.label ?? c.nama ?? "Unnamed",
      no_hp: c.no_hp ?? c.phone ?? "",
      email: c.email ?? "",
    }));
  }, [customers]);

  const filtered = useMemo(() => {
    if (!search.trim()) return normalizedCustomers;
    const s = search.toLowerCase();
    return normalizedCustomers.filter((c) =>
      c.name?.toLowerCase().includes(s) ||
      c.no_hp?.toLowerCase().includes(s)
    );
  }, [normalizedCustomers, search]);

  const selected = normalizedCustomers.find((c) => String(c.id) === String(selectedId));

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 text-sm">
        {selected ? (
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-500" />
            <span className="font-medium">{selected.name}</span>
            {selected.no_hp && <span className="text-slate-400 text-xs">• {selected.no_hp}</span>}
          </div>
        ) : "Pilih Customer..."}
      </div>
    );
  }

  const handleSelect = (id) => {
    onSelect(id);
    setSearch("");
    setTimeout(() => setIsOpen(false), 100);
  };

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
          isOpen ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"
        )}
      >
        <span className="truncate flex items-center gap-2">
          {selected ? (
            <>
              <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                <User size={13} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm text-slate-900 truncate">{selected.name}</p>
                {selected.no_hp && (
                  <p className="text-xs text-slate-500 truncate">{selected.no_hp}</p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                <User size={13} className="text-slate-400" />
              </div>
              <span className="text-slate-500 text-sm">Pilih Customer...</span>
            </>
          )}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      <DropdownPortal open={isOpen} style={style} onClose={() => { setIsOpen(false); setSearch(""); }}>
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari nama/no HP..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <User size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Customer tidak ditemukan</p>
            </div>
          ) : (
            filtered.map((c) => {
              const isSelected = String(c.id) === String(selectedId);
              return (
                <button
                  key={c._key}
                  type="button"
                  onClick={() => handleSelect(c.id)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left text-sm hover:bg-indigo-50 flex items-center gap-3 transition",
                    isSelected ? "bg-indigo-50" : ""
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg flex-shrink-0",
                    isSelected ? "bg-indigo-100" : "bg-slate-100"
                  )}>
                    <User size={13} className={isSelected ? "text-indigo-600" : "text-slate-500"} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{c.name}</p>
                    {c.no_hp && <p className="text-xs text-slate-500 truncate">{c.no_hp}</p>}
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>

        {onCreateNew && (
          <button
            type="button"
            onClick={() => { onCreateNew(); setIsOpen(false); setSearch(""); }}
            className="p-3 border-t border-slate-100 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-2 font-medium transition flex-shrink-0"
          >
            <Plus size={14} /> Buat Customer Baru
          </button>
        )}
      </DropdownPortal>
    </div>
  );
};

// ==========================================
// PRODUCT DROPDOWN (UPDATED - Bug 1 Fix)
// ==========================================
const ProductDropdown = ({ products, selectedId, onSelect, jenisList, typeList, stokMap, disabled = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const inputRef = useRef(null);
  const { triggerRef, style } = useDropdownPosition(isOpen);

  const normalizedProducts = useMemo(() => {
    return (products || []).map((p, idx) => ({
      _key: getSafeKey(p, idx, 'product'),
      id: p.id ?? p.value,
      kode: p.kode ?? "",
      jenis_id: p.jenis_id ?? p.jenis?.id,
      type_id: p.type_id ?? p.type?.id,
      bahan_id: p.bahan_id ?? p.bahan?.id,
      ukuran: p.ukuran ?? "",
      jenis: p.jenis,
      type: p.type,
      bahan: p.bahan,
      harga_umum: p.harga_umum ?? p.harga ?? 0,
      _raw: p,
      _fromDetail: p._fromDetail || false, // ✅ Flag untuk produk dari detail existing
    }));
  }, [products]);

  const filtered = useMemo(() => {
    let result = normalizedProducts;

    // ✅ Prioritaskan produk yang terpilih (biar muncul di atas saat dicari)
    if (selectedId) {
      const selectedProduct = result.find(p => String(p.id) === String(selectedId));
      if (selectedProduct) {
        result = [selectedProduct, ...result.filter(p => String(p.id) !== String(selectedId))];
      }
    }

    if (search.trim()) {
      const s = search.toLowerCase();
      result = result.filter((p) => {
        const namaProduk = formatProductName(p._raw).toLowerCase();
        const kode = (p.kode || "").toLowerCase();
        return kode.includes(s) || namaProduk.includes(s);
      });
    }

    if (filterJenis) {
      result = result.filter((p) => String(p.jenis_id) === String(filterJenis));
    }

    if (filterType) {
      result = result.filter((p) => String(p.type_id) === String(filterType));
    }

    return result;
  }, [normalizedProducts, search, filterJenis, filterType, selectedId]);

  const selected = normalizedProducts.find((p) => String(p.id) === String(selectedId));

  const filteredTypes = useMemo(() => {
    if (!filterJenis) return typeList;
    return typeList.filter((t) => {
      const jenisId = t.jenis_id ?? t.jenis?.id;
      return String(jenisId) === String(filterJenis);
    });
  }, [filterJenis, typeList]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const resetFilters = () => {
    setSearch("");
    setFilterJenis("");
    setFilterType("");
  };

  const handleSelect = (id) => {
    onSelect(id);
    setTimeout(() => setIsOpen(false), 200);
  };

  if (disabled) {
    return (
      <div className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-left cursor-not-allowed opacity-75">
        <span className="truncate flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-700">{selected.kode || '-'}</span>
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {formatProductName(selected._raw)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-slate-400" />
              </div>
              <span className="text-slate-500 text-sm">Belum ada produk</span>
            </>
          )}
        </span>
      </div>
    );
  }

  return (
    <div ref={triggerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 border rounded-xl bg-white text-left transition-all",
          isOpen ? "border-indigo-400 ring-2 ring-indigo-100" : "border-slate-200 hover:border-indigo-300"
        )}
      >
        <span className="truncate flex items-center gap-2 min-w-0">
          {selected ? (
            <>
              <div className="p-1.5 bg-indigo-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-indigo-600" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-mono font-bold text-xs text-indigo-700">{selected.kode || '-'}</span>
                  <span className={cn(
                    "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                    getStokFromMap(selected.id, stokMap) > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  )}>
                    Stok: {getStokFromMap(selected.id, stokMap)}
                  </span>
                  {selected._fromDetail && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                      Existing
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 truncate mt-0.5">
                  {formatProductName(selected._raw)}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="p-1.5 bg-slate-100 rounded-lg flex-shrink-0">
                <Package size={13} className="text-slate-400" />
              </div>
              <span className="text-slate-500 text-sm">Pilih Produk...</span>
            </>
          )}
        </span>
        {isOpen ? <ChevronUp size={16} className="text-slate-400 flex-shrink-0" /> : <ChevronDown size={16} className="text-slate-400 flex-shrink-0" />}
      </button>

      <DropdownPortal open={isOpen} style={style} onClose={() => setIsOpen(false)}>
        <div className="p-3 border-b border-slate-100 bg-slate-50/50 space-y-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Cari kode/nama produk..."
              className="w-full pl-9 pr-8 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-100 rounded transition"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex gap-1.5">
            <select
              className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200 transition"
              value={filterJenis}
              onChange={(e) => { setFilterJenis(e.target.value); setFilterType(""); }}
            >
              <option value="">Semua Jenis</option>
              {jenisList.map((j) => (
                <option key={j.value ?? j.id} value={j.value ?? j.id}>{j.label ?? j.nama}</option>
              ))}
            </select>
            <select
              className="flex-1 py-1.5 px-2 text-xs border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:bg-slate-50 disabled:cursor-not-allowed transition"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              disabled={!filterJenis}
            >
              <option value="">Semua Tipe</option>
              {filteredTypes.map((t) => (
                <option key={t.value ?? t.id} value={t.value ?? t.id}>{t.label ?? t.nama}</option>
              ))}
            </select>
            {(search || filterJenis || filterType) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                title="Reset filter"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {(search || filterJenis || filterType) && (
            <p className="text-[10px] text-slate-500 text-center">
              {filtered.length} dari {normalizedProducts.length} produk
            </p>
          )}
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="p-6 text-center">
              <Package size={24} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-500">Produk tidak ditemukan</p>
            </div>
          ) : (
            filtered.map((p) => {
              const isSelected = String(p.id) === String(selectedId);
              const stok = getStokFromMap(p.id, stokMap);
              const isOutOfStock = stok <= 0 && !p._fromDetail; // ✅ Existing product bisa tetap dipilih
              return (
                <button
                  key={p._key}
                  type="button"
                  onClick={() => { if (!isOutOfStock || isSelected) handleSelect(p.id); }}
                  disabled={isOutOfStock && !isSelected}
                  className={cn(
                    "w-full px-3 py-2.5 text-left hover:bg-indigo-50 flex items-center gap-3 border-b border-slate-100 last:border-0 transition",
                    isSelected ? "bg-indigo-50" : "",
                    isOutOfStock && !isSelected ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""
                  )}
                >
                  <div className={cn(
                    "p-1.5 rounded-lg flex-shrink-0",
                    isSelected ? "bg-indigo-100" : "bg-slate-100"
                  )}>
                    <Package size={13} className={cn(
                      isSelected ? "text-indigo-600" : "text-slate-500",
                      isOutOfStock && !isSelected && "text-red-400"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-bold text-xs">{p.kode || "-"}</span>
                      <span className={cn(
                        "text-[9px] px-1.5 py-0.5 rounded-full font-semibold",
                        stok > 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {stok > 0 ? `${stok} unit` : "Habis"}
                      </span>
                      {p._fromDetail && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-700">
                          Di Transaksi
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 truncate">
                      {formatProductName(p._raw)}
                    </p>
                  </div>
                  {isSelected && <CheckCircle2 size={16} className="text-indigo-600 flex-shrink-0" />}
                </button>
              );
            })
          )}
        </div>
      </DropdownPortal>
    </div>
  );
};

// ==========================================
// MAIN FORM COMPONENT (BUG 1 + BUG 2 FIXED)
// ==========================================
const TransaksiForm = () => {
  const { modals, selectedTransaksi, closeAllModals } = useTransaksiModals();
  const createMut = useCreateTransaksi();
  const updateMut = useUpdateTransaksi();
  const { success, info } = useConfirmDialog();

  const { data: statusList = [], isLoading: loadingStatus } = useStatusTransaksiList();
  const { data: products = [], isLoading: loadingProducts } = useProductsFull();
  const { data: customers = [], isLoading: loadingCustomers } = useCustomersFull();
  const { data: jenisList = [] } = useJenisDropdown();
  const { data: typeList = [] } = useTypesDropdown();

  const { data: stokMapData = {}, isLoading: loadingStok } = useStokMap('TOKO');

  const stokTokoMap = useMemo(() => {
    const map = new Map();
    if (stokMapData && typeof stokMapData === 'object') {
      Object.entries(stokMapData).forEach(([productId, qty]) => {
        map.set(Number(productId), Number(qty) || 0);
      });
    }
    return map;
  }, [stokMapData]);

  const isOpen = modals.form;
  const isEdit = !!selectedTransaksi;
  const isSubmitting = createMut.isPending || updateMut.isPending;

  const statusProses = statusList.find((s) => s.nama?.toLowerCase().includes("proses"));
  const statusProsesId = statusProses?.id?.toString() || String(STATUS_MAP.PROSES);

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    tanggal: new Date().toISOString().split("T")[0],
    details: [],
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [editableIndices, setEditableIndices] = useState(new Set());

  // ✅ BUG 1 FIX: Enrich products dengan data dari selectedTransaksi.details
  // Ini memastikan produk yang sudah ada di transaksi tetap muncul di dropdown
  // meskipun produk tersebut sudah tidak "available" di endpoint /products/available
  const enrichedProducts = useMemo(() => {
    if (!isEdit || !selectedTransaksi?.details) return products;

    const existingProductIds = new Set(
      (products || []).map(p => String(p.id ?? p.value ?? p._id))
    );

    const missingProducts = [];
    selectedTransaksi.details.forEach(d => {
      if (d.product && !existingProductIds.has(String(d.product_id))) {
        missingProducts.push({
          ...d.product,
          id: d.product_id,
          kode: d.product?.kode || `#${d.product_id}`,
          _fromDetail: true, // ✅ Flag untuk menandai produk dari detail existing
        });
      }
    });

    if (missingProducts.length === 0) return products;
    return [...(products || []), ...missingProducts];
  }, [products, isEdit, selectedTransaksi]);

  // ✅ BUG 2 FIX: Effective stok = stok real-time + qty existing di transaksi ini
  // Ini adalah "stok yang tersedia untuk diedit" — termasuk stok yang sudah
  // "dipakai" oleh detail existing dalam transaksi ini
  const effectiveStokMap = useMemo(() => {
    const map = new Map(stokTokoMap);

    if (isEdit && selectedTransaksi?.details) {
      selectedTransaksi.details
        .filter(d => String(d.status_transaksi_id) !== String(STATUS_MAP.DIBATALKAN))
        .forEach(d => {
          const pid = Number(d.product_id);
          const existingQty = Number(d.qty) || 0;
          const current = map.get(pid) || 0;
          map.set(pid, current + existingQty); // "kembalikan" qty existing ke stok
        });
    }

    return map;
  }, [stokTokoMap, isEdit, selectedTransaksi]);

  const selectedCustomerInfo = useMemo(() => {
    if (isCreatingCustomer && form.customer_baru.name) {
      return { id: null, name: form.customer_baru.name, phone: form.customer_baru.phone || "" };
    }
    if (form.customer_id) {
      const c = customers.find((c) => String(c.id ?? c.value) === String(form.customer_id));
      return {
        id: c?.id ?? c?.value,
        name: c?.name || c?.label || c?.nama || "",
        phone: c?.no_hp || c?.phone || "",
      };
    }
    return { id: null, name: "", phone: "" };
  }, [form.customer_id, form.customer_baru, isCreatingCustomer, customers]);

  useEffect(() => {
    if (isOpen) {
      if (isEdit && selectedTransaksi) {
        const activeDetails = (selectedTransaksi.details || [])
          .filter((d) => String(d.status_transaksi_id) !== String(STATUS_MAP.DIBATALKAN))
          .map((d) => ({
            id: d.id, // ✅ Pastikan id tersimpan untuk backend update
            product_id: String(d.product_id || ""),
            qty: d.qty || 1,
            discount: d.discount || 0,
            catatan: d.catatan || "",
            status_transaksi_id: String(d.status_transaksi_id || statusProsesId),
            harga_product_id: d.harga_product_id ? String(d.harga_product_id) : "",
            harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
            selected_harga: Number(d.harga) || 0,
            harga_label: d.harga ? `Rp ${formatRupiah(d.harga)} (tersimpan)` : "",
          }));

        setForm({
          customer_id: String(selectedTransaksi.customer_id || ""),
          customer_baru: {
            name: selectedTransaksi.customer?.name || "",
            phone: selectedTransaksi.customer?.no_hp || selectedTransaksi.customer?.phone || "",
            email: "",
          },
          tanggal: selectedTransaksi.tanggal || new Date().toISOString().split("T")[0],
          details: activeDetails.length > 0 ? activeDetails : [createEmptyDetail(statusProsesId)],
        });
        setIsCreatingCustomer(!selectedTransaksi.customer_id && !!selectedTransaksi.customer);
        setEditableIndices(new Set());
      } else {
        setForm({
          customer_id: "",
          customer_baru: { name: "", phone: "", email: "" },
          tanggal: new Date().toISOString().split("T")[0],
          details: [createEmptyDetail(statusProsesId)],
        });
        setIsCreatingCustomer(false);
        setEditableIndices(new Set([0]));
      }
    }
  }, [isOpen, isEdit, selectedTransaksi, statusProsesId]);

  const toggleEditDetail = (index) => {
    setEditableIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const addDetailRow = () => {
    const newIndex = form.details.length;
    setForm((f) => ({ ...f, details: [...f.details, createEmptyDetail(statusProsesId)] }));
    setEditableIndices((prev) => new Set([...prev, newIndex]));
  };

  const removeDetailRow = (index) => {
    setForm((f) => ({ ...f, details: f.details.filter((_, i) => i !== index) }));
    setEditableIndices((prev) => {
      const next = new Set();
      prev.forEach((i) => {
        if (i < index) next.add(i);
        else if (i > index) next.add(i - 1);
      });
      return next;
    });
  };

  const updateDetail = (index, field, value) => {
    setForm((f) => {
      const updated = [...f.details];
      const current = updated[index];

      // ✅ Pastikan id tidak hilang saat update field lain
      updated[index] = {
        ...current,
        [field]: value,
        id: current.id, // Explicit preserve id
      };

      if (field === "product_id") {
        updated[index].harga_product_id = "";
        updated[index].harga_baru = { harga: "", keterangan: "", tanggal_berlaku: "" };
        updated[index].selected_harga = 0;
        updated[index].harga_label = "";
      }

      return { ...f, details: updated };
    });
  };

  const updateHarga = (index, hargaData) => {
    setForm((f) => {
      const updated = [...f.details];
      updated[index] = { ...updated[index], ...hargaData };
      return { ...f, details: updated };
    });
  };

  const { totalTransaksi, totalDiscount } = useMemo(() => {
    let total = 0;
    let discount = 0;

    form.details.forEach((d) => {
      if (!d.product_id || !d.selected_harga) return;
      const qty = Number(d.qty) || 0;
      const disc = Number(d.discount) || 0;
      const subtotal = (d.selected_harga * qty) - disc;
      total += subtotal;
      discount += disc;
    });

    return { totalTransaksi: total, totalDiscount: discount };
  }, [form.details]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      await info("Peringatan", "Pilih customer atau isi nama customer baru");
      return;
    }

    if (!form.tanggal) {
      await info("Peringatan", "Tanggal transaksi wajib diisi");
      return;
    }

    if (form.details.length === 0 || !form.details.some((d) => d.product_id)) {
      await info("Peringatan", "Tambahkan minimal 1 produk");
      return;
    }

    const stokErrors = [];
    const hargaErrors = [];

    // ✅ BUG 2 FIX: Hitung total qty per product untuk validasi yang lebih akurat
    const qtyPerProduct = new Map();
    form.details.forEach((d) => {
      if (!d.product_id) return;
      const pid = Number(d.product_id);
      const qty = Number(d.qty) || 0;
      qtyPerProduct.set(pid, (qtyPerProduct.get(pid) || 0) + qty);
    });

    // Validasi total qty per product vs effective stok
    qtyPerProduct.forEach((totalQty, pid) => {
      const effectiveStok = effectiveStokMap.get(pid) || 0;
      if (totalQty > effectiveStok) {
        const product = enrichedProducts.find((p) => String(p.id) === String(pid));
        stokErrors.push(
          `${product?.kode || `Produk #${pid}`}: Total qty ${totalQty} > Stok tersedia ${effectiveStok}`
        );
      }
    });

    // Validasi harga
    form.details.forEach((d, idx) => {
      if (!d.product_id) return;
      if (!d.harga_product_id && !d.selected_harga) {
        const product = enrichedProducts.find((p) => String(p.id) === String(d.product_id));
        hargaErrors.push(`Item #${idx + 1} (${product?.kode || "Produk"}): Harga belum dipilih`);
      }
    });

    if (stokErrors.length > 0) {
      await info("Stok Tidak Cukup", stokErrors.join("\n"));
      return;
    }

    if (hargaErrors.length > 0) {
      await info("Harga Belum Dipilih", hargaErrors.join("\n"));
      return;
    }

    const payload = {
      customer_id: form.customer_id || undefined,
      customer_baru: isCreatingCustomer ? {
        name: form.customer_baru.name.trim(),
        phone: form.customer_baru.phone.trim() || undefined,
        email: form.customer_baru.email.trim() || undefined,
      } : undefined,
      tanggal: form.tanggal,
      details: form.details
        .filter((d) => d.product_id)
        .map((d) => {
          const detailPayload = {
            id: d.id || undefined, // ✅ Kirim id untuk existing details
            product_id: Number(d.product_id),
            qty: Number(d.qty) || 1,
            discount: Number(d.discount) || 0,
            catatan: d.catatan.trim() || undefined,
            status_transaksi_id: Number(d.status_transaksi_id || statusProsesId),
          };

          if (d.harga_product_id) {
            detailPayload.harga_product_id = Number(d.harga_product_id);
          } else if (d.harga_baru && d.harga_baru.harga) {
            detailPayload.harga_baru = {
              harga: Number(d.harga_baru.harga),
              keterangan: d.harga_baru.keterangan?.trim() || undefined,
              tanggal_berlaku: d.harga_baru.tanggal_berlaku || new Date().toISOString().split("T")[0],
            };
          }

          return detailPayload;
        }),
    };

    try {
      if (isEdit) {
        await updateMut.mutateAsync({ id: selectedTransaksi.id, data: payload });
        await success("Berhasil!", "Transaksi berhasil diperbarui");
      } else {
        await createMut.mutateAsync(payload);
        await success("Berhasil!", "Transaksi berhasil dibuat");
      }
      closeAllModals();
    } catch (err) {
      if (err.response?.data?.errors) {
        const msgs = Object.values(err.response.data.errors).flat().join("\n");
        await info("Validasi Gagal", msgs);
      } else {
        await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-5xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 h-[95vh] sm:h-auto sm:max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className={cn(
          "px-5 sm:px-6 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0",
          isEdit ? "bg-gradient-to-r from-amber-50 via-orange-50 to-white" : "bg-gradient-to-r from-indigo-50 via-purple-50 to-white"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2.5 rounded-xl shadow-sm",
              isEdit ? "bg-gradient-to-br from-amber-500 to-orange-600" : "bg-gradient-to-br from-indigo-500 to-purple-600"
            )}>
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {isEdit ? "Edit Transaksi" : "Transaksi Baru"}
              </h2>
              <p className="text-[11px] sm:text-xs text-slate-500">
                {isEdit ? "Klik ikon pensil untuk edit detail" : "Buat transaksi penjualan baru"}
              </p>
            </div>
          </div>
          <button
            onClick={closeAllModals}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500 group-hover:text-slate-700 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-5 sm:p-6 space-y-5">
            {(loadingProducts || loadingCustomers || loadingStatus || loadingStok) && (
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-2 text-sm text-blue-800">
                <Loader2 className="w-4 h-4 animate-spin" />
                Memuat data master...
              </div>
            )}

            {/* Customer & Tanggal */}
            <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                <div className="p-1.5 bg-indigo-100 rounded-lg">
                  <User size={14} className="text-indigo-600" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">Informasi Customer</h3>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Customer
                </label>
                <CustomerDropdown
                  customers={customers}
                  selectedId={form.customer_id}
                  onSelect={(id) => {
                    setForm((f) => {
                      const updated = { ...f, customer_id: id, customer_baru: { name: "", phone: "", email: "" } };
                      updated.details = updated.details.map((d) => ({
                        ...d,
                        harga_product_id: "",
                        harga_baru: { harga: "", keterangan: "", tanggal_berlaku: "" },
                        selected_harga: 0,
                        harga_label: "",
                      }));
                      return updated;
                    });
                    setIsCreatingCustomer(false);
                  }}
                  onCreateNew={() => {
                    setIsCreatingCustomer(true);
                    setForm((f) => ({ ...f, customer_id: "" }));
                  }}
                  disabled={isSubmitting || loadingCustomers}
                />

                {isCreatingCustomer && (
                  <div className="mt-3 p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200 space-y-3 animate-fadeIn">
                    <div className="flex items-center gap-2 pb-2 border-b border-blue-200">
                      <div className="p-1.5 bg-white rounded-lg shadow-sm">
                        <User size={13} className="text-blue-600" />
                      </div>
                      <p className="text-sm font-semibold text-blue-900">Customer Baru</p>
                    </div>
                    <input
                      type="text"
                      placeholder="Nama Customer *"
                      className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                      value={form.customer_baru.name}
                      onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, name: e.target.value } }))}
                      disabled={isSubmitting}
                      autoFocus
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="tel"
                        placeholder="No HP"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                        value={form.customer_baru.phone}
                        onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, phone: e.target.value } }))}
                        disabled={isSubmitting}
                      />
                      <input
                        type="email"
                        placeholder="Email (opsional)"
                        className="w-full px-3 py-2.5 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-200 focus:outline-none focus:border-blue-400 transition"
                        value={form.customer_baru.email}
                        onChange={(e) => setForm((f) => ({ ...f, customer_baru: { ...f.customer_baru, email: e.target.value } }))}
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide items-center gap-1.5">
                  <Calendar size={13} className="text-indigo-600" />
                  Tanggal Transaksi
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 text-sm bg-white transition"
                  value={form.tanggal}
                  onChange={(e) => setForm((f) => ({ ...f, tanggal: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Details */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-indigo-100 rounded-lg">
                    <Package size={14} className="text-indigo-600" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800">Detail Produk</h3>
                  <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                    {form.details.length} item
                  </span>
                  {isEdit && (
                    <span className="text-[10px] font-medium px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full flex items-center gap-1">
                      <Lock size={9} />
                      {editableIndices.size > 0 ? `${editableIndices.size} diedit` : "Semua terkunci"}
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {form.details.map((detail, index) => {
                  const product = enrichedProducts.find((p) => String(p.id ?? p.value) === String(detail.product_id));
                  // ✅ BUG 2 FIX: Gunakan effectiveStokMap untuk display stok
                  const stok = detail.product_id ? getStokFromMap(detail.product_id, effectiveStokMap) : 0;
                  const detailKey = detail.id ? `detail-${detail.id}` : `detail-new-${index}`;
                  const qtyNum = Number(detail.qty) || 0;
                  const hargaNum = Number(detail.selected_harga) || 0;
                  const subtotal = (hargaNum * qtyNum) - (Number(detail.discount) || 0);
                  const exceedsStok = qtyNum > stok && stok >= 0;

                  const isEditable = editableIndices.has(index);
                  const isLocked = !isEditable;

                  return (
                    <div
                      key={detailKey}
                      className={cn(
                        "border rounded-2xl transition-all duration-200",
                        exceedsStok && isEditable
                          ? "border-red-300 shadow-sm shadow-red-100"
                          : isLocked
                            ? "border-slate-200 bg-slate-50/30"
                            : "border-slate-200 hover:shadow-md hover:border-slate-300"
                      )}
                    >
                      <div className={cn(
                        "flex items-center justify-between px-4 py-2.5 rounded-t-2xl",
                        exceedsStok && isEditable ? "bg-red-50"
                          : isLocked ? "bg-slate-100"
                          : "bg-slate-50"
                      )}>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider",
                            exceedsStok && isEditable ? "bg-red-100 text-red-700"
                              : isLocked ? "bg-slate-200 text-slate-600"
                              : "bg-slate-200 text-slate-700"
                          )}>
                            Item #{index + 1}
                          </span>
                          {isLocked ? (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                              <Lock size={10} /> Terkunci
                            </span>
                          ) : (
                            <span className="text-[10px] text-indigo-600 flex items-center gap-1 font-medium">
                              <Unlock size={10} /> Diedit
                            </span>
                          )}
                          {exceedsStok && isEditable && (
                            <span className="text-[10px] text-red-600 flex items-center gap-1">
                              <AlertCircle size={11} /> Melebihi stok
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1">
                          {detail.product_id && (
                            <button
                              type="button"
                              onClick={() => toggleEditDetail(index)}
                              disabled={isSubmitting}
                              className={cn(
                                "p-1.5 rounded-lg transition",
                                isLocked
                                  ? "text-amber-600 hover:bg-amber-100"
                                  : "text-indigo-600 hover:bg-indigo-100"
                              )}
                              title={isLocked ? "Edit item ini" : "Kunci item ini"}
                            >
                              {isLocked ? <Pencil size={14} /> : <Lock size={14} />}
                            </button>
                          )}
                          {isEditable && form.details.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeDetailRow(index)}
                              className="text-red-500 hover:bg-red-100 p-1.5 rounded-lg transition"
                              disabled={isSubmitting}
                              title="Hapus item"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className={cn("p-4 space-y-3 transition-opacity", isLocked && "opacity-80")}>
                        <ProductDropdown
                          products={enrichedProducts} // ✅ Gunakan enrichedProducts
                          selectedId={detail.product_id}
                          onSelect={(id) => updateDetail(index, "product_id", id)}
                          jenisList={jenisList}
                          typeList={typeList}
                          stokMap={effectiveStokMap} // ✅ Gunakan effectiveStokMap
                          disabled={isLocked || isSubmitting}
                        />

                        {detail.product_id && (
                          <HargaSelector
                            detailIndex={index}
                            detail={detail}
                            productId={detail.product_id}
                            customerId={selectedCustomerInfo.id}
                            customerName={selectedCustomerInfo.name}
                            onUpdateHarga={updateHarga}
                            disabled={isLocked || isSubmitting}
                          />
                        )}

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div>
                            <label className={cn(
                              "block text-[10px] font-semibold mb-1 uppercase tracking-wide",
                              exceedsStok && isEditable ? "text-red-600" : "text-slate-600"
                            )}>
                              Qty <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="number"
                              min="1"
                              max={stok || 9999}
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm font-semibold focus:ring-2 focus:outline-none transition",
                                isLocked
                                  ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                                  : exceedsStok
                                    ? "border-red-300 focus:ring-red-500 bg-red-50"
                                    : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-400"
                              )}
                              value={detail.qty}
                              onChange={(e) => updateDetail(index, "qty", e.target.value)}
                              disabled={isLocked || isSubmitting || !product}
                              readOnly={isLocked}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Stok Tersedia
                            </label>
                            <div className={cn(
                              "w-full px-3 py-2 border rounded-lg text-sm font-bold",
                              stok > 0 ? "bg-green-50 border-green-200 text-green-700" : "bg-red-50 border-red-200 text-red-700"
                            )}>
                              {product ? `${stok} unit` : "-"}
                            </div>
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Diskon
                            </label>
                            <input
                              type="text"
                              inputMode="numeric"
                              className={cn(
                                "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none transition",
                                isLocked
                                  ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                                  : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-400"
                              )}
                              value={detail.discount ? formatRupiah(detail.discount) : ""}
                              onChange={(e) => updateDetail(index, "discount", unformatRupiah(e.target.value))}
                              placeholder="0"
                              disabled={isLocked || isSubmitting}
                              readOnly={isLocked}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                              Subtotal
                            </label>
                            <div className={cn(
                              "w-full px-3 py-2 rounded-lg text-sm font-bold border",
                              subtotal > 0
                                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 text-green-700"
                                : "bg-slate-50 border-slate-200 text-slate-800"
                            )}>
                              {product && hargaNum > 0 ? formatRupiah(subtotal) : "-"}
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-semibold text-slate-600 mb-1 uppercase tracking-wide">
                            Catatan (opsional)
                          </label>
                          <input
                            type="text"
                            className={cn(
                              "w-full px-3 py-2 border rounded-lg text-sm focus:ring-2 focus:outline-none transition",
                              isLocked
                                ? "border-slate-200 bg-slate-100 text-slate-700 cursor-not-allowed"
                                : "border-slate-200 focus:ring-indigo-200 focus:border-indigo-400"
                            )}
                            value={detail.catatan}
                            onChange={(e) => updateDetail(index, "catatan", e.target.value)}
                            placeholder="Catatan khusus..."
                            disabled={isLocked || isSubmitting}
                            readOnly={isLocked}
                            maxLength={500}
                          />
                        </div>

                        {isLocked && detail.product_id && (
                          <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                            <p className="text-[11px] text-slate-500 italic flex items-center gap-1">
                              <Lock size={11} />
                              Item terkunci untuk mencegah perubahan tidak sengaja
                            </p>
                            <button
                              type="button"
                              onClick={() => toggleEditDetail(index)}
                              disabled={isSubmitting}
                              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors"
                            >
                              <Pencil size={12} /> Edit Item
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={addDetailRow}
                disabled={isSubmitting}
                className={cn(
                  "mt-4 w-full flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-dashed transition-all duration-200 group",
                  isSubmitting
                    ? "border-slate-200 bg-slate-50 cursor-not-allowed opacity-50"
                    : "border-indigo-300 hover:border-indigo-500 bg-gradient-to-br from-indigo-50/50 to-purple-50/50 hover:from-indigo-50 hover:to-purple-50 hover:shadow-md active:scale-[0.99]"
                )}
              >
                <div className={cn(
                  "p-2 rounded-full transition-colors",
                  isSubmitting ? "bg-slate-200" : "bg-indigo-100 group-hover:bg-indigo-200"
                )}>
                  <Plus size={18} className={cn(
                    "transition-transform",
                    isSubmitting ? "text-slate-400" : "text-indigo-600 group-hover:scale-110"
                  )} />
                </div>
                <div className="text-left">
                  <p className={cn(
                    "text-sm font-bold",
                    isSubmitting ? "text-slate-400" : "text-indigo-700"
                  )}>
                    Tambah Item Produk
                  </p>
                  <p className={cn(
                    "text-[11px]",
                    isSubmitting ? "text-slate-400" : "text-indigo-500"
                  )}>
                    Item baru akan otomatis dalam mode edit
                  </p>
                </div>
              </button>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white flex-shrink-0">
          <div className="px-5 sm:px-6 py-3 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200">
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Items</p>
                <p className="text-sm font-bold text-slate-900">{form.details.filter(d => d.product_id).length}</p>
              </div>
              <div className="text-center border-x border-slate-200">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Diskon</p>
                <p className="text-sm font-bold text-red-600">
                  {totalDiscount > 0 ? `- Rp ${formatRupiah(totalDiscount)}` : "Rp 0"}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">Total</p>
                <p className="text-sm font-bold text-indigo-700">Rp {formatRupiah(totalTransaksi)}</p>
              </div>
            </div>
          </div>

          <div className="px-5 sm:px-6 py-3 sm:py-4 flex gap-2 sm:gap-3">
            <button
              type="button"
              onClick={closeAllModals}
              className="flex-1 sm:flex-none sm:px-6 py-3 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              disabled={isSubmitting}
            >
              Batal
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              disabled={isSubmitting || totalTransaksi === 0}
              className={cn(
                "flex-[2] sm:flex-1 px-6 py-3 text-sm font-bold text-white rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed",
                isEdit
                  ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 shadow-amber-500/30"
                  : "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-indigo-500/30"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> <span className="hidden sm:inline">Menyimpan...</span></>
              ) : (
                <>
                  <TrendingUp size={16} />
                  <span>{isEdit ? "Perbarui" : "Simpan Transaksi"}</span>
                  <span className="hidden sm:inline font-mono text-xs opacity-90">
                    • Rp {formatRupiah(totalTransaksi)}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransaksiForm;