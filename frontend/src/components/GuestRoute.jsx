import { Navigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

/*
 * GuestRoute
 *
 * Purpose:
 * Redirect authenticated users to their role-specific dashboard; otherwise,
 * render the guest-only child content (used for public pages like login).
 *
 * Parameters:
 * - children: the guest page content to render when the user is not signed in.
 *
 * Return value:
 * The children when unauthenticated, or a <Navigate> redirect when authenticated.
 */
export default function GuestRoute({ children }) {
  const { user } = useAuth();

  if (user?.token && user?.role) {
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    return <Navigate to="/student/dashboard" replace />;
  }

  return children;
}
