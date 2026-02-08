import { useState, useEffect, useRef } from "react";
import Navbar from "./components/navbar";
import PreLoader from "./components/PreLoader";
import Footer from "./components/footer";
import api from "../../services/api";

const PLACEHOLDER_IMAGE = "https://via.placeholder.com/300x200?text=No+Image";

const formatProductName = (p) => {
  if (!p) return "-";
  return [p.jenis?.nama, p.type?.nama, p.bahan?.nama, p.ukuran]
    .filter(Boolean)
    .join(" ");
};

const formatRupiah = (angka) => {
  if (angka == null || angka === "") return "Hubungi Kami";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(angka);
};

const CompanyProfile = () => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [jenisOptions, setJenisOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [filteredTypes, setFilteredTypes] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const catalogRef = useRef(null);

  const [filters, setFilters] = useState({
    jenis_id: "",
    type_id: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const perPage = 20;

  const [stats, setStats] = useState({
    totalProducts: 0,
    clients: 500,
    experience: 15,
    projects: 1000,
  });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePosition({
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const elements = document.querySelectorAll("[data-aos]");
      elements.forEach((el) => {
        const position = el.getBoundingClientRect();
        if (position.top < window.innerHeight * 0.9) {
          el.classList.add("aos-animate");
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const fetchBestSellers = async () => {
      try {
        const res = await api.get("/public/products/best-seller", {
          params: { limit: 6 },
        });
        setBestSellers(res.data.data || []);
      } catch (error) {
        console.error("Gagal memuat produk terlaris:", error);
      }
    };
    fetchBestSellers();
  }, []);

  useEffect(() => {
    const fetchFilters = async () => {
      try {
        const [jenisRes, typeRes] = await Promise.all([
          api.get("/master/jenis-products"),
          api.get("/master/type-products"),
        ]);
        setJenisOptions(jenisRes.data.data || []);
        setTypeOptions(typeRes.data.data || []);
      } catch (error) {
        console.warn("Gagal memuat opsi filter:", error);
      }
    };
    fetchFilters();
  }, []);

  useEffect(() => {
    if (filters.jenis_id) {
      const filtered = typeOptions.filter(
        (type) => type.jenis_id == filters.jenis_id,
      );
      setFilteredTypes(filtered);

      if (
        filters.type_id &&
        !filtered.some((type) => type.id == filters.type_id)
      ) {
        setFilters((prev) => ({ ...prev, type_id: "" }));
      }
    } else {
      setFilteredTypes([]);
      if (filters.type_id) {
        setFilters((prev) => ({ ...prev, type_id: "" }));
      }
    }
  }, [filters.jenis_id, typeOptions, filters.type_id]);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: currentPage,
          limit: perPage,
          ...filters,
        };

        const res = await api.get("/public/products", { params });
        setProducts(res.data.data || []);
        setTotalPages(res.data.meta?.last_page || 1);
        setStats((prev) => ({
          ...prev,
          totalProducts: res.data.meta?.total || 0,
        }));
      } catch (error) {
        console.error("Gagal memuat katalog produk:", error);
        setProducts([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, filters]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setFilters({ jenis_id: "", type_id: "" });
    setCurrentPage(1);
  };

  const scrollToCatalog = () => {
    catalogRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const getImageUrl = (url) => {
    if (!url) return PLACEHOLDER_IMAGE;
    return url;
  };

  return (
    <>
      <PreLoader />
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-black to-gray-950 text-white overflow-hidden">
        {/* Animated Background Elements */}
        <div
          className="fixed inset-0 pointer-events-none"
          style={{
            transform: `translate(${mousePosition.x * 5}px, ${mousePosition.y * 5}px)`,
            transition: "transform 0.2s ease-out",
          }}
        >
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/3 to-cyan-500/3 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gradient-to-r from-purple-500/3 to-pink-500/3 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-gray-900/5 to-transparent rounded-full blur-3xl"></div>
        </div>

        <Navbar />

        {/* Scroll to Top Button */}
        {showScrollTop && (
          <button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 bg-gradient-to-r from-gray-800/90 to-gray-900/90 rounded-full shadow-lg hover:shadow-[0_0_20px_rgba(255,255,255,0.15)] transition-all duration-300 hover:scale-110 backdrop-blur-sm border border-gray-700/50"
            data-aos="fade-up"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 10l7-7m0 0l7 7m-7-7v18"
              />
            </svg>
          </button>
        )}

        {/* Hero Section */}
        <section
          id="beranda"
          className="relative min-h-screen flex items-center justify-center px-6 overflow-hidden"
          data-aos="fade-in"
          data-aos-duration="1000"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/5 via-transparent to-purple-500/5"></div>
          <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>

          <div className="relative z-10 text-center max-w-6xl mx-auto">
            <h1
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-8 leading-tight"
              data-aos="fade-up"
              data-aos-delay="300"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-white to-purple-400 bg-300% animate-gradient">
                JAYA RUBBER SEAL
              </span>
            </h1>

            <p
              className="text-xl md:text-2xl text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed font-light"
              data-aos="fade-up"
              data-aos-delay="400"
            >
              Precision-engineered rubber seal solutions for automotive,
              machinery, and industrial applications with unparalleled quality
              and durability.
            </p>

            <div
              className="flex flex-wrap gap-6 justify-center"
              data-aos="fade-up"
              data-aos-delay="500"
            >
              <button
                onClick={scrollToCatalog}
                className="group px-10 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 rounded-xl font-semibold text-lg hover:shadow-[0_0_40px_rgba(34,211,238,0.6)] transition-all duration-300 hover:scale-105 hover:from-cyan-500 hover:to-blue-600 shadow-lg shadow-cyan-500/20 flex items-center gap-3"
              >
                <span>Explore Products</span>
                <svg
                  className="w-5 h-5 group-hover:translate-x-2 transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </button>

              <a
                href="#kontak"
                className="px-10 py-4 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl font-semibold text-lg hover:shadow-[0_0_40px_rgba(192,132,252,0.3)] transition-all duration-300 hover:scale-105 border border-gray-700 hover:border-purple-500/50 flex items-center gap-3"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
                <span>Get Consultation</span>
              </a>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce"
            data-aos="fade-up"
            data-aos-delay="600"
          >
            <div className="flex flex-col items-center">
              <span className="text-sm text-gray-400 mb-2 tracking-wider">
                EXPLORE
              </span>
              <svg
                className="w-6 h-6 text-cyan-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section
          className="py-16 px-4 md:px-8 lg:px-12 relative -mt-20"
          data-aos="fade-up"
        >
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  value: `${stats.experience}+`,
                  label: "Tahun Pengalaman",
                  color: "from-blue-500 to-cyan-500",
                  gradient: "bg-gradient-to-r from-blue-500/5 to-cyan-500/5",
                  border: "border-blue-500/10",
                },
                {
                  value: `${stats.clients}+`,
                  label: "Klien Terpercaya",
                  color: "from-purple-500 to-pink-500",
                  gradient: "bg-gradient-to-r from-purple-500/5 to-pink-500/5",
                  border: "border-purple-500/10",
                },
                {
                  value: `${stats.totalProducts}+`,
                  label: "Produk Tersedia",
                  color: "from-emerald-500 to-green-500",
                  gradient:
                    "bg-gradient-to-r from-emerald-500/5 to-green-500/5",
                  border: "border-emerald-500/10",
                },
                {
                  value: `${stats.projects}+`,
                  label: "Proyek Selesai",
                  color: "from-amber-500 to-orange-500",
                  gradient: "bg-gradient-to-r from-amber-500/5 to-orange-500/5",
                  border: "border-amber-500/10",
                },
              ].map((stat, index) => (
                <div
                  key={index}
                  className={`p-6 rounded-xl backdrop-blur-sm border ${stat.border} ${stat.gradient} hover:scale-[1.02] transition-all duration-300 hover:shadow-lg`}
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                >
                  <div className="text-center">
                    <div
                      className={`text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}
                    >
                      {stat.value}
                    </div>
                    <div className="text-xs font-medium text-gray-400 tracking-wider">
                      {stat.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section
          id="tentang"
          className="py-20 px-4 md:px-8 lg:px-12 relative"
          data-aos="fade-up"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/3 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-4 mb-6"
                data-aos="fade-down"
              >
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                <span className="px-5 py-2 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-full backdrop-blur-sm border border-gray-700/50">
                  <span className="text-sm font-medium text-gray-300 tracking-widest">
                    TENTANG KAMI
                  </span>
                </span>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
              </div>

              <div className="mb-10">
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
                  data-aos="fade-up"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Presisi & Keandalan
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-500">
                    dalam Setiap Detail
                  </span>
                </h2>
                <p
                  className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed font-light"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Sebagai pionir dalam industri seal karet sejak 2005, kami
                  menghadirkan solusi presisi tinggi dengan teknologi terkini
                  untuk memenuhi kebutuhan industri yang paling menuntut.
                </p>
              </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                {[
                  {
                    icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Sertifikasi Internasional",
                    desc: "Manufaktur dengan standar ISO 9001:2015 dan kontrol kualitas ketat",
                    color: "from-blue-500 to-cyan-500",
                  },
                  {
                    icon: "M13 10V3L4 14h7v7l9-11h-7z",
                    title: "Teknologi Modern",
                    desc: "Dilengkapi dengan mesin CNC dan injection molding terbaru",
                    color: "from-purple-500 to-pink-500",
                  },
                  {
                    icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
                    title: "Efisiensi Produksi",
                    desc: "Sistem just-in-time dengan manajemen rantai pasokan optimal",
                    color: "from-emerald-500 to-green-500",
                  },
                ].map((item, index) => (
                  <div
                    key={index}
                    className="group p-5 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl backdrop-blur-sm border border-gray-700/50 hover:border-gray-600/50 transition-all duration-300"
                    data-aos="fade-right"
                    data-aos-delay={index * 100}
                  >
                    <div className="flex items-start gap-5">
                      <div
                        className={`p-3 rounded-lg bg-gradient-to-r ${item.color} shadow-md`}
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d={item.icon}
                          />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2">
                          {item.title}
                        </h3>
                        <p className="text-gray-400 leading-relaxed text-sm">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative" data-aos="fade-left">
                <div className="absolute -inset-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-2xl blur-2xl opacity-30"></div>
                <div className="relative bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-2xl p-6 backdrop-blur-sm border border-gray-700/50 overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-cyan-500/3 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                  <div className="relative">
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-white mb-3">
                        Komitmen Kualitas
                      </h3>
                      <p className="text-gray-300 leading-relaxed text-sm">
                        Setiap komponen yang kami produksi melalui proses
                        inspeksi ketat dengan toleransi hingga 0.01mm,
                        memastikan presisi dan daya tahan optimal untuk aplikasi
                        industri berat.
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center p-4 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="text-2xl font-bold text-cyan-400 mb-1">
                          0.01mm
                        </div>
                        <div className="text-xs text-gray-400">
                          Akurasi Toleransi
                        </div>
                      </div>
                      <div className="text-center p-4 bg-gradient-to-b from-gray-800/50 to-gray-900/50 rounded-lg border border-gray-700/50">
                        <div className="text-2xl font-bold text-purple-400 mb-1">
                          99.8%
                        </div>
                        <div className="text-xs text-gray-400">
                          Tingkat Keberhasilan
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Best Sellers */}
        <section
          className="py-20 px-4 md:px-8 lg:px-12 relative"
          data-aos="fade-up"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/5 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <div
                className="inline-flex items-center gap-4 mb-6"
                data-aos="fade-down"
              >
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                <span className="px-5 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 rounded-full backdrop-blur-sm border border-amber-500/30">
                  <span className="text-sm font-medium text-amber-300 tracking-widest flex items-center gap-2">
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    PRODUK UNGGULAN
                  </span>
                </span>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
              </div>

              <div className="mb-10">
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
                  data-aos="fade-up"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-500">
                    Solusi Terpercaya
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Industri
                  </span>
                </h2>
                <p
                  className="text-lg text-gray-400 max-w-2xl mx-auto font-light"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Produk-produk terbaik kami yang telah terbukti kualitasnya
                  dalam berbagai aplikasi industri
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bestSellers.map((product, index) => (
                <div
                  key={product.id}
                  className="group bg-gradient-to-b from-gray-800/40 to-gray-900/40 rounded-xl overflow-hidden backdrop-blur-sm border border-gray-700/50 hover:border-amber-500/20 transition-all duration-300"
                  data-aos="zoom-in"
                  data-aos-delay={index * 100}
                >
                  {/* Best seller badge */}
                  <div className="absolute top-3 right-3 z-10">
                    <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-600 rounded-full text-xs font-bold shadow-md">
                      TERLARIS
                    </div>
                  </div>

                  <div className="relative h-56 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                    {/* Foto Container dengan Carousel Hover */}
                    <div className="relative w-full h-full">
                      {/* Foto Depan (Default) */}
                      <img
                        src={getImageUrl(product.foto?.depan)}
                        alt={formatProductName(product)}
                        className="absolute inset-0 w-full h-full object-contain p-6 transition-opacity duration-500 group-hover:opacity-0"
                        onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                      />

                      {/* Foto Samping (Hover 1) */}
                      {product.foto?.samping && (
                        <img
                          src={getImageUrl(product.foto.samping)}
                          alt={`${formatProductName(product)} - Samping`}
                          className="absolute inset-0 w-full h-full object-contain p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300"
                          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                        />
                      )}

                      {/* Foto Atas (Hover 2) */}
                      {product.foto?.atas && (
                        <img
                          src={getImageUrl(product.foto.atas)}
                          alt={`${formatProductName(product)} - Atas`}
                          className="absolute inset-0 w-full h-full object-contain p-6 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-600"
                          onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                        />
                      )}
                    </div>

                    {/* Dot Indicator untuk menunjukkan ada 3 foto */}
                    <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${product.foto?.depan ? "bg-amber-400" : "bg-gray-600"}`}
                      ></div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${product.foto?.samping ? "bg-amber-400" : "bg-gray-600"}`}
                      ></div>
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${product.foto?.atas ? "bg-amber-400" : "bg-gray-600"}`}
                      ></div>
                    </div>

                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-50"></div>
                  </div>

                  <div className="p-5">
                    <div className="mb-3">
                      <h3 className="text-base text-center font-bold text-white mb-2 group-hover:text-amber-300 transition-colors line-clamp-2">
                        {formatProductName(product)}
                      </h3>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center">
                        <div className="flex items-center gap-2">
                          <svg
                            className="w-3 h-3 text-amber-500"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          <span className="text-xs text-gray-300">
                            Terjual:{" "}
                            <span className="font-bold text-amber-400">
                              {product.total_terjual}
                            </span>
                          </span>
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-700/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Harga</span>
                          <span className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-orange-400">
                            {formatRupiah(product.harga_umum)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Catalog Section */}
        <section
          ref={catalogRef}
          id="catalog"
          className="py-20 px-4 md:px-8 lg:px-12 relative"
          data-aos="fade-up"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-gray-900/3 to-transparent"></div>
          <div className="relative max-w-7xl mx-auto">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-4 mb-6"
                data-aos="fade-down"
              >
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                <span className="px-5 py-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full backdrop-blur-sm border border-blue-500/30">
                  <span className="text-sm font-medium text-blue-300 tracking-widest">
                    KATALOG PRODUK
                  </span>
                </span>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
              </div>

              <div className="mb-8">
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
                  data-aos="fade-up"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-500">
                    Portofolio Lengkap
                  </span>
                  <br />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Komponen Karet
                  </span>
                </h2>
                <p
                  className="text-lg text-gray-400 max-w-2xl mx-auto font-light"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Telusuri koleksi lengkap produk kami yang dirancang untuk
                  performa optimal
                </p>
              </div>
            </div>

            {/* Filter Content */}
            <div
              className={`${showFilters ? "block" : "hidden"} md:block mb-8`}
              data-aos="fade-up"
              data-aos-delay="100"
            >
              <div className="bg-gradient-to-br from-gray-800/60 to-gray-900/60 rounded-xl p-5 backdrop-blur-sm border border-gray-700/50">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium">
                      JENIS PRODUK
                    </label>
                    <select
                      className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent appearance-none text-sm"
                      value={filters.jenis_id}
                      onChange={(e) =>
                        handleFilterChange("jenis_id", e.target.value)
                      }
                    >
                      <option value="">Semua Jenis</option>
                      {jenisOptions.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-gray-400 mb-2 font-medium">
                      KATEGORI
                    </label>
                    <select
                      className="w-full bg-gray-900/50 border border-gray-700/50 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent appearance-none disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                      value={filters.type_id}
                      onChange={(e) =>
                        handleFilterChange("type_id", e.target.value)
                      }
                      disabled={!filters.jenis_id}
                    >
                      <option value="">
                        {filters.jenis_id
                          ? "Pilih Kategori"
                          : "Pilih Jenis Dulu"}
                      </option>
                      {filteredTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.nama}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      onClick={resetFilters}
                      className="w-full py-2.5 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg font-medium hover:from-gray-700 hover:to-gray-800 transition-all duration-300 border border-gray-700/50 hover:border-gray-600/50 flex items-center justify-center gap-2 text-sm"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Reset Filter
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Grid */}
            {loading ? (
              <div className="flex justify-center items-center h-48">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
              </div>
            ) : products.length > 0 ? (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {products.map((product, index) => (
                    <div
                      key={product.id}
                      className="group bg-gradient-to-b from-gray-800/40 to-gray-900/40 rounded-lg overflow-hidden backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/20 transition-all duration-300 hover:scale-[1.02]"
                      data-aos="fade-up"
                      data-aos-delay={(index % 4) * 50}
                    >
                      <div className="relative h-40 bg-gradient-to-br from-gray-900 to-black overflow-hidden">
                        {/* Foto Container dengan Carousel Hover untuk Catalog */}
                        <div className="relative w-full h-full">
                          {/* Foto Depan (Default) */}
                          <img
                            src={getImageUrl(product.foto?.depan)}
                            alt={formatProductName(product)}
                            className="absolute inset-0 w-full h-full object-contain p-4 transition-opacity duration-500 group-hover:opacity-0"
                            onError={(e) => (e.target.src = PLACEHOLDER_IMAGE)}
                          />

                          {/* Foto Samping (Hover 1) */}
                          {product.foto?.samping && (
                            <img
                              src={getImageUrl(product.foto.samping)}
                              alt={`${formatProductName(product)} - Samping`}
                              className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-300"
                              onError={(e) =>
                                (e.target.src = PLACEHOLDER_IMAGE)
                              }
                            />
                          )}

                          {/* Foto Atas (Hover 2) */}
                          {product.foto?.atas && (
                            <img
                              src={getImageUrl(product.foto.atas)}
                              alt={`${formatProductName(product)} - Atas`}
                              className="absolute inset-0 w-full h-full object-contain p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500 delay-600"
                              onError={(e) =>
                                (e.target.src = PLACEHOLDER_IMAGE)
                              }
                            />
                          )}
                        </div>

                        {/* Dot Indicator untuk Catalog */}
                        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className={`w-1 h-1 rounded-full ${product.foto?.depan ? "bg-blue-400" : "bg-gray-600"}`}
                          ></div>
                          <div
                            className={`w-1 h-1 rounded-full ${product.foto?.samping ? "bg-blue-400" : "bg-gray-600"}`}
                          ></div>
                          <div
                            className={`w-1 h-1 rounded-full ${product.foto?.atas ? "bg-blue-400" : "bg-gray-600"}`}
                          ></div>
                        </div>

                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300"></div>
                      </div>

                      <div className="p-4">
                        <div className="mb-2">
                          <h3 className="font-bold text-white mb-1 group-hover:text-blue-300 transition-colors line-clamp-2 text-xs text-center">
                            {formatProductName(product)}
                          </h3>
                        </div>

                        <div className="pt-2 border-t border-gray-700/50">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-gray-400">Harga</span>
                            <span className="font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-400 text-xs">
                              {formatRupiah(product.harga_umum)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div
                    className="flex justify-center items-center gap-2 mt-8"
                    data-aos="fade-up"
                  >
                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      disabled={currentPage === 1}
                      className="px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 19l-7-7 7-7"
                        />
                      </svg>
                    </button>

                    <div className="flex gap-1">
                      {[...Array(Math.min(5, totalPages))].map((_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`px-3 py-2 rounded-lg transition-all duration-300 text-sm ${
                              currentPage === pageNum
                                ? "bg-gradient-to-r from-blue-600 to-cyan-700 text-white shadow-md shadow-blue-500/20"
                                : "bg-gradient-to-r from-gray-800 to-gray-900 text-gray-300 hover:text-white border border-gray-700/50 hover:border-blue-500/20"
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg border border-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed hover:border-blue-500/20 transition-colors"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12" data-aos="fade-up">
                <div className="inline-flex p-6 bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl backdrop-blur-sm border border-gray-700/50">
                  <div>
                    <svg
                      className="w-12 h-12 mx-auto text-gray-600 mb-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <h3 className="text-lg font-bold text-gray-400 mb-2">
                      Produk Tidak Ditemukan
                    </h3>
                    <p className="text-gray-500 text-sm">
                      Coba sesuaikan kriteria filter Anda
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Contact Section */}
        <section
          id="kontak"
          className="pb-20 pt-16 px-4 md:px-8 lg:px-12 relative overflow-hidden"
          data-aos="fade-up"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-gray-900/10 via-black/5 to-gray-900/10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-48 bg-gradient-to-r from-blue-500/3 to-purple-500/3 rounded-full blur-3xl"></div>
          </div>

          <div className="relative max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <div
                className="inline-flex items-center gap-4 mb-6"
                data-aos="fade-down"
              >
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
                <span className="px-5 py-2 bg-gradient-to-r from-gray-800/60 to-gray-900/60 rounded-full backdrop-blur-sm border border-gray-700/50">
                  <span className="text-sm font-medium text-gray-300 tracking-widest">
                    HUBUNGI KAMI
                  </span>
                </span>
                <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-600/50 to-transparent"></div>
              </div>

              <div className="mb-8">
                <h2
                  className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 tracking-tight"
                  data-aos="fade-up"
                >
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
                    Hubungi Tim Kami
                  </span>
                </h2>
                <p
                  className="text-lg text-gray-400 max-w-2xl mx-auto font-light"
                  data-aos="fade-up"
                  data-aos-delay="100"
                >
                  Siap memberikan solusi terbaik untuk kebutuhan industri Anda
                </p>
              </div>
            </div>

            {/* Grid 6 Card */}
            <div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12"
              data-aos="fade-up"
            >
              {/* Card 1: Telepon */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-blue-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg border border-blue-500/20 group-hover:border-blue-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Telepon
                      </h3>
                      <p className="text-gray-400 text-sm">Hubungi langsung</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-gray-300 text-lg mb-2">(021) 62305916</p>
                    <a
                      href="tel:+622112345678"
                      className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium transition-colors duration-200"
                    >
                      <span>Hubungi Sekarang</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 2: WhatsApp */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-emerald-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-emerald-500/10 to-green-500/10 rounded-lg border border-emerald-500/20 group-hover:border-emerald-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-emerald-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        WhatsApp
                      </h3>
                      <p className="text-gray-400 text-sm">Chat langsung</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-gray-300 text-lg mb-2">0812-8795-1140</p>
                    <a
                      href="https://wa.me/6281287951140"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-emerald-400 hover:text-emerald-300 font-medium transition-colors duration-200"
                    >
                      <span>Kirim Pesan</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 3: Email */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-amber-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-lg border border-amber-500/20 group-hover:border-amber-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-amber-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Email
                      </h3>
                      <p className="text-gray-400 text-sm">Kirim email</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-gray-300 text-lg mb-2 truncate">
                      sales.jayarubberseal@gmail.com
                    </p>
                    <a
                      href="mailto:sales.jayarubberseal@gmail.com"
                      className="inline-flex items-center text-amber-400 hover:text-amber-300 font-medium transition-colors duration-200"
                    >
                      <span>Kirim Email</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 4: Lokasi */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-purple-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-lg border border-purple-500/20 group-hover:border-purple-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-purple-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Lokasi Toko
                      </h3>
                      <p className="text-gray-400 text-sm">Kunjungi kami</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <p className="text-gray-300 text-base mb-1 text-justify">
                      Pertokoan Glodok Jaya Lt.2 Blok A 35
                    </p>
                    <p className="text-gray-400 text-sm">
                      Kota Jakarta Barat, Daerah Khusus Ibukota Jakarta 11180,
                      Indonesia
                    </p>
                    <a
                      href="https://www.google.com/maps/search/Pertokoan+Glodok+Jaya+Lt.2+Blok+A+35,+Jl.+Hayam+Wuruk,+RT.1%2FRW.6,+Mangga+Besar,+Kec.+Taman+Sari,+Kota+Jakarta+Barat,+Daerah+Khusus+Ibukota+Jakarta+11180,+Indonesia/@-6.1446,106.8166,17z?hl=id&entry=ttu&g_ep=EgoyMDI2MDEyMS4wIKXMDSoASAFQAw%3D%3D"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-purple-400 hover:text-purple-300 font-medium transition-colors duration-200 mt-2"
                    >
                      <span>Lihat Peta</span>
                      <svg
                        className="w-4 h-4 ml-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M14 5l7 7m0 0l-7 7m7-7H3"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              </div>

              {/* Card 5: Jam Operasional */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-cyan-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border border-cyan-500/20 group-hover:border-cyan-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-cyan-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Jam Operasional
                      </h3>
                      <p className="text-gray-400 text-sm">Waktu kerja</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="space-y-1">
                      <p className="text-gray-300 text-base">
                        <span className="font-medium">Senin - Jumat:</span>{" "}
                        08:00 - 17:00
                      </p>
                      <p className="text-gray-300 text-base">
                        <span className="font-medium">Sabtu:</span> 08:00 -
                        12:00
                      </p>
                      <p className="text-gray-400 text-sm mt-2">
                        Minggu & Hari Libur: Tutup
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 6: Layanan */}
              <div className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-6 backdrop-blur-sm border border-gray-700/50 hover:border-red-500/30 transition-all duration-300 group">
                <div className="flex flex-col h-full">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-3 bg-gradient-to-r from-red-500/10 to-pink-500/10 rounded-lg border border-red-500/20 group-hover:border-red-400/40 transition-colors duration-300">
                      <svg
                        className="w-6 h-6 text-red-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">
                        Layanan Cepat
                      </h3>
                      <p className="text-gray-400 text-sm">Dukungan teknis</p>
                    </div>
                  </div>
                  <div className="mt-auto">
                    <div className="space-y-3">
                      <div>
                        <p className="text-gray-300 text-base font-medium">
                          Respon dalam 24 jam
                        </p>
                        <p className="text-gray-400 text-sm">
                          Untuk semua pertanyaan
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-300 text-base font-medium">
                          Konsultasi teknis
                        </p>
                        <p className="text-gray-400 text-sm">
                          Tim ahli tersedia
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* CTA Section */}
            <div
              className="bg-gradient-to-br from-gray-800/40 to-gray-900/40 rounded-xl p-8 backdrop-blur-sm border border-gray-700/50"
              data-aos="fade-up"
              data-aos-delay="200"
            >
              <div className="text-center">
                <h3 className="text-2xl font-bold text-white mb-4">
                  Butuh Bantuan Cepat?
                </h3>
                <p className="text-gray-400 mb-6 max-w-2xl mx-auto">
                  Tim customer service kami siap membantu Anda dengan pertanyaan
                  teknis, penawaran harga, atau konsultasi produk.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <a
                    href="https://wa.me/6281287951140"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-emerald-600 to-green-700 rounded-lg font-bold text-base hover:shadow-[0_0_20px_rgba(16,185,129,0.2)] transition-all duration-300 hover:scale-[1.02]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.226 1.36.194 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                    </svg>
                    Chat WhatsApp
                  </a>

                  <a
                    href="tel:+622162305916"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-700 rounded-lg font-bold text-base hover:shadow-[0_0_20px_rgba(6,182,212,0.2)] transition-all duration-300 hover:scale-[1.02]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                    Telepon Sekarang
                  </a>

                  <a
                    href="mailto:sales.jayarubberseal@gmail.com
"
                    className="inline-flex items-center justify-center px-6 py-3 bg-gradient-to-r from-gray-800 to-gray-900 rounded-lg font-bold text-base border border-gray-700/50 hover:border-cyan-500/20 transition-all duration-300 hover:scale-[1.02]"
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Kirim Email
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default CompanyProfile;
