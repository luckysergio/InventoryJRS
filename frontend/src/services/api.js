import axios from "axios"
import Swal from "sweetalert2"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
})

const darkSwal = (options) =>
  Swal.fire({
    background: "#020617",
    color: "#f8fafc",
    confirmButtonColor: "#2563eb",
    cancelButtonColor: "#dc2626",
    ...options,
  })

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    config.headers.Accept = "application/json"
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (!error.response) {
      await darkSwal({
        icon: "error",
        title: "Koneksi Gagal",
        text: "Tidak dapat terhubung ke server.",
      })
      return Promise.reject(error)
    }

    const status = error.response.status
    const message = error.response.data?.message

    if (status === 429) {
      await darkSwal({
        icon: "error",
        title: "Login Diblokir",
        text: message || "Terlalu banyak percobaan login.",
      })
      return Promise.reject(error)
    }

    if (status === 401 || status === 419) {
      localStorage.removeItem("token")

      await darkSwal({
        icon: "warning",
        title: "Sesi Berakhir",
        text: "Silakan login kembali.",
        confirmButtonText: "Login Ulang",
      })

      window.location.href = "/login"
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)

export default api
