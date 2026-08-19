import { useState, useEffect } from "react";
import { X, Plus, Minus, Repeat, Loader2, AlertCircle } from "lucide-react";
import { useInventoryModals } from "../../../lib/zustand/inventoryStore";
import { useCreateProductMovement } from "../../../hooks/useInventory";
import { usePlacesDropdown } from "../../../hooks/useMasterData";
import { useConfirmDialog } from "../../../hooks/useConfirmDialog";
import { cn } from "../../../lib/utils";

const MOVEMENT_CONFIG = {
  in: { title: "Stok Masuk", icon: Plus, color: "bg-green-600 hover:bg-green-700", label: "Masuk" },
  out: { title: "Stok Keluar", icon: Minus, color: "bg-red-600 hover:bg-red-700", label: "Keluar" },
  transfer: { title: "Transfer Stok", icon: Repeat, color: "bg-indigo-600 hover:bg-indigo-700", label: "Transfer" },
};

const InventoryMovementModal = () => {
  const { modals, selectedInventory, movementType, closeAllModals } = useInventoryModals();
  const createMovementMut = useCreateProductMovement();
  const { success, info, warning } = useConfirmDialog();
  const { data: places = [] } = usePlacesDropdown();

  const [form, setForm] = useState({ qty: 1, to_place_id: "", keterangan: "" });
  const [errors, setErrors] = useState({});

  const isOpen = modals.movement && selectedInventory && movementType;
  const config = MOVEMENT_CONFIG[movementType] || MOVEMENT_CONFIG.in;
  const isSubmitting = createMovementMut.isPending;

  // ✅ FIX: useEffect untuk reset form (bukan useState sebagai side effect)
  useEffect(() => {
    if (isOpen) {
      setForm({ qty: 1, to_place_id: "", keterangan: "" });
      setErrors({});
    }
  }, [isOpen, selectedInventory?.id, movementType]);

  const validate = () => {
    const e = {};
    if (!form.qty || Number(form.qty) < 1) e.qty = "Jumlah minimal 1";
    if (movementType === "transfer" && !form.to_place_id) e.to_place_id = "Tempat tujuan wajib dipilih";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ✅ Pola IDENTIK dengan handleSubmit di ProductCustomerForm
  const handleSubmit = async () => {
    if (!validate()) return;

    const payload = {
      inventory_id: selectedInventory.id,
      tipe: movementType,
      qty: Number(form.qty),
      keterangan: form.keterangan || undefined,
    };

    if (movementType === "transfer") {
      payload.to_place_id = Number(form.to_place_id);
    }

    try {
      await createMovementMut.mutateAsync(payload);
      // ✅ Tutup modal DULU, lalu success (identik dengan ProductCustomerForm)
      closeAllModals();
      await success("Berhasil!", `Stok berhasil ${config.label.toLowerCase()}`);
    } catch (err) {
      const msg = err.response?.data?.message || "Terjadi kesalahan";
      if (msg.includes("tidak mencukupi")) {
        await warning("Stok Tidak Mencukupi", msg);
      } else {
        await info("Gagal", msg);
      }
    }
  };

  if (!isOpen) return null;

  const product = selectedInventory.product;
  const placeName = selectedInventory.place?.nama || "-";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-modalIn ring-1 ring-black/5">
        <div className={cn("px-6 py-4 border-b border-slate-200 flex items-center justify-between", config.color.replace('hover:', ''))}>
          <div className="flex items-center gap-3 text-white">
            <config.icon className="w-5 h-5" />
            <h2 className="text-lg font-semibold">{config.title}</h2>
          </div>
          <button onClick={closeAllModals} className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white" disabled={isSubmitting}><X className="w-5 h-5" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="font-mono font-bold text-sm text-indigo-700">{product?.kode || "-"}</p>
            <p className="text-xs text-slate-500 mt-1">
              {[product?.jenis?.nama, product?.type?.nama, product?.ukuran].filter(Boolean).join(" • ") || "-"}
            </p>
            <p className="text-[11px] text-slate-400 mt-2">📍 {placeName} • Stok saat ini: <strong>{selectedInventory.qty}</strong></p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Jumlah <span className="text-red-500">*</span></label>
            <input type="number" min="1" value={form.qty} onChange={(e) => { setForm({ ...form, qty: e.target.value }); if (errors.qty) setErrors({ ...errors, qty: undefined }); }} className={cn("w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm font-medium", errors.qty ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500")} disabled={isSubmitting} autoFocus />
            {errors.qty && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.qty}</p>}
          </div>

          {movementType === "transfer" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Tujuan Transfer <span className="text-red-500">*</span></label>
              <select value={form.to_place_id} onChange={(e) => { setForm({ ...form, to_place_id: e.target.value }); if (errors.to_place_id) setErrors({ ...errors, to_place_id: undefined }); }} className={cn("w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 text-sm bg-white", errors.to_place_id ? "border-red-300 focus:ring-red-500" : "border-slate-200 focus:ring-indigo-500")} disabled={isSubmitting}>
                <option value="">Pilih Tempat Tujuan</option>
                {places.filter((p) => String(p.value) !== String(selectedInventory.place_id)).map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              {errors.to_place_id && <p className="mt-1 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.to_place_id}</p>}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Keterangan</label>
            <textarea rows={2} value={form.keterangan} onChange={(e) => setForm({ ...form, keterangan: e.target.value })} className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none" placeholder="Opsional" disabled={isSubmitting} />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={closeAllModals} className="flex-1 px-4 py-2.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors" disabled={isSubmitting}>Batal</button>
            <button onClick={handleSubmit} disabled={isSubmitting} className={cn("flex-1 px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50", config.color)}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Memproses...</> : <><config.icon className="w-4 h-4" /> {config.label}</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryMovementModal;