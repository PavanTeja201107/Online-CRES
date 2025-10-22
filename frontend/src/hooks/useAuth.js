/**
 * Custom Hook: useAuth
 *
 * Provides access to the authentication context for the current user.
 *
 * Usage:
 *   const { user, login, logout } = useAuth();
 *
 * Returns:
 *   The value of AuthContext, which includes user info and auth methods.
 */
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

// simple wrapper to match older imports
export default function useAuth() {
	return useContext(AuthContext);
}
