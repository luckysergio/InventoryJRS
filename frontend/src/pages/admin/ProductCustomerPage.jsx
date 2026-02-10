import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Image as ImageIcon,
  X,
  Camera,
  Tag,
  User,
  Building2,
} from "lucide-react";
import api from "../../services/api";

const safeParseFloat = (value) => {
  if (value == null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const formatRupiah = (value) => {
  const num = safeParseFloat(value);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num);
};

const unformatRupiah = (str) => {
  if (!str) return 0;
  return parseInt(String(str).replace(/\D/g, ""), 10) || 0;
};

export const ProductCustomerFilterBar = ({
  search,
  setSearch,
  filterCustomer,
  setFilterCustomer,
  customers,
}) => (
  <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari kode produk..."
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>
    <div className="flex-1 min-w-[200px]">
      <select
        className="w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
        value={filterCustomer}
        onChange={(e) => setFilterCustomer(e.target.value)}
      >
        <option value="">Semua Customer</option>
        {customers.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name} ({c.phone})
          </option>
        ))}
      </select>
    </div>
    <button
      onClick={() => {
        setSearch("");
        setFilterCustomer("");
      }}
      className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm whitespace-nowrap font-medium"
    >
      Reset Filter
    </button>
  </div>
);

const ProductCustomerPage = ({ setNavbarContent }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterCustomer, setFilterCustomer] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [customers, setCustomers] = useState([]);
  const [jenis, setJenis] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [bahan, setBahan] = useState([]);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  // Form state
  const [form, setForm] = useState({
    customer_id: "",
    jenis_id: "",
    type_id: "",
    bahan_id: "",
    ukuran: "",
    keterangan: "",
    harga: "",
  });
  const [fotoDepan, setFotoDepan] = useState(null);
  const [fotoSamping, setFotoSamping] = useState(null);
  const [fotoAtas, setFotoAtas] = useState(null);
  const [jenisInputBaru, setJenisInputBaru] = useState("");
  const [typeInputBaru, setTypeInputBaru] = useState("");
  const [bahanInputBaru, setBahanInputBaru] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [fotoModal, setFotoModal] = useState(null);

  // Refs for file inputs
  const cameraInputDepan = useRef(null);
  const cameraInputSamping = useRef(null);
  const cameraInputAtas = useRef(null);
  const fileInputDepan = useRef(null);
  const fileInputSamping = useRef(null);
  const fileInputAtas = useRef(null);

  // Fetch master data
  const fetchMasterData = async () => {
    try {
      const [cRes, jRes, tRes, bRes] = await Promise.all([
        api.get("/customers"),
        api.get("/jenis"),
        api.get("/type"),
        api.get("/bahan"),
      ]);
      setCustomers(cRes.data.data);
      setJenis(jRes.data.data);
      setAllTypes(tRes.data.data);
      setBahan(bRes.data.data);
    } catch (error) {
      console.error("Error fetching master data:", error);
    }
  };

  // Fetch products
  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.get("/product-customers", {
        params: {
          ...params,
          page: currentPage,
          customer_id: filterCustomer || undefined,
          search: search || undefined,
        },
      });
      setProducts(res.data.data);
      setLastPage(res.data.meta?.last_page || 1);
    } catch (error) {
      Swal.fire("Error", "Gagal mengambil data produk customer", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMasterData();
  }, []);

  useEffect(() => {
    fetchData();
  }, [search, filterCustomer, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterCustomer]);

  // Filter types based on selected jenis
  useEffect(() => {
    if (!form.jenis_id || form.jenis_id === "new" || allTypes.length === 0) {
      setFilteredTypes([]);
      if (!isEdit) {
        setForm((prev) => ({ ...prev, type_id: "" }));
      }
      return;
    }
    const filtered = allTypes.filter(
      (t) => String(t.jenis_id) === String(form.jenis_id),
    );
    setFilteredTypes(filtered);
    if (!isEdit) {
      setForm((prev) => ({ ...prev, type_id: "" }));
    }
  }, [form.jenis_id, allTypes, isEdit]);

  // Set navbar content with filter bar
  useEffect(() => {
    setNavbarContent(
      <ProductCustomerFilterBar
        search={search}
        setSearch={setSearch}
        filterCustomer={filterCustomer}
        setFilterCustomer={setFilterCustomer}
        customers={customers}
      />,
    );
  }, [search, filterCustomer, customers, setNavbarContent]);

  const handleTambah = () => {
    setForm({
      customer_id: "",
      jenis_id: "",
      type_id: "",
      bahan_id: "",
      ukuran: "",
      keterangan: "",
      harga: "",
    });
    setFotoDepan(null);
    setFotoSamping(null);
    setFotoAtas(null);
    setJenisInputBaru("");
    setTypeInputBaru("");
    setBahanInputBaru("");
    setIsEdit(false);
    setSelectedId(null);
    setIsModalOpen(true);
  };

  const handleEdit = (item) => {
    if (loading) {
      Swal.fire("Tunggu...", "Data sedang dimuat", "info");
      return;
    }
    setForm({
      customer_id: item.customer_id,
      jenis_id: item.jenis_id,
      type_id: item.type_id || "",
      bahan_id: item.bahan_id || "",
      ukuran: item.ukuran,
      keterangan: item.keterangan || "",
      harga: formatRupiah(
        item.harga_customer || item.harga_products?.[0]?.harga || 0,
      ),
    });
    setFotoDepan(
      item.foto_depan
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`
        : null,
    );
    setFotoSamping(
      item.foto_samping
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`
        : null,
    );
    setFotoAtas(
      item.foto_atas
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`
        : null,
    );
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Produk Customer?",
      text: "Data akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    });
    if (confirm.isConfirmed) {
      try {
        await api.delete(`/product-customers/${id}`);
        Swal.fire("Berhasil", "Produk customer dihapus", "success");
        fetchData();
      } catch (error) {
        Swal.fire(
          "Error",
          error.response?.data?.message || "Gagal menghapus produk",
          "error",
        );
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validasi untuk create
    if (!isEdit) {
      if (!form.customer_id) {
        Swal.fire("Validasi", "Customer wajib dipilih", "warning");
        return;
      }
      if (!form.ukuran) {
        Swal.fire("Validasi", "Ukuran wajib diisi", "warning");
        return;
      }
    }

    const hargaNum = unformatRupiah(form.harga);
    if (hargaNum === 0) {
      const confirm = await Swal.fire({
        title: "Harga Rp0?",
        text: "Apakah Anda yakin ingin menyimpan harga Rp0?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        cancelButtonButtonText: "Batal",
      });
      if (!confirm.isConfirmed) return;
    }

    // Get names for preview
    const customer = customers.find(
      (c) => String(c.id) === String(form.customer_id),
    );
    const jenisNama =
      form.jenis_id === "new"
        ? jenisInputBaru
        : jenis.find((j) => String(j.id) === String(form.jenis_id))?.nama || "";
    const typeNama =
      form.type_id === "new"
        ? typeInputBaru
        : allTypes.find((t) => String(t.id) === String(form.type_id))?.nama ||
          "";
    const bahanNama =
      form.bahan_id === "new"
        ? bahanInputBaru
        : bahan.find((b) => String(b.id) === String(form.bahan_id))?.nama || "";

    const dataPreview = `
      <div style="text-align: left; font-size: 14px; line-height: 1.5;">
        ${!isEdit ? `<strong>Customer:</strong> ${customer?.name || "-"}<br/>` : ""}
        <strong>Kode:</strong> ${isEdit ? "Tidak berubah (tetap)" : "Akan digenerate otomatis"}<br/>
        <strong>Jenis:</strong> ${jenisNama || "-"}<br/>
        <strong>Tipe:</strong> ${typeNama || "-"}<br/>
        <strong>Bahan:</strong> ${bahanNama || "-"}<br/>
        <strong>Ukuran:</strong> ${form.ukuran || "-"}<br/>
        <strong>Harga:</strong> ${formatRupiah(hargaNum)}<br/>
        ${form.keterangan ? `<strong>Keterangan:</strong> ${form.keterangan}<br/>` : ""}
        <strong>Foto Depan:</strong> ${fotoDepan ? "✅ Terupload" : "❌ Tidak ada"}<br/>
        <strong>Foto Samping:</strong> ${fotoSamping ? "✅ Terupload" : "❌ Tidak ada"}<br/>
        <strong>Foto Atas:</strong> ${fotoAtas ? "✅ Terupload" : "❌ Tidak ada"}
      </div>`;

    const action = isEdit ? "memperbarui" : "menambah";
    const result = await Swal.fire({
      title: `Konfirmasi ${isEdit ? "Perubahan" : "Penambahan"} Produk Customer`,
      html: dataPreview,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: `Ya, ${action}`,
      cancelButtonText: "Batal",
      reverseButtons: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: isEdit ? "Memperbarui produk..." : "Menyimpan produk...",
        html: "Mohon tunggu, sedang memproses data.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const formData = new FormData();

      // Untuk CREATE
      if (!isEdit) {
        formData.append("customer_id", form.customer_id);
        if (form.jenis_id && form.jenis_id !== "new") {
          formData.append("jenis_id", form.jenis_id);
        } else if (form.jenis_id === "new" && jenisInputBaru.trim()) {
          formData.append("jenis_nama", jenisInputBaru.trim().toUpperCase());
        }

        if (form.type_id && form.type_id !== "new") {
          formData.append("type_id", form.type_id);
        } else if (form.type_id === "new" && typeInputBaru.trim()) {
          formData.append("type_nama", typeInputBaru.trim().toUpperCase());
        }

        if (form.bahan_id && form.bahan_id !== "new") {
          formData.append("bahan_id", form.bahan_id);
        } else if (form.bahan_id === "new" && bahanInputBaru.trim()) {
          formData.append("bahan_nama", bahanInputBaru.trim().toUpperCase());
        }
      }

      // Fields yang selalu dikirim (create & update)
      formData.append("ukuran", form.ukuran);
      formData.append("harga", hargaNum.toString());
      if (form.keterangan) formData.append("keterangan", form.keterangan);

      // Upload foto jika ada file baru
      if (fotoDepan instanceof File) formData.append("foto_depan", fotoDepan);
      if (fotoSamping instanceof File)
        formData.append("foto_samping", fotoSamping);
      if (fotoAtas instanceof File) formData.append("foto_atas", fotoAtas);

      let response;
      if (isEdit) {
        response = await api.post(
          `/product-customers/${selectedId}?_method=PUT`,
          formData,
        );
      } else {
        response = await api.post("/product-customers", formData);
      }

      Swal.close();
      Swal.fire(
        "Berhasil",
        isEdit
          ? "Produk customer berhasil diperbarui"
          : "Produk customer berhasil ditambahkan",
        "success",
      );

      setIsModalOpen(false);
      setCurrentPage(1);
      fetchData();
    } catch (error) {
      Swal.close();
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire(
          "Error",
          error.response?.data?.message ||
            "Terjadi kesalahan saat menyimpan data",
          "error",
        );
      }
    }
  };

  const handleFileChange = (e, setFile) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire("Error", "Ukuran file maksimal 5MB", "error");
        return;
      }
      if (!["image/jpeg", "image/jpg", "image/png"].includes(file.type)) {
        Swal.fire("Error", "Hanya file JPG/PNG yang diizinkan", "error");
        return;
      }
      setFile(file);
    }
  };

  const handleRemoveFoto = (setFile) => setFile(null);
  const openFotoModal = (fotoUrl) => setFotoModal(fotoUrl);
  const closeFotoModal = () => setFotoModal(null);

  const handleHargaChange = (value) => {
    const clean = value.replace(/\D/g, "");
    const num = clean === "" ? 0 : parseInt(clean, 10);
    setForm((prev) => ({ ...prev, harga: formatRupiah(num) }));
  };

  const renderPagination = () => {
    const pages = [];
    const startPage = Math.max(1, currentPage - 1);
    const endPage = Math.min(lastPage, currentPage + 1);
    for (let i = startPage; i <= endPage; i++) pages.push(i);

    return (
      <div className="flex items-center justify-center gap-1 mt-6">
        <button
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {"<"}
        </button>
        {startPage > 1 && (
          <>
            <button
              onClick={() => setCurrentPage(1)}
              className="px-3 py-1 rounded border"
            >
              1
            </button>
            {startPage > 2 && <span className="px-2">...</span>}
          </>
        )}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => setCurrentPage(page)}
            className={`px-3 py-1 rounded border ${
              page === currentPage
                ? "bg-indigo-600 text-white"
                : "bg-white text-gray-700"
            }`}
          >
            {page}
          </button>
        ))}
        {endPage < lastPage && (
          <>
            {endPage < lastPage - 1 && <span className="px-2">...</span>}
            <button
              onClick={() => setCurrentPage(lastPage)}
              className="px-3 py-1 rounded border"
            >
              {lastPage}
            </button>
          </>
        )}
        <button
          onClick={() => setCurrentPage((p) => Math.min(lastPage, p + 1))}
          disabled={currentPage === lastPage}
          className="px-3 py-1 rounded border disabled:opacity-50"
        >
          {">"}
        </button>
      </div>
    );
  };

  const renderFotoPreview = (
    foto,
    setFoto,
    label,
    fileInputRef,
    cameraInputRef,
  ) => (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-gray-600 text-center">
        {label}
      </label>
      <div className="flex flex-col items-center gap-1.5">
        {foto ? (
          <div className="relative">
            <img
              src={foto instanceof File ? URL.createObjectURL(foto) : foto}
              alt={label}
              className="w-12 h-12 object-cover rounded border"
            />
            <button
              type="button"
              onClick={() => handleRemoveFoto(setFoto)}
              className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px]"
            >
              ×
            </button>
          </div>
        ) : (
          <div className="w-12 h-12 border border-dashed border-gray-300 rounded flex items-center justify-center">
            <ImageIcon size={14} className="text-gray-400" />
          </div>
        )}
        <div className="flex flex-col items-center gap-1">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="text-[10px] text-indigo-600 hover:text-indigo-800"
          >
            Galeri
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="text-[10px] text-green-600 hover:text-green-800 flex items-center gap-0.5"
          >
            <Camera size={10} /> Kamera
          </button>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={(e) => handleFileChange(e, setFoto)}
        className="hidden"
      />
      <input
        type="file"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileChange(e, setFoto)}
        className="hidden"
      />
    </div>
  );

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(
      (part) => part != null && part !== "",
    );
    return parts.length > 0 ? parts.join(" ") : "-";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada Produk Customer ditemukan
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {products.map((item) => {
              const hargaCustomer =
                item.harga_customer || item.harga_products?.[0]?.harga || 0;
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col h-full"
                >
                  {/* Foto Produk */}
                  <div className="flex justify-center gap-2 mb-3">
                    {item.foto_depan && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`}
                        alt="Foto Depan"
                        className="w-14 h-14 object-cover rounded cursor-pointer border hover:shadow transition"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`,
                          )
                        }
                      />
                    )}
                    {item.foto_samping && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`}
                        alt="Foto Samping"
                        className="w-14 h-14 object-cover rounded cursor-pointer border hover:shadow transition"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`,
                          )
                        }
                      />
                    )}
                    {item.foto_atas && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`}
                        alt="Foto Atas"
                        className="w-14 h-14 object-cover rounded cursor-pointer border hover:shadow transition"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`,
                          )
                        }
                      />
                    )}
                    {!item.foto_depan &&
                      !item.foto_samping &&
                      !item.foto_atas && (
                        <div className="w-14 h-14 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={20} />
                        </div>
                      )}
                  </div>

                  {/* Kode Produk */}
                  <div className="text-center mb-1">
                    <p className="font-mono font-semibold text-xs text-indigo-700 break-words whitespace-normal leading-snug">
                      {item.kode}
                    </p>
                  </div>

                  {/* Customer */}
                  <div className="text-center mb-2 flex items-center justify-center gap-1 text-xs text-blue-600 bg-blue-50 py-1 px-2 rounded">
                    <User size={12} className="flex-shrink-0" />
                    <span className="truncate max-w-[120px]">
                      {item.customer?.name || "—"}
                    </span>
                  </div>

                  {/* Nama Produk */}
                  <div className="text-center mb-2 min-h-[32px]">
                    <p className="text-xs text-gray-600 leading-tight">
                      {formatProductName(item)}
                    </p>
                  </div>

                  {/* Harga Customer */}
                  <div className="text-center mb-3 flex items-center justify-center gap-1 text-sm">
                    <Tag size={14} className="text-amber-600 flex-shrink-0" />
                    <span className="font-bold text-amber-700 truncate">
                      {formatRupiah(hargaCustomer)}
                    </span>
                  </div>

                  {/* Keterangan */}
                  {item.keterangan && (
                    <div className="text-center mb-3 flex-1">
                      <p className="text-xs italic text-gray-500 line-clamp-2">
                        "{item.keterangan}"
                      </p>
                    </div>
                  )}

                  {/* Aksi */}
                  <div className="flex gap-2 pt-2 mt-auto">
                    {(role === "admin" || role === "admin_toko") && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-xs font-medium transition-colors duration-200"
                        title="Edit Produk"
                      >
                        <Pencil size={12} />
                      </button>
                    )}
                    {role === "admin" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200 text-xs font-medium transition-colors duration-200"
                        title="Hapus Produk"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {lastPage > 1 && renderPagination()}
        </>
      )}

      {/* Tombol Tambah - hanya untuk admin & admin_toko */}
      {(role === "admin" || role === "admin_toko") && (
        <button
          onClick={handleTambah}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
          title="Tambah Produk Customer"
        >
          <Plus size={18} />
        </button>
      )}

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 text-center">
                {isEdit ? "Edit Produk Customer" : "Tambah Produk Customer"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              {!isEdit && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <select
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={form.customer_id}
                    onChange={(e) =>
                      setForm({ ...form, customer_id: e.target.value })
                    }
                    required
                    disabled={isEdit}
                  >
                    <option value="">Pilih Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} - {c.phone}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Customer <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.harga}
                  onChange={(e) => handleHargaChange(e.target.value)}
                  placeholder="Rp0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Jenis <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.jenis_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, jenis_id: val });
                    if (val !== "new") setJenisInputBaru("");
                  }}
                  required
                >
                  <option value="">Pilih Jenis</option>
                  {jenis.map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.nama}
                    </option>
                  ))}
                  <option value="new">➕ Tambah Jenis Baru</option>
                </select>
                {form.jenis_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama jenis baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={jenisInputBaru}
                    onChange={(e) => setJenisInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipe
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.type_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, type_id: val });
                    if (val !== "new") setTypeInputBaru("");
                  }}
                >
                  <option value="">Pilih Tipe</option>
                  {form.jenis_id &&
                    form.jenis_id !== "new" &&
                    filteredTypes.length > 0 &&
                    filteredTypes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.nama}
                      </option>
                    ))}
                  <option value="new">➕ Tambah Tipe Baru</option>
                </select>
                {form.type_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama tipe baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={typeInputBaru}
                    onChange={(e) => setTypeInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bahan
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.bahan_id}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm({ ...form, bahan_id: val });
                    if (val !== "new") setBahanInputBaru("");
                  }}
                >
                  <option value="">Pilih Bahan</option>
                  {bahan.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama}
                    </option>
                  ))}
                  <option value="new">➕ Tambah Bahan Baru</option>
                </select>
                {form.bahan_id === "new" && (
                  <input
                    type="text"
                    placeholder="Nama bahan baru"
                    className="w-full mt-2 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                    value={bahanInputBaru}
                    onChange={(e) => setBahanInputBaru(e.target.value)}
                    required
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ukuran <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.ukuran}
                  onChange={(e) => setForm({ ...form, ukuran: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                {renderFotoPreview(
                  fotoDepan,
                  setFotoDepan,
                  "Depan",
                  fileInputDepan,
                  cameraInputDepan,
                )}
                {renderFotoPreview(
                  fotoSamping,
                  setFotoSamping,
                  "Samping",
                  fileInputSamping,
                  cameraInputSamping,
                )}
                {renderFotoPreview(
                  fotoAtas,
                  setFotoAtas,
                  "Atas",
                  fileInputAtas,
                  cameraInputAtas,
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Keterangan
                </label>
                <textarea
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  rows={2}
                  value={form.keterangan}
                  onChange={(e) =>
                    setForm({ ...form, keterangan: e.target.value })
                  }
                />
              </div>

              <div className="flex justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition disabled:opacity-70 disabled:cursor-not-allowed"
                  disabled={loading}
                >
                  {isEdit ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Foto Preview */}
      {fotoModal && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={closeFotoModal}
        >
          <div className="relative">
            <img
              src={fotoModal}
              alt="Foto Produk"
              className="max-w-full max-h-[90vh] object-contain rounded"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeFotoModal();
              }}
              className="absolute -top-12 right-0 bg-white rounded-full p-2 shadow-lg"
            >
              <X size={20} className="text-gray-700" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductCustomerPage;
