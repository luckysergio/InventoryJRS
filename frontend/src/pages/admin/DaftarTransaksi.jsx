import { useEffect, useState, useRef } from "react";
import Swal from "sweetalert2";
import {
  Plus,
  Trash2,
  Wallet,
  Receipt,
  CheckCircle,
  XCircle,
  Pencil,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Package,
} from "lucide-react";
import api from "../../services/api";
import InvoiceSimplePrint from "../../components/InvoiceSimplePrint";
import { useReactToPrint } from "react-to-print";

// ============ UTILITIES ============
const safeParseFloat = (value) => {
  if (value == null) return 0;
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num) ? 0 : num;
};

const formatRupiah = (value) => {
  const num = safeParseFloat(value);
  return new Intl.NumberFormat("id-ID").format(Math.round(num));
};

const unformatRupiah = (str) => {
  if (!str) return 0;
  const clean = String(str).replace(/\D/g, "");
  return clean === "" ? 0 : parseInt(clean, 10);
};

// ============ COMPONENT: Filter Bar ============
export const TransaksiFilterBar = ({ search, setSearch }) => {
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative flex-1 min-w-[150px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          type="text"
          placeholder="Cari berdasarkan Nama Customer..."
          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-200 focus:outline-none text-sm"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {search && (
        <button
          onClick={() => setSearch("")}
          className="py-2 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition text-sm whitespace-nowrap font-medium"
        >
          Reset
        </button>
      )}
    </div>
  );
};

// ============ COMPONENT: Searchable Dropdown (Reusable) ============
export const SearchableDropdown = ({
  options,
  selectedValue,
  onSelect,
  placeholder = "Pilih...",
  searchPlaceholder = "Cari...",
  renderOption,
  renderSelected,
  onCreateNew,
  showCreateNew = false,
  className = "",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredOptions = options.filter((opt) => {
    if (!search.trim()) return true;
    const searchLower = search.toLowerCase();
    const label = typeof opt === "string" ? opt : opt.label || opt.name || "";
    return label.toLowerCase().includes(searchLower);
  });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
    setSearch("");
  };

  const selectedOption = options.find(
    (opt) =>
      (typeof opt === "object" ? opt.value || opt.id : opt) === selectedValue,
  );

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <span className="truncate">
          {selectedOption
            ? renderSelected
              ? renderSelected(selectedOption)
              : typeof selectedOption === "object"
                ? selectedOption.label || selectedOption.name
                : selectedOption
            : placeholder}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden flex flex-col">
          <div className="p-2 border-b border-gray-100 sticky top-0 bg-white">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          <div className="overflow-y-auto flex-1 max-h-40">
            {filteredOptions.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Tidak ditemukan
              </div>
            ) : (
              filteredOptions.map((opt, idx) => {
                const value =
                  typeof opt === "object" ? opt.value || opt.id : opt;
                const isSelected = value === selectedValue;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(value)}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 flex items-center justify-between ${
                      isSelected ? "bg-indigo-100 text-indigo-800" : ""
                    }`}
                  >
                    <span className="truncate">
                      {renderOption
                        ? renderOption(opt)
                        : typeof opt === "object"
                          ? opt.label || opt.name
                          : opt}
                    </span>
                    {isSelected && (
                      <CheckCircle size={14} className="text-indigo-600 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {showCreateNew && (
            <button
              type="button"
              onClick={() => {
                onCreateNew?.();
                setIsOpen(false);
                setSearch("");
              }}
              className="p-2 border-t border-gray-100 text-sm text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1"
            >
              <Plus size={14} /> Buat Baru
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ============ COMPONENT: Searchable Product Dropdown dengan Filter & Stok ============
export const SearchableProductDropdown = ({
  products,
  selectedValue,
  onSelect,
  placeholder = "Pilih Produk...",
  searchPlaceholder = "Cari kode/nama...",
  jenisList,
  typeList,
  filterJenis,
  setFilterJenis,
  filterType,
  setFilterType,
  onCreateNew,
  onFilterChange,
  allowOutOfStockSelection = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  const filteredProducts = products.filter((p) => {
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      const namaProduk = [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (
        !p.kode?.toLowerCase().includes(searchLower) &&
        !namaProduk.includes(searchLower)
      ) {
        return false;
      }
    }
    if (filterJenis && String(p.jenis_id) !== String(filterJenis)) {
      return false;
    }
    if (filterType && String(p.type_id) !== String(filterType)) {
      return false;
    }
    return true;
  });

  useEffect(() => {
    if (onFilterChange) {
      onFilterChange({ search, filterJenis, filterType, count: filteredProducts.length });
    }
  }, [search, filterJenis, filterType, filteredProducts.length, onFilterChange]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSelect = (value) => {
    onSelect(value);
    setIsOpen(false);
    setSearch("");
  };

  const selectedProduct = products.find((p) => p.id === selectedValue);

  const formatProductName = (p) => {
    if (!p) return "";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  const getFilteredTypes = () => {
    if (!filterJenis) return typeList;
    return typeList.filter((t) => String(t.jenis_id) === String(filterJenis));
  };

  const resetFilters = () => {
    setSearch("");
    setFilterJenis("");
    setFilterType("");
  };

  const getProductStok = (product) => {
    if (!product || !product.inventories) return 0;
    const tokoInventory = product.inventories.find(
      (inv) => inv.place && inv.place.kode === "TOKO"
    );
    return tokoInventory ? tokoInventory.qty : 0;
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 border border-gray-300 rounded-lg bg-white text-left text-sm hover:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200"
      >
        <span className="truncate">
          {selectedProduct
            ? `${selectedProduct.kode} - ${formatProductName(selectedProduct)}`
            : placeholder}
        </span>
        {isOpen ? (
          <ChevronUp size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 ml-2 flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-hidden flex flex-col">
          <div className="p-3 border-b border-gray-100 sticky top-0 bg-white space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                placeholder={searchPlaceholder}
                className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onClick={(e) => e.stopPropagation()}
              />
              {search && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSearch("");
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            <div className="flex gap-1 flex-wrap">
              <select
                className="flex-1 min-w-[80px] py-1.5 px-2 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-200"
                value={filterJenis}
                onChange={(e) => {
                  setFilterJenis(e.target.value);
                  setFilterType("");
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Jenis</option>
                {jenisList.map((j) => (
                  <option key={j.id} value={j.id}>
                    {j.nama}
                  </option>
                ))}
              </select>
              <select
                className="flex-1 min-w-[80px] py-1.5 px-2 text-xs border border-gray-200 rounded bg-gray-50 focus:outline-none focus:ring-1 focus:ring-indigo-200 disabled:bg-gray-100"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                disabled={!filterJenis}
                onClick={(e) => e.stopPropagation()}
              >
                <option value="">Tipe</option>
                {getFilteredTypes().map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
              {(search || filterJenis || filterType) && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    resetFilters();
                  }}
                  className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
                  title="Reset filter"
                >
                  <Filter size={12} />
                </button>
              )}
            </div>

            {(search || filterJenis || filterType) && (
              <p className="text-[10px] text-gray-500 text-center">
                {filteredProducts.length} dari {products.length} produk
              </p>
            )}
          </div>

          <div className="overflow-y-auto flex-1 max-h-40">
            {filteredProducts.length === 0 ? (
              <div className="p-3 text-sm text-gray-500 text-center">
                Tidak ditemukan
              </div>
            ) : (
              filteredProducts.map((p) => {
                const isSelected = p.id === selectedValue;
                const stok = getProductStok(p);
                const isOutOfStock = stok <= 0;
                
                const isClickable = allowOutOfStockSelection || isSelected || !isOutOfStock;
                
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => isClickable && handleSelect(p.id)}
                    disabled={!isClickable}
                    className={`w-full px-3 py-2 text-left text-xs hover:bg-indigo-50 flex items-center justify-between border-b border-gray-50 last:border-0 ${
                      isSelected 
                        ? "bg-indigo-100 text-indigo-800" 
                        : !isClickable
                          ? "text-gray-400 cursor-not-allowed opacity-60" 
                          : ""
                    }`}
                  >
                    <div className="truncate pr-2 flex-1">
                      <div className="flex items-center gap-2">
                        <Package size={12} className="flex-shrink-0" />
                        <span className="font-medium">{p.kode}</span>
                      </div>
                      <div className="text-gray-600 mt-0.5">
                        {formatProductName(p)}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className={`font-semibold ${stok > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          Stok: {stok}
                        </span>
                        {isOutOfStock && !isSelected && (
                          <span className="text-red-500">(Habis)</span>
                        )}
                        {isOutOfStock && isSelected && (
                          <span className="text-orange-500">(Stok habis - dipilih)</span>
                        )}
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle size={14} className="text-indigo-600 flex-shrink-0 ml-2" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onCreateNew?.();
              setIsOpen(false);
              setSearch("");
            }}
            className="p-2 border-t border-gray-100 text-xs text-indigo-600 hover:bg-indigo-50 flex items-center justify-center gap-1"
          >
            <Plus size={12} /> Produk Baru
          </button>
        </div>
      )}
    </div>
  );
};

// ============ MAIN COMPONENT ============
const TransaksiPage = ({ setNavbarContent }) => {
  // State utama
  const [transaksi, setTransaksi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [statusList, setStatusList] = useState([]);
  const [statusSelesaiId, setStatusSelesaiId] = useState(null);
  const [statusProsesId, setStatusProsesId] = useState(null);
  const [statusDibatalkanId, setStatusDibatalkanId] = useState(null);

  // State modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isCreatingNewCustomer, setIsCreatingNewCustomer] = useState(false);

  // State filter produk
  const [productFilterInfo, setProductFilterInfo] = useState({});

  // State master data
  const [productJenisList, setProductJenisList] = useState([]);
  const [productTypeList, setProductTypeList] = useState([]);

  // State user & print
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  const [printTransaksi, setPrintTransaksi] = useState(null);
  const printRef = useRef();

  // State form
  const initialDetail = {
    id: "",
    product_id: "",
    harga_product_id: "",
    harga_baru: { harga: "", tanggal_berlaku: "", keterangan: "" },
    qty: "",
    status_transaksi_id: "",
    discount: 0,
    catatan: "",
  };

  const [form, setForm] = useState({
    customer_id: "",
    customer_baru: { name: "", phone: "", email: "" },
    tanggal: "",
    details: [{ ...initialDetail }],
  });

  const [hargaOptions, setHargaOptions] = useState({});
  const [showHargaBaru, setShowHargaBaru] = useState({});
  const [isFormReady, setIsFormReady] = useState(false);

  // Flag untuk menandai apakah navbar content sudah diset
  const [isNavbarSet, setIsNavbarSet] = useState(false);

  // ============ HELPER FUNCTIONS ============
  const getInvoiceNumber = (transaksiItem) => {
    const date = new Date(transaksiItem.tanggal || new Date());
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `JRS/INV/${year}/${month}/${transaksiItem.id}`;
  };

  const getSafeFileName = (transaksiItem) => {
    if (!transaksiItem) return "Invoice-JRS";
    const invoiceNum = getInvoiceNumber(transaksiItem);
    const customerName = transaksiItem.customer?.name || "Umum";
    const safeInvoiceNum = invoiceNum.replace(/\//g, "-");
    const safeCustomerName = customerName
      .replace(/[^a-zA-Z0-9\s\-_]/g, "")
      .trim()
      .replace(/\s+/g, "_");
    return `${safeInvoiceNum}-${safeCustomerName}`;
  };

  const handlePrintInvoice = useReactToPrint({
    contentRef: printRef,
    documentTitle: getSafeFileName(printTransaksi),
  });

  const onPrintClick = (transaksiItem) => {
    setPrintTransaksi(transaksiItem);
    setTimeout(() => {
      if (printRef.current) handlePrintInvoice();
    }, 150);
  };

  const formatProductName = (p) => {
    if (!p) return "-";
    return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
      .filter(Boolean)
      .join(" ");
  };

  const getStokToko = (product) => {
    if (!product || !product.inventories) return 0;
    const tokoInventory = product.inventories.find(
      (inv) => inv.place && inv.place.kode === "TOKO",
    );
    return tokoInventory ? tokoInventory.qty : 0;
  };

  const formatTanggal = (tgl) => {
    if (!tgl) return "-";
    return new Date(tgl).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  };

  const getSisaBayar = (detail) => {
    if (!detail) return 0;
    const subtotal = safeParseFloat(detail.subtotal);
    const pembayarans = Array.isArray(detail.pembayarans)
      ? detail.pembayarans
      : [];
    const totalBayar = pembayarans.reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0,
    );
    return subtotal - totalBayar;
  };

  const getTotalBayar = (detail) => {
    if (!detail) return 0;
    const pembayarans = Array.isArray(detail.pembayarans)
      ? detail.pembayarans
      : [];
    return pembayarans.reduce(
      (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
      0,
    );
  };

  const calculateActiveTotal = (details, prosesId) => {
    return details
      .filter((d) => d.status_transaksi_id === prosesId)
      .reduce((sum, d) => sum + safeParseFloat(d.subtotal), 0);
  };

  const getActiveDetails = (details) => {
    return details.filter((d) => d.status_transaksi_id === statusProsesId);
  };

  // ============ API FUNCTIONS ============
  const fetchData = async (searchTerm = "") => {
    try {
      setLoading(true);
      const [transaksiRes, customersRes, productsRes, statusRes, productJenisRes, productTypeRes] =
        await Promise.all([
          api.get("/transaksi/aktif", { params: { search: searchTerm } }),
          api.get("/customers"),
          api.get("/products/available"),
          api.get("/status-transaksi"),
          api.get("/jenis"),
          api.get("/type"),
        ]);

      setTransaksi(transaksiRes.data || []);
      setCustomers(customersRes.data.data || []);
      setProducts(productsRes.data.data || []);

      const statuses = statusRes.data.data || [];
      setStatusList(statuses);

      const selesai = statuses.find((s) =>
        s.nama.toLowerCase().includes("selesai"),
      );
      const proses = statuses.find((s) =>
        s.nama.toLowerCase().includes("proses"),
      );
      const dibatalkan = statuses.find((s) =>
        s.nama.toLowerCase().includes("dibatalkan"),
      );

      setStatusSelesaiId(selesai?.id?.toString() || null);
      setStatusProsesId(proses?.id?.toString() || null);
      setStatusDibatalkanId(dibatalkan?.id?.toString() || null);
      
      setProductJenisList(productJenisRes.data.data || []);
      setProductTypeList(productTypeRes.data.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      Swal.fire("Error", "Gagal memuat data", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchHargaByProduct = async (productId, rowIndex, customerId = null) => {
    if (!productId) {
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
      return;
    }
    try {
      const params = customerId ? `?customer_id=${customerId}` : "";
      const res = await api.get(`/harga/by-product/${productId}${params}`);
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: res.data.data || [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
    } catch {
      Swal.fire("Error", "Gagal memuat harga produk", "error");
      setHargaOptions((prev) => ({ ...prev, [rowIndex]: [] }));
      setShowHargaBaru((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  // ============ FORM HANDLERS ============
  const addDetailRow = () => {
    const newIndex = form.details.length;
    setForm({
      ...form,
      details: [
        ...form.details,
        { ...initialDetail, status_transaksi_id: statusProsesId },
      ],
    });
    setHargaOptions((prev) => ({ ...prev, [newIndex]: [] }));
    setShowHargaBaru((prev) => ({ ...prev, [newIndex]: false }));
  };

  const removeDetailRow = (index) => {
    const updated = [...form.details];
    updated.splice(index, 1);
    setForm({ ...form, details: updated });
    const newHargaOptions = { ...hargaOptions };
    const newShowHargaBaru = { ...showHargaBaru };
    delete newHargaOptions[index];
    delete newShowHargaBaru[index];
    setHargaOptions(newHargaOptions);
    setShowHargaBaru(newShowHargaBaru);
  };

  const handleDetailChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index][field] = value;
    setForm({ ...form, details: updated });

    if (field === "product_id") {
      fetchHargaByProduct(value, index, form.customer_id || null);
      updated[index].harga_product_id = "";
      updated[index].harga_baru = {
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      };
      setForm({ ...form, details: updated });
    }
  };

  const handleHargaBaruChange = (index, field, value) => {
    const updated = [...form.details];
    updated[index].harga_baru[field] = value;
    setForm({ ...form, details: updated });
  };

  const handleHargaSelection = (index, value) => {
    const updated = [...form.details];
    if (value === "tambah_harga_khusus") {
      updated[index].harga_product_id = "";
      setShowHargaBaru((prev) => ({ ...prev, [index]: true }));
    } else {
      updated[index].harga_product_id = value;
      updated[index].harga_baru = {
        harga: "",
        tanggal_berlaku: "",
        keterangan: "",
      };
      setShowHargaBaru((prev) => ({ ...prev, [index]: false }));
    }
    setForm({ ...form, details: updated });
  };

  const resetForm = async (data = null) => {
    setIsFormReady(false);
    
    if (data) {
      const existingCustomer = customers.find((c) => c.id == data.customer_id);
      const isCustomerBaru = !existingCustomer && data.customer_id;
      
      let customerBaruData = { name: "", phone: "", email: "" };
      let customerId = "";
      
      if (isCustomerBaru && data.customer) {
        customerBaruData = {
          name: data.customer.name || "",
          phone: data.customer.phone || "",
          email: data.customer.email || "",
        };
        customerId = "";
        setIsCreatingNewCustomer(true);
      } else if (existingCustomer) {
        customerId = existingCustomer.id;
        setIsCreatingNewCustomer(false);
      } else {
        setIsCreatingNewCustomer(false);
      }

      const detailsData = (data.details || [])
        .filter((d) => d.status_transaksi_id === statusProsesId)
        .map((d) => ({
          id: d.id || "",
          product_id: d.product_id ? Number(d.product_id) : "",
          harga_product_id: d.harga_product_id || "",
          harga_baru: d.harga_baru || {
            harga: "",
            tanggal_berlaku: "",
            keterangan: "",
          },
          qty: d.qty || "",
          status_transaksi_id: d.status_transaksi_id || statusProsesId,
          discount: d.discount || 0,
          catatan: d.catatan || "",
        }));

      const newForm = {
        customer_id: customerId,
        customer_baru: customerBaruData,
        tanggal: data.tanggal || "",
        details: detailsData.length > 0 ? detailsData : [{ ...initialDetail, status_transaksi_id: statusProsesId }],
      };
      
      setForm(newForm);

      const showHarga = {};
      
      for (let idx = 0; idx < newForm.details.length; idx++) {
        const d = newForm.details[idx];
        if (d.product_id) {
          await fetchHargaByProduct(d.product_id, idx, customerId || null);
          if (d.harga_baru && d.harga_baru.harga) {
            showHarga[idx] = true;
          } else {
            showHarga[idx] = false;
          }
        } else {
          showHarga[idx] = false;
        }
      }
      
      setShowHargaBaru(showHarga);
      setEditingId(data.id);
    } else {
      setForm({
        customer_id: "",
        customer_baru: { name: "", phone: "", email: "" },
        tanggal: "",
        details: [{ ...initialDetail, status_transaksi_id: statusProsesId }],
      });
      setIsCreatingNewCustomer(false);
      setHargaOptions({});
      setShowHargaBaru({});
      setEditingId(null);
    }
    
    setIsFormReady(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.customer_id && !form.customer_baru.name.trim()) {
      Swal.fire(
        "Error",
        "Nama customer wajib diisi jika membuat customer baru",
        "warning",
      );
      return;
    }

    if (!form.tanggal) {
      Swal.fire("Error", "Tanggal transaksi wajib diisi", "warning");
      return;
    }

    const cleanedDetails = form.details.map((detail) => {
      const cleaned = { ...detail };
      if (!editingId) {
        cleaned.status_transaksi_id = statusProsesId;
      } else {
        if (!cleaned.id) cleaned.status_transaksi_id = statusProsesId;
      }
      if (detail.harga_product_id) {
        delete cleaned.harga_baru;
      } else if (detail.harga_baru && detail.harga_baru.harga) {
        cleaned.harga_baru.harga = unformatRupiah(detail.harga_baru.harga);
      }
      return cleaned;
    });

    const payload = { ...form, details: cleanedDetails };

    try {
      if (editingId) {
        await api.put(`/transaksi/${editingId}`, payload);
        Swal.fire("Berhasil!", "Transaksi berhasil diperbarui", "success");
      } else {
        await api.post("/transaksi", payload);
        Swal.fire("Berhasil!", "Transaksi berhasil dibuat", "success");
      }
      resetForm();
      setIsModalOpen(false);
      fetchData(search);
    } catch (error) {
      if (error.response?.status === 422) {
        const msg = Object.values(error.response.data.errors)
          .flat()
          .join("<br>");
        Swal.fire({ title: "Validasi Gagal", html: msg, icon: "warning" });
      } else {
        Swal.fire("Error", "Terjadi kesalahan pada server", "error");
      }
    }
  };

  const handleSelesaiDetail = async (detailId) => {
    const allDetails = transaksi.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id == detailId);
    if (!detail) return;

    const sisa =
      safeParseFloat(detail.subtotal) -
      (detail.pembayarans?.reduce(
        (sum, p) => sum + safeParseFloat(p.jumlah_bayar),
        0,
      ) || 0);

    if (sisa > 0) {
      Swal.fire(
        "Peringatan",
        "Selesaikan pembayaran terlebih dahulu!",
        "warning",
      );
      return;
    }

    const confirm = await Swal.fire({
      title: "Selesaikan Detail Ini?",
      text: "Status akan diubah menjadi 'Selesai' dan detail ini pindah ke riwayat.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, Selesaikan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#10b981",
    });

    if (confirm.isConfirmed) {
      try {
        await api.patch(`/transaksi-detail/${detailId}/status`, {
          status_transaksi_id: statusSelesaiId,
        });
        Swal.fire("Berhasil!", "Detail transaksi diselesaikan", "success");
        fetchData(search);
      } catch {
        Swal.fire("Error", "Gagal menyelesaikan detail", "error");
      }
    }
  };

  const handleCancelDetail = async (detailId) => {
    const confirm = await Swal.fire({
      title: "Batalkan Detail Ini?",
      text: "Stok akan dikembalikan dan detail ini dibatalkan.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, Batalkan",
      cancelButtonText: "Batal",
      confirmButtonColor: "#d33",
    });

    if (confirm.isConfirmed) {
      try {
        await api.post(`/transaksi-detail/${detailId}/cancel`);
        Swal.fire("Berhasil", "Detail transaksi dibatalkan", "success");
        fetchData(search);
      } catch {
        Swal.fire("Error", "Gagal membatalkan detail", "error");
      }
    }
  };

  const handleEditTransaksi = (transaksiItem) => {
    resetForm(transaksiItem);
    setIsModalOpen(true);
  };

  const handleBayar = (detailId) => {
    const allDetails = transaksi.flatMap((t) => t.details);
    const detail = allDetails.find((d) => d.id === detailId);
    if (!detail) return;

    const sisa = getSisaBayar(detail);
    Swal.fire({
      title: "Input Pembayaran",
      html: `
        <p>Tagihan: Rp ${formatRupiah(detail.subtotal)}</p>
        <p>Sisa: Rp ${formatRupiah(sisa)}</p>
        <input type="text" id="jumlahBayar" class="swal2-input" placeholder="Jumlah bayar" value="">
        <input type="date" id="tanggalBayar" class="swal2-input">
      `,
      preConfirm: () => {
        const jumlah = unformatRupiah(
          Swal.getPopup().querySelector("#jumlahBayar").value,
        );
        const tanggal = Swal.getPopup().querySelector("#tanggalBayar").value;
        if (!jumlah || jumlah <= 0) {
          Swal.showValidationMessage("Jumlah bayar harus lebih dari 0");
        } else if (jumlah > sisa) {
          Swal.showValidationMessage(
            "Jumlah bayar tidak boleh melebihi sisa tagihan",
          );
        } else if (!tanggal) {
          Swal.showValidationMessage("Tanggal bayar wajib diisi");
        } else {
          return { jumlah, tanggal };
        }
      },
      didOpen: () => {
        const today = new Date().toISOString().split("T")[0];
        const tanggalInput = Swal.getPopup().querySelector("#tanggalBayar");
        const jumlahInput = Swal.getPopup().querySelector("#jumlahBayar");
        if (tanggalInput) tanggalInput.value = today;
        if (jumlahInput) {
          jumlahInput.value = formatRupiah(sisa);
          jumlahInput.addEventListener("input", (e) => {
            let value = e.target.value;
            let clean = value.replace(/\D/g, "");
            e.target.value =
              clean === "" ? "" : new Intl.NumberFormat("id-ID").format(clean);
          });
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        api
          .post("/pembayaran", {
            transaksi_detail_id: detailId,
            jumlah_bayar: result.value.jumlah,
            tanggal_bayar: result.value.tanggal,
          })
          .then(async () => {
            // FIX #2: Auto-complete when payment reaches 0
            const newSisa = sisa - result.value.jumlah;
            if (newSisa <= 0) {
              try {
                await api.patch(`/transaksi-detail/${detailId}/status`, {
                  status_transaksi_id: statusSelesaiId,
                });
                Swal.fire("Berhasil!", "Pembayaran lunas & detail diselesaikan", "success");
              } catch {
                Swal.fire("Berhasil!", "Pembayaran dicatat (gagal auto-selesai)", "success");
              }
            } else {
              Swal.fire("Berhasil!", "Pembayaran telah dicatat", "success");
            }
            fetchData(search);
          })
          .catch(() => {
            Swal.fire("Error", "Gagal menyimpan pembayaran", "error");
          });
      }
    });
  };

  // ============ SET NAVBAR CONTENT ============
  // FIX #1: Only send filter to navbar, remove inline fallback on mobile
  useEffect(() => {
    if (typeof setNavbarContent === "function") {
      const filterBar = <TransaksiFilterBar search={search} setSearch={setSearch} />;
      setNavbarContent(filterBar);
      setIsNavbarSet(true);
    }
  }, [search, setNavbarContent]);

  // Effect for initial data load
  useEffect(() => {
    fetchData(search);
  }, [search]);

  // Effect to ensure navbar content stays after loading
  useEffect(() => {
    if (!loading && isNavbarSet) {
      if (typeof setNavbarContent === "function") {
        const filterBar = <TransaksiFilterBar search={search} setSearch={setSearch} />;
        setNavbarContent(filterBar);
      }
    }
  }, [loading, search, setNavbarContent, isNavbarSet]);

  // ============ RENDER ============
  return (
    <>
      <div className="space-y-4 sm:space-y-6 md:space-y-8 px-2 sm:px-4">
        {/* FIX #1: Removed inline filter bar fallback - only show in navbar */}
        
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent"></div>
            <p className="mt-4 text-gray-600 text-sm sm:text-base">Memuat data transaksi...</p>
          </div>
        ) : transaksi.filter(item => getActiveDetails(item.details).length > 0).length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Receipt size={48} className="mx-auto" />
            </div>
            <p className="text-gray-500 text-sm sm:text-base">
              {search ? "Tidak ada transaksi yang ditemukan." : "Tidak ada transaksi harian dengan status proses."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
              >
                Reset Pencarian
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-2 px-1">
              <p className="text-xs sm:text-sm text-gray-500">
                Menampilkan {transaksi.filter(item => getActiveDetails(item.details).length > 0).length} transaksi
              </p>
            </div>
            {/* FIX #3: Improved responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {transaksi
                .map((item) => {
                  const activeDetails = getActiveDetails(item.details);
                  if (activeDetails.length === 0) return null;
                  return (
                    <div
                      key={item.id}
                      className="p-3 sm:p-4 bg-white rounded-xl shadow border border-gray-100 space-y-3 flex flex-col"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-2">
                        <span className="text-[10px] sm:text-xs font-mono text-gray-600 break-all">
                          {getInvoiceNumber(item)}
                        </span>
                        <button
                          onClick={() => onPrintClick(item)}
                          className="text-[10px] sm:text-xs bg-blue-600 text-white px-2 py-1.5 rounded hover:bg-blue-700 flex items-center justify-center gap-1 w-full sm:w-auto whitespace-nowrap"
                        >
                          <Receipt size={12} /> Print
                        </button>
                      </div>

                      <div className="flex justify-center items-start">
                        <div className="text-center">
                          <p className="text-gray-700 font-medium text-xs sm:text-sm">
                            {item.customer?.name || "Umum"} –{" "}
                            {formatTanggal(item.tanggal)}
                          </p>
                          <p className="text-gray-700 font-bold text-base sm:text-lg mt-1">
                            Rp{" "}
                            {formatRupiah(
                              calculateActiveTotal(item.details, statusProsesId),
                            )}
                          </p>
                        </div>
                      </div>

                      <hr className="my-2 border-gray-200" />

                      {/* FIX #3: Scrollable details container with better spacing */}
                      <div className="space-y-2 max-h-[300px] sm:max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                        {activeDetails.map((d) => {
                          const sisaBayar = getSisaBayar(d);
                          const isLunas = sisaBayar <= 0;
                          const totalBayar = getTotalBayar(d);
                          return (
                            <div
                              key={d.id}
                              className="p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-[10px] sm:text-xs text-center"
                            >
                              <p className="font-medium line-clamp-2">
                                {formatProductName(d.product)}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Qty</span> {d.qty}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Harga Satuan</span>{" "}
                                Rp {formatRupiah(d.harga)}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Diskon</span> Rp{" "}
                                {formatRupiah(d.discount)}
                              </p>
                              <p className="mt-1">
                                <span className="font-semibold">Tagihan</span> Rp{" "}
                                {formatRupiah(d.subtotal)}
                              </p>
                              {d.catatan && (
                                <p className="mt-1 italic line-clamp-2">{d.catatan}</p>
                              )}

                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="text-[10px]">
                                  <span
                                    className={`font-semibold ${
                                      isLunas ? "text-green-600" : "text-orange-600"
                                    }`}
                                  >
                                    {isLunas
                                      ? "✅ Lunas"
                                      : `⏳ Belum lunas (Sisa: Rp ${formatRupiah(
                                          sisaBayar,
                                        )})`}
                                  </span>
                                </p>
                                <p className="text-[9px] sm:text-[10px] text-gray-600 mt-1">
                                  Dibayar: Rp {formatRupiah(totalBayar)} dari Rp{" "}
                                  {formatRupiah(d.subtotal)}
                                </p>

                                {d.pembayarans && d.pembayarans.length > 0 && (
                                  <div className="mt-1 text-[9px] sm:text-[10px]">
                                    <p className="font-medium flex items-center justify-center gap-1">
                                      <Receipt size={10} /> Riwayat:
                                    </p>
                                    <ul className="list-disc list-inside space-y-0.5 mt-0.5 max-h-16 overflow-y-auto">
                                      {d.pembayarans.map((p) => (
                                        <li key={p.id} className="text-gray-700">
                                          Rp {formatRupiah(p.jumlah_bayar)} -{" "}
                                          {formatTanggal(p.tanggal_bayar)}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                {!isLunas && (
                                  <button
                                    onClick={() => handleBayar(d.id)}
                                    className="mt-2 w-full flex items-center justify-center gap-1 bg-green-100 text-green-700 px-1.5 py-1.5 rounded text-[10px] hover:bg-green-200 transition active:scale-95"
                                  >
                                    <Wallet size={12} /> Bayar
                                  </button>
                                )}

                                <div className="flex gap-1 mt-2">
                                  <button
                                    onClick={() => handleSelesaiDetail(d.id)}
                                    className="flex-1 flex items-center justify-center gap-1 bg-green-600 text-white text-[10px] px-1 py-1.5 rounded hover:bg-green-700 transition active:scale-95"
                                  >
                                    <CheckCircle size={12} /> Selesai
                                  </button>
                                  {role === "admin" && (
                                    <button
                                      onClick={() => handleCancelDetail(d.id)}
                                      className="flex-1 flex items-center justify-center gap-1 bg-red-600 text-white text-[10px] px-1 py-1.5 rounded hover:bg-red-700 transition active:scale-95"
                                    >
                                      <XCircle size={12} /> Batal
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-center mt-2 pt-2 border-t border-gray-100">
                        {role === "admin" && (
                          <button
                            onClick={() => handleEditTransaksi(item)}
                            className="w-full flex items-center justify-center gap-1 bg-yellow-600 text-white text-[10px] px-2 py-2 rounded hover:bg-yellow-700 transition active:scale-95"
                          >
                            <Pencil size={12} /> Edit Transaksi
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
                .filter(Boolean)}
            </div>
          </>
        )}

        {/* FIX #3: FAB with better mobile positioning and size */}
        {(role === "admin" || role === "admin_toko") && (
          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white w-12 h-12 sm:w-auto sm:px-5 sm:py-3 rounded-full shadow-lg transition active:scale-95"
            aria-label="Tambah Transaksi"
          >
            <Plus size={20} className="sm:hidden" />
            <span className="hidden sm:inline-flex items-center gap-2">
              <Plus size={18} /> Tambah
            </span>
          </button>
        )}

        {/* MODAL - FIX #3: Full screen on mobile, better responsive styling */}
        {isModalOpen && isFormReady && (
          <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50">
            <div className="bg-white w-full sm:w-full sm:max-w-4xl p-4 sm:p-6 rounded-t-2xl sm:rounded-2xl overflow-y-auto max-h-[95vh] sm:max-h-[90vh]">
              <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2 z-10">
                <h2 className="text-lg sm:text-xl font-bold">
                  {editingId ? "Edit Transaksi" : "Tambah Transaksi"}
                </h2>
                <button
                  onClick={() => {
                    resetForm();
                    setIsModalOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition"
                  aria-label="Tutup"
                >
                  <XCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                {/* Customer & Tanggal */}
                <div className="bg-gray-50 p-3 sm:p-4 rounded-xl">
                  <div className="grid grid-cols-1 gap-4">
                    {/* Customer dengan Searchable Dropdown */}
                    <div>
                      <label className="font-semibold block mb-2 text-sm">
                        Customer
                      </label>
                      <SearchableDropdown
                        options={customers.map((c) => ({
                          id: c.id,
                          name: c.name,
                          phone: c.phone,
                        }))}
                        selectedValue={form.customer_id}
                        onSelect={(val) => {
                          setIsCreatingNewCustomer(false);
                          setForm({
                            ...form,
                            customer_id: val,
                            customer_baru: { name: "", phone: "", email: "" },
                          });
                          form.details.forEach((detail, idx) => {
                            if (detail.product_id) {
                              fetchHargaByProduct(detail.product_id, idx, val);
                            }
                          });
                        }}
                        placeholder="Pilih Customer"
                        searchPlaceholder="Cari nama/phone..."
                        renderOption={(c) => (
                          <span>
                            {c.name}{" "}
                            {c.phone && (
                              <span className="text-gray-400">📞 {c.phone}</span>
                            )}
                          </span>
                        )}
                        renderSelected={(c) => (
                          <span>
                            {c.name}{" "}
                            {c.phone && (
                              <span className="text-gray-400">📞 {c.phone}</span>
                            )}
                          </span>
                        )}
                        onCreateNew={() => {
                          setIsCreatingNewCustomer(true);
                          setForm({
                            ...form,
                            customer_id: "",
                            customer_baru: { name: "", phone: "", email: "" },
                          });
                        }}
                        showCreateNew
                      />

                      {/* Form Customer Baru */}
                      {isCreatingNewCustomer && (
                        <div className="grid grid-cols-1 gap-2 mt-3">
                          <input
                            type="text"
                            placeholder="Nama *"
                            className="border px-3 py-2.5 rounded-lg text-sm w-full"
                            value={form.customer_baru.name}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  name: e.target.value,
                                },
                              })
                            }
                            required
                          />
                          <input
                            type="tel"
                            placeholder="Phone"
                            className="border px-3 py-2.5 rounded-lg text-sm w-full"
                            value={form.customer_baru.phone}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  phone: e.target.value,
                                },
                              })
                            }
                          />
                          <input
                            type="email"
                            placeholder="Email"
                            className="border px-3 py-2.5 rounded-lg text-sm w-full"
                            value={form.customer_baru.email}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                customer_baru: {
                                  ...form.customer_baru,
                                  email: e.target.value,
                                },
                              })
                            }
                          />
                        </div>
                      )}
                    </div>

                    {/* Tanggal */}
                    <div>
                      <label className="font-semibold block mb-2 text-sm">
                        Tanggal Transaksi *
                      </label>
                      <input
                        type="date"
                        className="w-full border px-3 py-2.5 rounded-lg text-sm"
                        value={form.tanggal}
                        onChange={(e) =>
                          setForm({ ...form, tanggal: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Detail Transaksi */}
                <div className="space-y-4">
                  <div className="flex justify-center items-center">
                    <h3 className="font-bold text-base sm:text-lg">Detail Transaksi</h3>
                  </div>

                  {form.details.map((d, i) => (
                    <div
                      key={i}
                      className="p-3 sm:p-4 border border-gray-200 rounded-xl bg-gray-50 space-y-4"
                    >
                      {/* Produk dengan Searchable Dropdown + Filter */}
                      <div className="space-y-2">
                        <label className="block mb-1 font-medium text-sm">
                          Produk *
                        </label>

                        <SearchableProductDropdown
                          products={products}
                          selectedValue={d.product_id}
                          onSelect={(val) =>
                            handleDetailChange(i, "product_id", val)
                          }
                          placeholder="Pilih Produk..."
                          searchPlaceholder="Cari kode/nama..."
                          jenisList={productJenisList}
                          typeList={productTypeList}
                          filterJenis={productFilterInfo?.filterJenis || ""}
                          setFilterJenis={(val) => 
                            setProductFilterInfo(prev => ({ ...prev, filterJenis: val }))
                          }
                          filterType={productFilterInfo?.filterType || ""}
                          setFilterType={(val) => 
                            setProductFilterInfo(prev => ({ ...prev, filterType: val }))
                          }
                          onCreateNew={() => {}}
                          onFilterChange={(info) => 
                            setProductFilterInfo(prev => ({ ...prev, [`row${i}`]: info }))
                          }
                          allowOutOfStockSelection={!!editingId}
                        />

                        {productFilterInfo?.[`row${i}`]?.count !== undefined && 
                         productFilterInfo?.[`row${i}`]?.count < products.length && (
                          <p className="text-[10px] text-gray-500 text-center">
                            Menampilkan {productFilterInfo[`row${i}`].count} dari {products.length} produk
                          </p>
                        )}
                      </div>

                      {/* Harga */}
                      {d.product_id && (
                        <div className="mt-3">
                          <label className="block mb-1 font-medium text-sm">
                            Pilih Harga
                          </label>
                          <select
                            className="w-full border px-3 py-2.5 rounded-lg bg-white text-sm"
                            value={
                              d.harga_product_id ||
                              (showHargaBaru[i] ? "tambah_harga_khusus" : "")
                            }
                            onChange={(e) =>
                              handleHargaSelection(i, e.target.value)
                            }
                          >
                            <option value="">-- Pilih --</option>
                            <optgroup label="Harga Umum">
                              {(hargaOptions[i] || [])
                                .filter((h) => !h.customer_id)
                                .map((h) => (
                                  <option key={`umum-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} -{" "}
                                    {h.keterangan || "Tanpa keterangan"} (
                                    {formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <optgroup label="Harga Khusus Customer">
                              {(hargaOptions[i] || [])
                                .filter((h) => h.customer_id)
                                .map((h) => (
                                  <option key={`khusus-${h.id}`} value={h.id}>
                                    Rp {formatRupiah(h.harga)} - {h.keterangan}{" "}
                                    ({formatTanggal(h.tanggal_berlaku)})
                                  </option>
                                ))}
                            </optgroup>
                            <option value="tambah_harga_khusus">
                              + Tambah Harga Khusus Customer
                            </option>
                          </select>

                          {showHargaBaru[i] && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <label className="block mb-2 font-medium text-blue-800 text-sm">
                                Harga Khusus Customer Baru
                              </label>
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  placeholder="Harga Baru (Rp)"
                                  className="border px-3 h-11 rounded-lg w-full text-sm"
                                  value={
                                    d.harga_baru.harga
                                      ? formatRupiah(d.harga_baru.harga)
                                      : ""
                                  }
                                  onChange={(e) => {
                                    const raw = unformatRupiah(e.target.value);
                                    handleHargaBaruChange(i, "harga", raw);
                                  }}
                                />
                                <input
                                  type="text"
                                  placeholder="Keterangan Harga"
                                  className="border px-3 h-11 rounded-lg w-full text-sm"
                                  value={d.harga_baru.keterangan}
                                  onChange={(e) =>
                                    handleHargaBaruChange(
                                      i,
                                      "keterangan",
                                      e.target.value,
                                    )
                                  }
                                />
                                <input
                                  type="date"
                                  className="border px-3 h-11 rounded-lg w-full text-sm"
                                  value={d.harga_baru.tanggal_berlaku}
                                  onChange={(e) =>
                                    handleHargaBaruChange(
                                      i,
                                      "tanggal_berlaku",
                                      e.target.value,
                                    )
                                  }
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Qty, Diskon, Catatan - FIX #3: Better mobile layout */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <input
                          type="number"
                          min="1"
                          max="9999"
                          placeholder="Qty *"
                          className="border px-3 py-3 rounded-lg w-full text-sm"
                          value={d.qty}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (
                              val === "" ||
                              (Number(val) >= 1 && Number(val) <= 9999)
                            ) {
                              handleDetailChange(i, "qty", val);
                            }
                          }}
                          required
                        />
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Diskon (Rp)"
                          className="border px-3 py-3 rounded-lg w-full text-sm"
                          value={d.discount ? formatRupiah(d.discount) : ""}
                          onChange={(e) => {
                            let raw = unformatRupiah(e.target.value);
                            if (
                              raw === "" ||
                              (Number(raw) >= 0 && Number(raw) <= 999999)
                            ) {
                              handleDetailChange(i, "discount", raw);
                            }
                          }}
                        />
                        <input
                          type="text"
                          placeholder="Catatan (opsional)"
                          className="border px-3 py-3 rounded-lg w-full sm:col-span-2 lg:col-span-2 text-sm"
                          value={d.catatan}
                          onChange={(e) =>
                            handleDetailChange(i, "catatan", e.target.value)
                          }
                        />
                      </div>

                      {/* Hapus Detail - FIX #3: Better mobile button */}
                      <button
                        type="button"
                        onClick={() => removeDetailRow(i)}
                        className="w-full mt-2 bg-red-100 text-red-600 py-2.5 rounded-lg hover:bg-red-200 flex items-center justify-center gap-1.5 text-sm transition active:scale-95"
                      >
                        <Trash2 size={16} /> Hapus Detail
                      </button>
                    </div>
                  ))}
                </div>

                {/* Tambah Detail Button */}
                <div className="flex justify-center items-center">
                  <button
                    type="button"
                    onClick={addDetailRow}
                    className="bg-green-600 text-white px-4 py-2.5 rounded-lg flex items-center gap-1.5 text-sm hover:bg-green-700 transition active:scale-95"
                  >
                    <Plus size={16} /> Tambah Detail
                  </button>
                </div>

                {/* Submit Button */}
                <div className="flex justify-center gap-3 pt-4 border-t">
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition active:scale-95 text-sm sm:text-base"
                  >
                    {editingId ? "Simpan Perubahan" : "Simpan Transaksi"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Print Container */}
      <div
        style={{
          position: "absolute",
          left: "-9999px",
          top: "0",
          width: "210mm",
          padding: "20mm",
          boxSizing: "border-box",
        }}
      >
        <InvoiceSimplePrint ref={printRef} transaksi={printTransaksi} />
      </div>
      
      {/* Custom scrollbar styles */}
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a1a1a1;
        }
      `}</style>
    </>
  );
};

export default TransaksiPage;