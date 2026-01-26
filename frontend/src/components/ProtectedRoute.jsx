import { Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";

const ProtectedRoute = ({ children, roles = [] }) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    if (!children) {
      navigate(-1);
    }
  }, [children, navigate]);

  if (!token) {
    return <Navigate to="/" replace />;
  }

  if (roles.length > 0 && (!user || !roles.includes(user.role))) {
    return <Navigate to="/403" replace />;
  }

  return children;
};

export default ProtectedRoute;
