import {Navigate, Outlet} from "react-router-dom";
import {useAuth} from "../Context/AuthContext";

const ProtectedRoute = ({children, allowedRoles}) => {
  const {user, loading} = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) {
    return <Navigate to="/login" />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children || <Outlet />;
};

export default ProtectedRoute;