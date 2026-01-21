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
  Warehouse,
  Truck,
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

const generateDistributorPrefix = (nama) => {
  if (!nama) return "";
  return nama
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .join("");
};

const extractInitials = (text, max = 2) => {
  if (!text) return "";
  return text
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase())
    .filter((char) => /[A-Z]/.test(char))
    .slice(0, max)
    .join("");
};

const extractNumbers = (text) => {
  if (!text) return "";
  const matches = text.match(/\d+/g);
  return matches ? matches.join("") : "";
};

const generateKode = (
  jenisNama,
  typeNama,
  bahanNama,
  ukuran,
  distributorNama
) => {
  const jenisKode = jenisNama ? jenisNama.charAt(0).toUpperCase() : "";
  let typeKode = "";
  if (typeNama) {
    const huruf = extractInitials(typeNama, 2);
    const angka = extractNumbers(typeNama);
    typeKode = huruf + angka;
  }
  const bahanKode = bahanNama ? extractInitials(bahanNama, 2) : "";
  const ukuranAngka = extractNumbers(ukuran);
  const baseKode = jenisKode + typeKode + bahanKode + ukuranAngka;

  const distributorPrefix = distributorNama
    ? generateDistributorPrefix(distributorNama)
    : "";

  return distributorPrefix ? `${distributorPrefix}-${baseKode}` : baseKode;
};

export const DistributorProductFilterBar = ({
  search,
  setSearch,
  filterJenis,
  setFilterJenis,
  filterType,
  setFilterType,
  jenis,
  filteredTypesForFilter,
}) => (
  <div className="flex items-center gap-2 w-full">
    <div className="relative flex-1 min-w-[150px]">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
      <input
        type="text"
        placeholder="Cari kode..."
        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
    </div>

    <div className="hidden sm:flex items-center gap-2">
      <select
        className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm min-w-[140px]"
        value={filterJenis}
        onChange={(e) => setFilterJenis(e.target.value)}
      >
        <option value="">Semua Jenis</option>
        {jenis.map((j) => (
          <option key={j.id} value={j.id}>
            {j.nama}
          </option>
        ))}
      </select>

      <select
        className="py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm min-w-[140px]"
        value={filterType}
        onChange={(e) => setFilterType(e.target.value)}
        disabled={!filterJenis}
      >
        <option value="">Semua Tipe</option>
        {filteredTypesForFilter.map((t) => (
          <option key={t.id} value={t.id}>
            {t.nama}
          </option>
        ))}
      </select>

      <button
        onClick={() => {
          setSearch("");
          setFilterJenis("");
          setFilterType("");
        }}
        className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm whitespace-nowrap font-medium"
      >
        Reset
      </button>
    </div>

    <button
      onClick={() => setSearch("")}
      className="sm:hidden py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm"
    >
      ⓧ
    </button>
  </div>
);

const DistributorProductPage = ({ setNavbarContent }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterJenis, setFilterJenis] = useState("");
  const [filterType, setFilterType] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const [form, setForm] = useState({
    jenis_id: "",
    type_id: "",
    bahan_id: "",
    ukuran: "",
    keterangan: "",
    distributor_id: "",
    harga_beli: "",
    harga_umum: "",
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

  const [jenis, setJenis] = useState([]);
  const [allTypes, setAllTypes] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [bahan, setBahan] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [filteredTypesForFilter, setFilteredTypesForFilter] = useState([]);

  const cameraInputDepan = useRef(null);
  const cameraInputSamping = useRef(null);
  const cameraInputAtas = useRef(null);
  const fileInputDepan = useRef(null);
  const fileInputSamping = useRef(null);
  const fileInputAtas = useRef(null);

  const fetchData = async (params = {}) => {
    try {
      setLoading(true);
      const res = await api.get("/product-distributors", {
        params: { ...params, page: currentPage },
      });
      setProducts(res.data.data);
      setLastPage(res.data.meta?.last_page || 1);

      const [jRes, tRes, bRes, dRes] = await Promise.all([
        api.get("/jenis"),
        api.get("/type"),
        api.get("/bahan"),
        api.get("/distributors"),
      ]);
      setJenis(jRes.data.data);
      setAllTypes(tRes.data.data);
      setBahan(bRes.data.data);
      setDistributors(dRes.data.distributors || []);
    } catch {
      Swal.fire("Error", "Gagal mengambil data", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData({ search, jenis_id: filterJenis, type_id: filterType });
  }, [search, filterJenis, filterType, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterJenis, filterType]);

  const prevFilterJenisRef = useRef(filterJenis);

  useEffect(() => {
    if (!filterJenis) {
      setFilteredTypesForFilter([]);
      setFilterType("");
      prevFilterJenisRef.current = filterJenis;
      return;
    }

    const filtered = allTypes.filter((t) => t.jenis_id === Number(filterJenis));
    setFilteredTypesForFilter(filtered);

    if (prevFilterJenisRef.current !== filterJenis) {
      setFilterType("");
      prevFilterJenisRef.current = filterJenis;
    }
  }, [filterJenis, allTypes]);

  useEffect(() => {
    if (allTypes.length === 0) return;

    if (!form.jenis_id || form.jenis_id === "new") {
      setFilteredTypes([]);
      if (!isEdit) {
        setForm((prev) => ({ ...prev, type_id: "" }));
      }
      return;
    }

    const filtered = allTypes.filter(
      (t) => t.jenis_id === Number(form.jenis_id)
    );
    setFilteredTypes(filtered);

    if (!isEdit) {
      setForm((prev) => ({ ...prev, type_id: "" }));
    }
  }, [form.jenis_id, allTypes, isEdit]);

  const getKodePreview = () => {
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

    const distributorNama =
      form.distributor_id && form.distributor_id !== "new"
        ? distributors.find((d) => String(d.id) === String(form.distributor_id))
            ?.nama || ""
        : "";

    return generateKode(
      jenisNama,
      typeNama,
      bahanNama,
      form.ukuran,
      distributorNama
    );
  };

  const handleTambah = () => {
    setForm({
      jenis_id: "",
      type_id: "",
      bahan_id: "",
      ukuran: "",
      keterangan: "",
      distributor_id: "",
      harga_beli: "",
      harga_umum: "",
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
      Swal.fire("Tunggu...", "Data master sedang dimuat", "info");
      return;
    }

    const hargaJual = item.harga_umum ? formatRupiah(item.harga_umum) : "";

    setForm({
      jenis_id: item.jenis_id,
      type_id: item.type_id || "",
      bahan_id: item.bahan_id || "",
      ukuran: item.ukuran,
      keterangan: item.keterangan || "",
      distributor_id: item.distributor_id,
      harga_beli: formatRupiah(item.harga_beli),
      harga_umum: hargaJual,
    });

    setFotoDepan(
      item.foto_depan
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_depan}`
        : null
    );
    setFotoSamping(
      item.foto_samping
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_samping}`
        : null
    );
    setFotoAtas(
      item.foto_atas
        ? `${import.meta.env.VITE_ASSET_URL}/storage/${item.foto_atas}`
        : null
    );

    setJenisInputBaru("");
    setTypeInputBaru("");
    setBahanInputBaru("");
    setSelectedId(item.id);
    setIsEdit(true);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const kodeToSubmit = getKodePreview();
    if (!kodeToSubmit || !form.ukuran || !form.distributor_id) {
      Swal.fire(
        "Validasi",
        "Kode, Ukuran, dan Distributor wajib diisi",
        "warning"
      );
      return;
    }

    const hargaBeliNum = unformatRupiah(form.harga_beli);
    const hargaNum = unformatRupiah(form.harga_umum);
    if (hargaNum === 0) {
      const confirm = await Swal.fire({
        title: "Harga Rp0?",
        text: "Apakah Anda yakin ingin menyimpan harga Rp0?",
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Ya, Simpan",
        cancelButtonText: "Batal",
      });
      if (!confirm.isConfirmed) return;
    }

    let jenisNama = "";
    if (form.jenis_id === "new") jenisNama = jenisInputBaru.trim();
    else {
      const j = jenis.find((j) => String(j.id) === String(form.jenis_id));
      jenisNama = j ? j.nama : "";
    }

    let typeName = "";
    if (form.type_id === "new") typeName = typeInputBaru.trim();
    else {
      const t = allTypes.find((t) => String(t.id) === String(form.type_id));
      typeName = t ? t.nama : "";
    }

    let bahanNama = "";
    if (form.bahan_id === "new") bahanNama = bahanInputBaru.trim();
    else {
      const b = bahan.find((b) => String(b.id) === String(form.bahan_id));
      bahanNama = b ? b.nama : "";
    }

    const distributor = distributors.find(
      (d) => String(d.id) === String(form.distributor_id)
    );
    const dataPreview = `
    <div style="text-align: center; font-size: 14px;">
      <strong>Kode:</strong> ${kodeToSubmit}<br/>
      <strong>Jenis:</strong> ${jenisNama || "-"}<br/>
      <strong>Tipe:</strong> ${typeName || "-"}<br/>
      <strong>Bahan:</strong> ${bahanNama || "-"}<br/>
      <strong>Ukuran:</strong> ${form.ukuran}<br/>
      <strong>Distributor:</strong> ${distributor?.nama || "-"}<br/>
      <strong>Harga Beli:</strong> ${formatRupiah(hargaBeliNum)}<br/>
      <strong>Harga Jual:</strong> ${formatRupiah(hargaNum)}<br/>
      ${
        form.keterangan
          ? `<strong>Keterangan:</strong> ${form.keterangan}<br/>`
          : ""
      }
      <strong>Foto Depan:</strong> ${
        fotoDepan ? "✅ Terupload" : "❌ Tidak ada"
      }<br/>
      <strong>Foto Samping:</strong> ${
        fotoSamping ? "✅ Terupload" : "❌ Tidak ada"
      }<br/>
      <strong>Foto Atas:</strong> ${fotoAtas ? "✅ Terupload" : "❌ Tidak ada"}
    </div>`;

    const action = isEdit ? "memperbarui" : "menambah";
    const result = await Swal.fire({
      title: `Konfirmasi ${
        isEdit ? "Perubahan" : "Penambahan"
      } Product Distributor`,
      html: dataPreview,
      icon: "info",
      showCancelButton: true,
      confirmButtonText: `Ya, ${action} product`,
      cancelButtonText: "Batal",
      reverseButtons: true,
      confirmButtonColor: "#3b82f6",
      cancelButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      Swal.fire({
        title: isEdit ? "Memperbarui product..." : "Menyimpan product...",
        html: "Mohon tunggu, sedang memproses data.",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => Swal.showLoading(),
      });

      const formData = new FormData();
      formData.append("kode", kodeToSubmit);
      formData.append("ukuran", form.ukuran);
      formData.append("distributor_id", form.distributor_id);
      formData.append("harga_umum", hargaNum);
      formData.append("harga_beli", hargaBeliNum);
      if (form.keterangan) formData.append("keterangan", form.keterangan);
      if (form.jenis_id && form.jenis_id !== "new")
        formData.append("jenis_id", form.jenis_id);
      if (form.jenis_id === "new")
        formData.append("jenis_nama", jenisInputBaru.trim());
      if (form.type_id && form.type_id !== "new")
        formData.append("type_id", form.type_id);
      if (form.type_id === "new")
        formData.append("type_nama", typeInputBaru.trim());
      if (form.bahan_id && form.bahan_id !== "new")
        formData.append("bahan_id", form.bahan_id);
      if (form.bahan_id === "new")
        formData.append("bahan_nama", bahanInputBaru.trim());
      if (fotoDepan instanceof File) formData.append("foto_depan", fotoDepan);
      if (fotoSamping instanceof File)
        formData.append("foto_samping", fotoSamping);
      if (fotoAtas instanceof File) formData.append("foto_atas", fotoAtas);

      if (isEdit) {
        await api.post(
          `/product-distributors/${selectedId}?_method=PUT`,
          formData
        );
      } else {
        await api.post("/product-distributors", formData);
      }

      Swal.close();
      Swal.fire(
        "Berhasil",
        isEdit
          ? "Product distributor berhasil diperbarui"
          : "Product distributor berhasil ditambahkan",
        "success"
      );
      setIsModalOpen(false);
      setCurrentPage(1);
      fetchData({ search, jenis_id: filterJenis, type_id: filterType });
    } catch (error) {
      Swal.close();
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire("Validasi Gagal", msg, "warning");
      } else {
        Swal.fire("Error", "Terjadi kesalahan saat menyimpan data", "error");
      }
    }
  };

  const handleDelete = async (id) => {
    const confirm = await Swal.fire({
      title: "Hapus Product Distributor?",
      text: "Data akan dihapus permanen",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Hapus",
      cancelButtonText: "Batal",
    });

    if (confirm.isConfirmed) {
      try {
        await api.delete(`/product-distributors/${id}`);
        Swal.fire("Berhasil", "Product distributor dihapus", "success");
        fetchData({ search, jenis_id: filterJenis, type_id: filterType });
      } catch {
        Swal.fire("Error", "Gagal menghapus Product distributor", "error");
      }
    }
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    const parts = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran].filter(
      (part) => part != null && part !== ""
    );
    return parts.length > 0 ? parts.join(" ") : "-";
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
    setForm((prev) => ({ ...prev, harga_umum: formatRupiah(num) }));
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
    cameraInputRef
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

  const kodePreview = getKodePreview();

  useEffect(() => {
    setNavbarContent(
      <DistributorProductFilterBar
        search={search}
        setSearch={setSearch}
        filterJenis={filterJenis}
        setFilterJenis={setFilterJenis}
        filterType={filterType}
        setFilterType={setFilterType}
        jenis={jenis}
        filteredTypesForFilter={filteredTypesForFilter}
      />
    );
  }, [
    search,
    filterJenis,
    filterType,
    jenis,
    filteredTypesForFilter,
    setNavbarContent,
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          Tidak ada Product Distributor ditemukan
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {products.map((item) => {
              const totalQty = (item.qty_toko || 0) + (item.qty_bengkel || 0);
              return (
                <div
                  key={item.id}
                  className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-4 flex flex-col h-full min-h-[320px]"
                >
                  {/* Foto Produk */}
                  <div className="flex justify-center gap-2 mb-3">
                    {item.foto_depan && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${
                          item.foto_depan
                        }`}
                        alt="Foto Depan"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${
                              item.foto_depan
                            }`
                          )
                        }
                      />
                    )}
                    {item.foto_samping && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${
                          item.foto_samping
                        }`}
                        alt="Foto Samping"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${
                              item.foto_samping
                            }`
                          )
                        }
                      />
                    )}
                    {item.foto_atas && (
                      <img
                        src={`${import.meta.env.VITE_ASSET_URL}/storage/${
                          item.foto_atas
                        }`}
                        alt="Foto Atas"
                        className="w-16 h-16 object-cover rounded cursor-pointer border hover:shadow"
                        onClick={() =>
                          openFotoModal(
                            `${import.meta.env.VITE_ASSET_URL}/storage/${
                              item.foto_atas
                            }`
                          )
                        }
                      />
                    )}
                    {!item.foto_depan &&
                      !item.foto_samping &&
                      !item.foto_atas && (
                        <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                          <ImageIcon className="text-gray-400" size={24} />
                        </div>
                      )}
                  </div>

                  {/* Kode Produk */}
                  <div className="text-center mb-2">
                    <p className="font-bold text-xl text-gray-800 truncate">
                      {item.kode}
                    </p>
                  </div>

                  {/* Nama Produk */}
                  <div className="text-center mb-2 min-h-[24px]">
                    <p className="text-sm text-gray-600">
                      {formatProductName(item)}
                    </p>
                  </div>

                  {/* Harga Beli */}
                  <div className="text-center mb-2 flex items-center justify-center gap-1 text-sm">
                    <Truck size={14} className="text-blue-600" />
                    <span className="font-medium text-blue-700">
                      Beli: {formatRupiah(item.harga_beli || 0)}
                    </span>
                  </div>

                  {/* Harga Jual */}
                  <div className="text-center mb-2 flex items-center justify-center gap-1 text-sm">
                    <Tag size={14} className="text-amber-600" />
                    <span className="font-medium text-amber-700">
                      Jual: {formatRupiah(item.harga_umum || 0)}
                    </span>
                  </div>

                  {/* Stok & Distributor */}
                  <div className="text-center mb-2 text-xs text-gray-600 space-y-0.5">
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} />{" "}
                      <span>TOKO: {item.qty_toko || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} />{" "}
                      <span>BENGKEL: {item.qty_bengkel || 0}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Warehouse size={12} /> <span>TOTAL: {totalQty}</span>
                    </div>
                    <div className="flex items-center justify-center gap-1">
                      <Truck size={12} className="text-green-600" />
                      <span className="text-green-700">
                        {item.distributor?.nama || "-"}
                      </span>
                    </div>
                  </div>

                  {/* Keterangan (opsional) */}
                  {item.keterangan && (
                    <div className="text-center mb-3 flex-1 flex flex-col justify-start">
                      <p className="text-xs italic text-gray-500 line-clamp-2">
                        "{item.keterangan}"
                      </p>
                    </div>
                  )}

                  {/* Aksi */}
                  <div className="flex gap-2 pt-2 mt-auto">
                    {(role === "admin" || role === "kasir") && (
                      <button
                        onClick={() => handleEdit(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-amber-100 text-amber-800 rounded-lg hover:bg-amber-200 text-xs font-medium transition-colors duration-200"
                      >
                        <Pencil size={12} />
                      </button>
                    )}

                    {role === "kasir" && (
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 bg-rose-100 text-rose-800 rounded-lg hover:bg-rose-200 text-xs font-medium transition-colors duration-200"
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

      {(role === "admin" || role === "kasir") && (
        <button
          onClick={handleTambah}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-3 rounded-full shadow-lg transition"
        >
          <Plus size={18} />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 text-center">
                {isEdit
                  ? "Edit Product Distributor"
                  : "Tambah Product Distributor"}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kode <span className="text-red-500">*</span>
                </label>
                <div className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-lg text-gray-700 font-mono">
                  {kodePreview || "—"}
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Kode akan di-generate otomatis oleh sistem
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Distributor <span className="text-red-500">*</span>
                </label>
                <select
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.distributor_id}
                  onChange={(e) =>
                    setForm({ ...form, distributor_id: e.target.value })
                  }
                  required
                >
                  <option value="">Pilih Distributor</option>
                  {distributors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Beli <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.harga_beli}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, "");
                    const num = clean === "" ? 0 : parseInt(clean, 10);
                    setForm({ ...form, harga_beli: formatRupiah(num) });
                  }}
                  placeholder="Rp0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Harga Jual <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none"
                  value={form.harga_umum}
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
                  filteredTypes.length > 0
                    ? filteredTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama}
                        </option>
                      ))
                    : null}
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
                  cameraInputDepan
                )}
                {renderFotoPreview(
                  fotoSamping,
                  setFotoSamping,
                  "Samping",
                  fileInputSamping,
                  cameraInputSamping
                )}
                {renderFotoPreview(
                  fotoAtas,
                  setFotoAtas,
                  "Atas",
                  fileInputAtas,
                  cameraInputAtas
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
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
              onClick={closeFotoModal}
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

export default DistributorProductPage;
