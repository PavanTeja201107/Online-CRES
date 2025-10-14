import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../../api/authApi';
import { useAuth } from '../../context/AuthContext';

export default function AdminLogin() {
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const submit = async e => {
    e.preventDefault();
    setErr('');
    try {
      setLoading(true);
      const res = await adminLogin(adminId, password);
  // save token via context
  login(res.token, 'ADMIN');
  navigate('/admin/dashboard');
    } catch (error) {
      console.error(error);
      setErr(error.response?.data?.error || (error.message ? error.message : 'Login failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-8 rounded shadow w-full max-w-md">
        <h2 className="text-2xl mb-4">Admin Login</h2>
        {err && <div role="alert" className="text-red-600 mb-3">{err}</div>}
        <label className="block mb-2 text-sm font-medium">Admin ID
          <input
            value={adminId}
            onChange={e=>setAdminId(e.target.value)}
            placeholder="Admin ID"
            aria-label="Admin ID"
            required
            className="w-full border p-2 mb-3 rounded mt-1"
          />
        </label>

        <label className="block mb-2 text-sm font-medium">Password
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

        <button disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60">
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
