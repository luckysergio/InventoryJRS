import { useState, useEffect, useMemo } from "react";
import {
  X, Calendar, Loader2, Warehouse, Package, CheckCircle2,
  Store, Wrench, AlertCircle, Sparkles,
} from "lucide-react";
import { useStokOpnameModals } from "../../../lib/zustand/stokOpnameStore";
import { useCreateForPlacesStokOpname } from "../../../hooks/useStokOpname";
import { useAvailableInventories } from "../../../hooks/useStokOpname";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const PLACE_OPTIONS = [
  {
    kode: "TOKO",
    label: "Toko",
    description: "Produk yang dipajang di area toko",
    icon: Store,
    gradient: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50",
    border: "border-blue-300",
    ring: "ring-blue-500",
    text: "text-blue-700",
  },
  {
    kode: "BENGKEL",
    label: "Bengkel",
    description: "Produk yang ada di area bengkel/produksi",
    icon: Wrench,
    gradient: "from-purple-500 to-indigo-500",
    bg: "bg-purple-50",
    border: "border-purple-300",
    ring: "ring-purple-500",
    text: "text-purple-700",
  },
];

const StokOpnameForm = () => {
  const { modals, closeAllModals } = useStokOpnameModals();
  const createMut = useCreateForPlacesStokOpname();
  const { success, info, warning } = useConfirmDialog();

  const isOpen = modals.create;
  const isSubmitting = createMut.isPending;

  const [form, setForm] = useState({
    tgl_opname: new Date().toISOString().split("T")[0],
    keterangan: "",
  });
  const [selectedPlaces, setSelectedPlaces] = useState(new Set(["TOKO", "BENGKEL"]));

  // Fetch inventory count berdasarkan place yang dipilih
  const placeArray = useMemo(() => Array.from(selectedPlaces), [selectedPlaces]);
  const { data: availableData, isLoading: loadingCount } = useAvailableInventories(placeArray);
  const summary = availableData?.summary || { total_items: 0, by_place: [] };

  // Reset form saat modal terbuka
  useEffect(() => {
    if (isOpen) {
      setForm({
        tgl_opname: new Date().toISOString().split("T")[0],
        keterangan: "",
      });
      setSelectedPlaces(new Set(["TOKO", "BENGKEL"]));
    }
  }, [isOpen]);

  const togglePlace = (kode) => {
    const newSet = new Set(selectedPlaces);
    if (newSet.has(kode)) {
      if (newSet.size === 1) {
        info("Peringatan", "Pilih minimal satu tempat untuk di-opname");
        return;
      }
      newSet.delete(kode);
    } else {
      newSet.add(kode);
    }
    setSelectedPlaces(newSet);
  };

  const selectAllPlaces = () => setSelectedPlaces(new Set(["TOKO", "BENGKEL"]));

  const getPlaceCount = (kode) => {
    const placeData = summary.by_place?.find((p) => p.kode === kode);
    return placeData?.count || 0;
  };

  const handleSubmit = async () => {
    if (selectedPlaces.size === 0) {
      await warning("Peringatan", "Pilih minimal satu tempat untuk di-opname");
      return;
    }

    if (summary.total_items === 0) {
      await warning("Tidak Ada Inventory", "Tidak ada inventory yang tersedia di tempat yang dipilih");
      return;
    }

    const confirmed = await warning(
      "Buat Stok Opname?",
      `Akan dibuat stok opname untuk ${summary.total_items} inventory dari ${selectedPlaces.size} tempat. Lanjutkan?`,
      "Ya, Buat",
      "Batal"
    );

    if (!confirmed) return;

    const payload = {
      tgl_opname: form.tgl_opname,
      keterangan: form.keterangan.trim() || undefined,
      place_kodes: Array.from(selectedPlaces),
    };

    try {
      await createMut.mutateAsync(payload);
      closeAllModals();
      await success(
        "Berhasil! 🎉",
        `Stok opname dengan ${summary.total_items} item berhasil dibuat. Silakan lanjutkan pengisian stok fisik.`
      );
    } catch (err) {
      await info("Gagal", err.response?.data?.message || "Terjadi kesalahan");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-indigo-50 via-purple-50 to-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400 blur-md opacity-30 rounded-xl" />
              <div className="relative p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg shadow-indigo-200">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">Buat Stok Opname</h2>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate">Pilih tempat untuk di-opname</p>
            </div>
          </div>
          <button
            onClick={closeAllModals}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors group flex-shrink-0"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5 text-slate-500 group-hover:rotate-90 transition-all duration-200" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-5">
          {/* Form */}
          <div className="bg-gradient-to-br from-slate-50 to-white rounded-2xl p-4 sm:p-5 border border-slate-200/60 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  <Calendar size={12} className="text-indigo-500" />
                  Tanggal Opname
                </label>
                <input
                  type="date"
                  value={form.tgl_opname}
                  onChange={(e) => setForm({ ...form, tgl_opname: e.target.value })}
                  max={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white transition-all"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 uppercase tracking-wide">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm bg-white transition-all"
                  placeholder="Opsional: SO bulanan, dll"
                  disabled={isSubmitting}
                  maxLength={500}
                />
              </div>
            </div>
          </div>

          {/* Pilih Tempat */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 uppercase tracking-wide">
                <Warehouse size={12} className="text-indigo-500" />
                Pilih Tempat Opname
              </label>
              <button
                type="button"
                onClick={selectAllPlaces}
                className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Pilih Semua
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PLACE_OPTIONS.map((place) => {
                const Icon = place.icon;
                const isSelected = selectedPlaces.has(place.kode);
                const count = getPlaceCount(place.kode);

                return (
                  <div
                    key={place.kode}
                    onClick={() => !isSubmitting && togglePlace(place.kode)}
                    className={cn(
                      "relative border-2 rounded-2xl p-4 cursor-pointer transition-all duration-300 overflow-hidden group",
                      isSelected
                        ? `${place.border} ${place.bg} shadow-md`
                        : "border-slate-200 hover:border-slate-300 bg-white hover:shadow-sm"
                    )}
                  >
                    {/* Background gradient saat selected */}
                    {isSelected && (
                      <div className={cn(
                        "absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-20 blur-2xl bg-gradient-to-br",
                        place.gradient
                      )} />
                    )}

                    {/* Checkbox indicator */}
                    <div className={cn(
                      "absolute top-3 right-3 w-6 h-6 rounded-full flex items-center justify-center transition-all",
                      isSelected
                        ? `bg-gradient-to-br ${place.gradient} shadow-md scale-100`
                        : "bg-slate-100 scale-90 group-hover:scale-100"
                    )}>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-slate-300" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="relative flex items-start gap-3">
                      <div className={cn(
                        "p-2.5 rounded-xl flex-shrink-0 transition-all",
                        isSelected
                          ? `bg-gradient-to-br ${place.gradient} shadow-md`
                          : "bg-slate-100 group-hover:bg-slate-200"
                      )}>
                        <Icon className={cn(
                          "w-5 h-5 transition-colors",
                          isSelected ? "text-white" : "text-slate-500"
                        )} />
                      </div>
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h3 className={cn(
                            "font-bold text-sm",
                            isSelected ? place.text : "text-slate-900"
                          )}>
                            {place.label}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed mb-2 line-clamp-2">
                          {place.description}
                        </p>
                        <div className="flex items-center gap-1.5">
                          {loadingCount ? (
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              <span>Menghitung...</span>
                            </div>
                          ) : (
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold",
                              isSelected
                                ? `bg-white ${place.text} shadow-sm`
                                : "bg-slate-100 text-slate-600"
                            )}>
                              <Package size={10} />
                              <span>{count.toLocaleString("id-ID")}</span>
                              <span className="font-normal">item</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary Card */}
          {selectedPlaces.size > 0 && (
            <div className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
              <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />

              <div className="relative flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-4 h-4" />
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-white/90">
                      Total Inventory
                    </p>
                  </div>
                  {loadingCount ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="text-sm">Menghitung...</span>
                    </div>
                  ) : (
                    <p className="text-3xl sm:text-4xl font-bold">
                      {summary.total_items.toLocaleString("id-ID")}
                      <span className="text-lg font-medium text-white/80 ml-1">item</span>
                    </p>
                  )}
                </div>

                {!loadingCount && summary.by_place?.length > 0 && (
                  <div className="flex flex-col gap-1.5 text-right">
                    {summary.by_place.map((p) => (
                      <div key={p.kode} className="text-[11px] text-white/90">
                        <span className="font-bold">{p.count.toLocaleString("id-ID")}</span>
                        <span className="text-white/70 ml-1">{p.kode}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {!loadingCount && summary.total_items === 0 && (
                <div className="relative mt-3 pt-3 border-t border-white/20 flex items-center gap-2 text-[11px] text-white/90">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Tidak ada inventory di tempat yang dipilih</span>
                </div>
              )}
            </div>
          )}

          {/* Info Card */}
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 flex gap-2.5">
            <div className="flex-shrink-0 p-1.5 bg-blue-100 rounded-lg h-fit">
              <AlertCircle className="w-3.5 h-3.5 text-blue-600" />
            </div>
            <div className="text-[11px] text-blue-900/80 leading-relaxed">
              <p className="font-semibold mb-0.5 text-blue-900">Cara Kerja:</p>
              <p>
                Stok opname akan otomatis dibuat untuk <strong>semua inventory</strong> di tempat yang Anda pilih.
                Selanjutnya, Anda hanya perlu mengisi stok fisik di halaman detail opname.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex gap-2.5 flex-shrink-0 bg-white/95 backdrop-blur-sm">
          <button
            type="button"
            onClick={closeAllModals}
            className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors disabled:opacity-50"
            disabled={isSubmitting}
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || selectedPlaces.size === 0 || summary.total_items === 0}
            className="flex-[2] px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/30 active:scale-[0.98]"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Membuat Opname...</>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Buat Opname</span>
                {summary.total_items > 0 && !loadingCount && (
                  <span className="px-2 py-0.5 bg-white/20 rounded-full text-[11px]">
                    {summary.total_items.toLocaleString("id-ID")}
                  </span>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StokOpnameForm;