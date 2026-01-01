import axios from "axios"
import Swal from "sweetalert2"

const api = axios.create({
  baseURL: "http://localhost:8000/api",
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => response, 
  async (error) => {

    if (error.response && (error.response.status === 401 || error.response.status === 419)) {

      // hapus token
      localStorage.removeItem("token")

      await Swal.fire({
        icon: "warning",
        title: "Sesi Anda Berakhir",
        text: "Silakan login kembali.",
        confirmButtonText: "Login Ulang"
      })

      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default api
