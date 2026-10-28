import { Navigate, Outlet, useLocation } from "react-router-dom";
import Loader from "./Loader";
import { useAuth } from "../../hooks/useAuth";

export default function ProtectedRoute() {
  const { token, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Loader message="Checking authentication..." />;
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
