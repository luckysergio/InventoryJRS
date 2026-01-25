import { Navigate } from "react-router-dom"

const ProtectedRoute = ({ children, roles = [] }) => {
  const token = localStorage.getItem("token")
  const user = JSON.parse(localStorage.getItem("user"))

  if (!token) {
    return <Navigate to="/" replace />
  }

  if (roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/403" replace />
  }

  return children
}

export default ProtectedRoute
