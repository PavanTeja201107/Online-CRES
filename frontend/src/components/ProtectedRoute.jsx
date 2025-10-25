import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/*
 * ProtectedRoute
 *
 * Purpose:
 * Guard routes by checking authentication and optional role authorization.
 *
 * Parameters:
 * - role (string): optional required role for the route.
 * - children (node): the protected content to render when allowed.
 *
 * Return value:
 * Returns the children when the user is authorized, otherwise redirects.
 */
export default function ProtectedRoute({ role, children }) {
  const { user } = useAuth();

  if (!user?.token) return <Navigate to="/" replace />;
  if (role && user.role !== role) {
    /*
     * If the current user has a token but not the required role,
     * send them to their own dashboard instead of the generic root.
     */
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}
