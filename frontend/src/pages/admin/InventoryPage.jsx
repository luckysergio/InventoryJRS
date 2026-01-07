import { useEffect, useState, useMemo } from "react";
import Swal from "sweetalert2";
import api from "../../services/api";

const formatProductName = (p) => {
  if (!p) return "-";
  const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean);
  return parts.join(" ");
};

const InventoryPage = () => {
  const [allInventories, setAllInventories] = useState([]);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modal, setModal] = useState(null);
  const [selectedInventory, setSelectedInventory] = useState(null);

  const [form, setForm] = useState({
    qty: 1,
    to_place_id: "",
    keterangan: "",
  });

  const [selectedJenisId, setSelectedJenisId] = useState("");
  const [selectedTypeId, setSelectedTypeId] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const invRes = await api.get("/inventories");
      const placeRes = await api.get("/places");

      setAllInventories(invRes.data.data);
      setPlaces(placeRes.data.data);
    } catch {
      Swal.fire("Error", "Gagal mengambil data inventory", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ✅ Group inventory per produk
  const produkWithInventori = useMemo(() => {
    const productMap = new Map();

    allInventories.forEach((inv) => {
      if (!inv.product || !inv.place) return;

      const productId = inv.product.id;
      if (!productMap.has(productId)) {
        productMap.set(productId, {
          product: inv.product,
          inventories: [],
        });
      }

      productMap.get(productId).inventories.push(inv);
    });

    return Array.from(productMap.values());
  }, [allInventories]);

  const placeToko = useMemo(() => places.find(p => p.kode === 'TOKO'), [places]);
  const placeBengkel = useMemo(() => places.find(p => p.kode === 'BENGKEL'), [places]);

  const produkLengkap = useMemo(() => {
    return produkWithInventori.map(item => {
      const inventoriToko = item.inventories.find(inv => inv.place_id === placeToko?.id);
      const inventoriBengkel = item.inventories.find(inv => inv.place_id === placeBengkel?.id);

      return {
        ...item,
        stok_toko: inventoriToko?.qty || 0,
        stok_bengkel: inventoriBengkel?.qty || 0,
        inv_toko: inventoriToko,
        inv_bengkel: inventoriBengkel,
      };
    });
  }, [produkWithInventori, placeToko, placeBengkel]);

  const { jenisList, typeList } = useMemo(() => {
    const jenisMap = new Map();
    const typeMap = new Map();

    produkLengkap.forEach((item) => {
      const product = item.product;
      if (!product) return;

      if (product.jenis?.id) {
        jenisMap.set(product.jenis.id, product.jenis);
      }

      if (product.type?.id) {
        if (!selectedJenisId || product.jenis?.id === Number(selectedJenisId)) {
          typeMap.set(product.type.id, product.type);
        }
      }
    });

    return {
      jenisList: Array.from(jenisMap.values()).sort((a, b) => a.nama.localeCompare(b.nama)),
      typeList: Array.from(typeMap.values()).sort((a, b) => a.nama.localeCompare(b.nama)),
    };
  }, [produkLengkap, selectedJenisId]);

  const filteredProducts = useMemo(() => {
    let result = [...produkLengkap];

    if (selectedJenisId) {
      result = result.filter(item => 
        item.product?.jenis?.id === Number(selectedJenisId)
      );
    }

    if (selectedTypeId) {
      result = result.filter(item => 
        item.product?.type?.id === Number(selectedTypeId)
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => {
        const product = item.product;
        if (!product) return false;
        return (
          product.kode?.toLowerCase().includes(term) ||
          formatProductName(product).toLowerCase().includes(term)
        );
      });
    }

    return result;
  }, [produkLengkap, selectedJenisId, selectedTypeId, searchTerm]);

  const openModal = (type, inventory) => {
    if (!inventory) {
      Swal.fire("Error", "Inventory tidak ditemukan", "error");
      return;
    }
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
    <div className="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-800">Inventory</h1>

      {/* FILTERS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 bg-white p-4 rounded-xl shadow-sm">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Jenis</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedJenisId}
            onChange={(e) => {
              setSelectedJenisId(e.target.value);
              setSelectedTypeId("");
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            value={selectedTypeId}
            onChange={(e) => setSelectedTypeId(e.target.value)}
            disabled={!selectedJenisId}
          >
            <option value="">Semua Type</option>
            {typeList.map((t) => (
              <option key={t.id} value={t.id}>
                {t.nama}
              </option>
            ))}
          </select>
        </div>

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
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">Tidak ada inventory ditemukan.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((item) => (
            <div
              key={item.product.id}
              className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition p-4"
            >
              {/* Info Produk */}
              <div className="text-center mb-3">
                <p className="text-sm text-gray-500 font-medium">{item.product.kode}</p>
                <p className="font-medium text-gray-800 mt-1 text-sm min-h-[40px]">
                  {formatProductName(item.product)}
                </p>
              </div>

              {/* === TOKO === */}
              <div className="border border-green-200 rounded-lg p-3 mb-4 bg-green-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-green-800">TOKO</span>
                    <p className="font-bold text-lg text-green-700 mt-1">{item.stok_toko}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal("in", item.inv_toko)}
                      className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition"
                    >
                      IN
                    </button>
                    <button
                      onClick={() => openModal("out", item.inv_toko)}
                      className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
                    >
                      OUT
                    </button>
                    <button
                      onClick={() => openModal("transfer", item.inv_toko)}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition"
                    >
                      TF
                    </button>
                  </div>
                </div>
              </div>

              {/* === BENGKEL === */}
              <div className="border border-blue-200 rounded-lg p-3 bg-blue-50">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-xs font-medium text-blue-800">BENGKEL</span>
                    <p className="font-bold text-lg text-blue-700 mt-1">{item.stok_bengkel}</p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => openModal("in", item.inv_bengkel)}
                      className="text-[10px] bg-green-100 hover:bg-green-200 text-green-700 px-2 py-1 rounded transition"
                    >
                      IN
                    </button>
                    <button
                      onClick={() => openModal("out", item.inv_bengkel)}
                      className="text-[10px] bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded transition"
                    >
                      OUT
                    </button>
                    <button
                      onClick={() => openModal("transfer", item.inv_bengkel)}
                      className="text-[10px] bg-purple-100 hover:bg-purple-200 text-purple-700 px-2 py-1 rounded transition"
                    >
                      TF
                    </button>
                  </div>
                </div>
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