import { useState, useEffect, useMemo, useCallback } from "react";
import {
  X, Search, CheckCircle2, Square, CheckSquare,
  Package, Calendar, Loader2, Warehouse,
} from "lucide-react";
import { useStokOpnameModals } from "../../../lib/zustand/stokOpnameStore";
import { useCreateStokOpname } from "../../../hooks/useStokOpname";
import { useInventories } from "../../../hooks/useInventory";
import { usePlacesDropdown } from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(Boolean).join(" • ") || "-";
};

const StokOpnameForm = () => {
  const { modals, closeAllModals } = useStokOpnameModals();
  const createMut = useCreateStokOpname();
  const { success, info, warning } = useConfirmDialog();

  const isOpen = modals.create;
  const isSubmitting = createMut.isPending;

  const [form, setForm] = useState({
    tgl_opname: new Date().toISOString().split("T")[0],
    keterangan: "",
  });
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [placeFilter, setPlaceFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: placesOptions = [] } = usePlacesDropdown();

  // Fetch inventories (all, no pagination for selection)
  const { data: invData, isLoading: loadingInv } = useInventories({ perPage: 500 });
  const allInventories = invData?.inventories || [];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Reset form saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setForm({ tgl_opname: new Date().toISOString().split("T")[0], keterangan: "" });
      setSelectedIds(new Set());
      setPlaceFilter("");
      setSearchInput("");
      setDebouncedSearch("");
    }
  }, [isOpen]);

  // Filter inventories client-side
  const filteredInventories = useMemo(() => {
    let result = [...allInventories];
    if (placeFilter) {
      result = result.filter((inv) => String(inv.place_id) === String(placeFilter));
    }
    if (debouncedSearch) {
      const term = debouncedSearch.toLowerCase();
      result = result.filter((inv) => {
        const p = inv.product;
        if (!p) return false;
        return (
          p.kode?.toLowerCase().includes(term) ||
          formatProductName(p).toLowerCase().includes(term)
        );
      });
    }
    return result;
  }, [allInventories, placeFilter, debouncedSearch]);

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredInventories.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredInventories.map((inv) => inv.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) {
      await warning("Peringatan", "Pilih minimal satu inventory untuk opname");
      return;
    }

    const payload = {
      tgl_opname: form.tgl_opname,
      keterangan: form.keterangan.trim() || undefined,
      inventory_ids: Array.from(selectedIds),
    };

    try {
      await createMut.mutateAsync(payload);
      closeAllModals();
      await success("Berhasil!", `Stok opname dengan ${selectedIds.size} item berhasil dibuat`);
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Package className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Buat Stok Opname Baru</h2>
              <p className="text-xs text-slate-500">Pilih item untuk dicocokkan stok fisik dengan sistem</p>
            </div>
          </div>
          <button onClick={closeAllModals} className="p-2 hover:bg-slate-100 rounded-lg transition-colors" disabled={isSubmitting}>
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Header Form */}
          <div className="bg-slate-50 rounded-xl p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5 items-center gap-1.5">
                  <Calendar size={14} /> Tanggal Opname
                </label>
                <input
                  type="date"
                  value={form.tgl_opname}
                  onChange={(e) => setForm({ ...form, tgl_opname: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  placeholder="Opsional"
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="sticky top-0 bg-white z-10 pb-2 pt-1">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 min-w-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Cari kode atau nama produk..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                  disabled={isSubmitting}
                />
              </div>
              <div className="relative flex-shrink-0 min-w-[160px]">
                <Warehouse className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  value={placeFilter}
                  onChange={(e) => setPlaceFilter(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={isSubmitting}
                >
                  <option value="">Semua Tempat</option>
                  {placesOptions.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between mt-2 text-xs text-slate-500">
              <button
                type="button"
                onClick={toggleSelectAll}
                className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-medium transition"
                disabled={isSubmitting || filteredInventories.length === 0}
              >
                {selectedIds.size === filteredInventories.length && filteredInventories.length > 0 ? (
                  <><CheckSquare size={14} /> Batalkan Semua</>
                ) : (
                  <><Square size={14} /> Pilih Semua ({filteredInventories.length})</>
                )}
              </button>
              <span className="font-medium">
                Terpilih: <span className="text-indigo-600">{selectedIds.size}</span>
              </span>
            </div>
          </div>

          {/* Inventory Grid */}
          {loadingInv ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-3 animate-pulse">
                  <div className="h-3 bg-slate-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-slate-200 rounded w-1/2 mb-3" />
                  <div className="h-8 bg-slate-200 rounded w-1/2 mx-auto" />
                </div>
              ))}
            </div>
          ) : filteredInventories.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Tidak ada inventory ditemukan</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredInventories.map((inv) => {
                const isSelected = selectedIds.has(inv.id);
                return (
                  <div
                    key={inv.id}
                    onClick={() => !isSubmitting && toggleSelect(inv.id)}
                    className={cn(
                      "relative border-2 rounded-xl p-3 cursor-pointer transition-all duration-200 hover:shadow-md",
                      isSelected
                        ? "border-indigo-500 bg-indigo-50 shadow-sm"
                        : "border-slate-200 hover:border-slate-300 bg-white"
                    )}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="text-white w-3 h-3" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-mono font-bold text-[10px] text-indigo-600 mb-1 truncate">
                        {inv.product?.kode || "-"}
                      </p>
                      <p className="text-xs text-slate-700 font-medium line-clamp-2 min-h-[32px] leading-tight mb-2">
                        {formatProductName(inv.product)}
                      </p>
                      <div className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full mb-2">
                        <Warehouse size={10} className="text-slate-500" />
                        <span className="text-[10px] font-medium text-slate-600">{inv.place?.nama || "-"}</span>
                      </div>
                      <div className="pt-2 border-t border-slate-100">
                        <p className="text-xl font-bold text-slate-900">{inv.qty}</p>
                        <p className="text-[10px] text-slate-500">Stok Sistem</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex gap-3 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={closeAllModals}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedIds.size === 0}
            className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</>
            ) : (
              <>Buat Opname ({selectedIds.size} item)</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StokOpnameForm;