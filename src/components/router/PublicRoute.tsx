import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const PublicRoute = () => {
  const { currentUser } = useAuthContext();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;