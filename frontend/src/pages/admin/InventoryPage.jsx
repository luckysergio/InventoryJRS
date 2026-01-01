import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.ukuran].filter(Boolean).join(" | ");
};

const InventoryPage = () => {
  const [inventories, setInventories] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const [form, setForm] = useState({
    qty: 1,
    to_place_id: "",
    keterangan: "",
  });

  // === Filter & Search State ===
  const [selectedPlaceId, setSelectedPlaceId] = useState("");
  const [selectedJenisId, setSelectedJenisId] = useState(""); // ✅ Baru
  const [selectedTypeId, setSelectedTypeId] = useState(""); // ✅ Baru
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const inv = await api.get("/inventories");
      const pl = await api.get("/places");

      setInventories(inv.data.data);
      setPlaces(pl.data.data);
    } catch {
      Swal.fire("Error", "Gagal mengambil data inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // === Kumpulkan daftar unik Jenis & Type dari inventories ===
  const { jenisList, typeList } = useMemo(() => {
    const jenisMap = new Map();
    const typeMap = new Map();

    inventories.forEach((inv) => {
      const product = inv.product;
      if (!product) return;

      if (product.jenis?.id) {
        jenisMap.set(product.jenis.id, product.jenis);
      }

      if (product.type?.id) {
        // Hanya tampilkan type yang sesuai dengan jenis yang dipilih (jika ada)
        if (!selectedJenisId || product.jenis?.id === Number(selectedJenisId)) {
          typeMap.set(product.type.id, product.type);
        }
      }
    });

    return {
      jenisList: Array.from(jenisMap.values()).sort((a, b) => a.nama.localeCompare(b.nama)),
      typeList: Array.from(typeMap.values()).sort((a, b) => a.nama.localeCompare(b.nama)),
    };
  }, [inventories, selectedJenisId]);

  // === FILTERED INVENTORIES ===
  const filteredInventories = useMemo(() => {
    let result = [...inventories];

    // Filter by place
    if (selectedPlaceId) {
      result = result.filter((inv) => inv.place_id === Number(selectedPlaceId));
    }

    // Filter by jenis
    if (selectedJenisId) {
      result = result.filter((inv) => inv.product?.jenis?.id === Number(selectedJenisId));
    }

    // Filter by type
    if (selectedTypeId) {
      result = result.filter((inv) => inv.product?.type?.id === Number(selectedTypeId));
    }

    // Search by product kode or formatted name
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((inv) => {
        const product = inv.product;
        if (!product) return false;
        const kodeMatch = product.kode?.toLowerCase().includes(term);
        const nameMatch = formatProductName(product)
          .toLowerCase()
          .includes(term);
        return kodeMatch || nameMatch;
      });
    }

    return result;
  }, [inventories, selectedPlaceId, selectedJenisId, selectedTypeId, searchTerm]);

  const openModal = (type, inventory) => {
    setSelectedInventory(inventory);
    setModal(type);
    setForm({ qty: 1, to_place_id: "", keterangan: "" });
  };

  const closeModal = () => {
    setModal(null);
    setSelectedInventory(null);
  };

  const submitMovement = async () => {
    try {
      if (!selectedInventory) return;

      if (modal === "transfer" && !form.to_place_id) {
        Swal.fire("Peringatan", "Pilih tempat tujuan", "warning");
        return;
      }

      const payload = {
        inventory_id: selectedInventory.id,
        tipe: modal,
        qty: Number(form.qty),
        keterangan: form.keterangan,
      };

      if (modal === "transfer") {
        payload.to_place_id = Number(form.to_place_id);
      }

      await api.post("/product-movements", payload);

      Swal.fire("Berhasil", "Stok berhasil diperbarui", "success");
      closeModal();
      fetchData();
    } catch (err) {
      Swal.fire(
        "Error",
        err.response?.data?.message || "Terjadi kesalahan",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-purple-600 border-t-transparent"></div>
        <p className="mt-4 text-gray-600">Memuat data inventory...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800">Inventory</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Tempat */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tempat</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedPlaceId}
            onChange={(e) => setSelectedPlaceId(e.target.value)}
          >
            <option value="">Semua Tempat</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Jenis */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedJenisId}
            onChange={(e) => {
              setSelectedJenisId(e.target.value);
              setSelectedTypeId(""); // Reset type saat jenis berubah
            }}
          >
            <option value="">Semua Jenis</option>
            {jenisList.map((j) => (
              <option key={j.id} value={j.id}>
                {j.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={!selectedJenisId} // Hanya aktif jika jenis dipilih
          >
            <option value="">Semua Type</option>
            {typeList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </div>

        {/* Pencarian */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Kode Product</label>
          <input
            type="text"
            placeholder="Cari produk..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* CARD LIST */}
      {filteredInventories.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Tidak ada inventory ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInventories.map((inv) => (
            <div
              key={inv.id}
              className="bg-white p-6 rounded-2xl shadow border border-gray-200 space-y-4"
            >
              <div className="text-center">
                <p className="text-sm text-gray-500">Kode: {inv.product?.kode || "–"}</p>
                <p className="font-semibold text-gray-800 mt-1 text-base">
                  {formatProductName(inv.product)}
                </p>
                <p className="text-sm text-gray-600 mt-1">Tempat: {inv.place?.nama || "–"}</p>
                <p className="text-2xl font-bold text-purple-700 mt-2">{inv.qty}</p>
                <p className="text-xs text-gray-500">Stok Tersedia</p>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2">
                <button
                  onClick={() => openModal("in", inv)}
                  className="bg-green-100 hover:bg-green-200 text-green-700 rounded-lg py-2 text-xs font-medium transition"
                >
                  + IN
                </button>
                <button
                  onClick={() => openModal("out", inv)}
                  className="bg-red-100 hover:bg-red-200 text-red-700 rounded-lg py-2 text-xs font-medium transition"
                >
                  - OUT
                </button>
                <button
                  onClick={() => openModal("transfer", inv)}
                  className="bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg py-2 text-xs font-medium transition"
                >
                  TRANSFER
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {modal === "in"
                ? "Stok Masuk"
                : modal === "out"
                ? "Stok Keluar"
                : "Transfer Stok"}
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Jumlah</label>
                <input
                  type="number"
                  min="1"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={form.qty}
                  onChange={(e) => setForm({ ...form, qty: e.target.value })}
                />
              </div>

              {modal === "transfer" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tujuan Transfer
                  </label>
                  <select
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    value={form.to_place_id}
                    onChange={(e) => setForm({ ...form, to_place_id: e.target.value })}
                  >
                    <option value="">Pilih Tempat Tujuan</option>
                    {places
                      .filter((p) => p.id !== selectedInventory?.place_id)
                      .map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nama}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keterangan</label>
                <textarea
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                  value={form.keterangan}
                  onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={closeModal}
                  type="button"
                  className="px-4 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition"
                >
                  Batal
                </button>
                <button
                  onClick={submitMovement}
                  type="button"
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;