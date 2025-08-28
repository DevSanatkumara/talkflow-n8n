import { useAuthContext } from "@/contexts/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

const PrivateRoute = () => {
  const { currentUser } = useAuthContext();

  if (!currentUser) {
    return <Navigate to="/sign-in" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;