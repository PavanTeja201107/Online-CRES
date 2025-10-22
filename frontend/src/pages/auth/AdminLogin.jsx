/**
 * Page: AdminLogin
 *
 * Allows administrators to log in to the system using their admin ID and password.
 *
 * Features:
 *   - Handles login form and authentication
 *   - Redirects to dashboard on success
 *   - Handles last login timestamp
 *
 * Usage:
 *   Used in authentication routes for admin access.
 */
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/authApi';
import useAuth from '../../hooks/useAuth';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/ui/ToastProvider';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const { push } = useToast();

  React.useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');
    if (token) {
      if (role === 'ADMIN') {
        navigate('/admin/dashboard');
        return;
      }
      // if another role is logged in (e.g., STUDENT), clear it so admin can log in here
      if (role !== 'ADMIN') {
        try { logout(); } catch (e) { /* ignore */ }
      }
    }
  }, []);

  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      setLoading(true);
      const res = await adminLogin(adminId, password);
      
      // Extract last login timestamp from response (it's in res.user.last_login_at)
      const lastLoginAt = res.user?.last_login_at || null;
      
      // Save token via context (this will store lastLoginAt in localStorage)
      login(res.token, 'ADMIN', lastLoginAt);
      
      push('Login successful', 'success');
      
      navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      // show backend error message when credentials wrong
      setErr(error.response?.data?.error || (error.message ? error.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-20 flex justify-center">
        <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
          <h2 className="text-2xl mb-4 text-indigo-700">Administrator Sign In</h2>
          {err && <div role="alert" className="text-red-600 mb-3">{err}</div>}
          <label className="block mb-2 text-sm font-medium">Admin ID <span className="text-red-600">*</span>
            <input
              value={adminId}
              onChange={e=>setAdminId(e.target.value)}
              placeholder="Admin ID"
              aria-label="Admin ID"
              required
              className="w-full border p-2 mb-3 rounded mt-1"
            />
          </label>

          <label className="block mb-2 text-sm font-medium">Password <span className="text-red-600">*</span>
            <input
              value={password}
              onChange={e=>setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              aria-label="Password"
              required
              className="w-full border p-2 mb-5 rounded mt-1"
            />
          </label>

          <button disabled={loading || !adminId || !password} className="w-full bg-indigo-600 text-white py-2 rounded disabled:opacity-60">
            {loading ? 'Logging in...' : 'Login'}
          </button>
          <div className="mt-3 text-right">
            <a href="/admin/reset-password" className="text-sm text-indigo-600">Forgot password?</a>
          </div>
        </form>
      </div>
    </div>
  );
}
