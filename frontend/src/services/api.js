import axios from "axios"
import Swal from "sweetalert2"

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: false,
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
      await Swal.fire({
        icon: "error",
        title: "Koneksi Gagal",
        text: "Tidak dapat terhubung ke server.",
      })
      return Promise.reject(error)
    }

    const status = error.response.status

    if (status === 401 || status === 419) {
      localStorage.removeItem("token")

      await Swal.fire({
        icon: "warning",
        title: "Sesi Berakhir",
        text: "Silakan login kembali.",
        confirmButtonText: "Login Ulang",
      })

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default api
