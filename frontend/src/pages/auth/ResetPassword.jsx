/*
 * Page: ResetPassword
 *
 * Allows users (students or admins) to request a password reset via OTP and set a new password.
 *
 * Features:
 *   - Step-by-step flow: request OTP, enter OTP, set new password
 *   - Handles both student and admin roles based on route or query param
 *   - Displays error and success messages
 *
 * Usage:
 *   Used in authentication routes for password recovery.
 */

import React, { useState } from 'react';
import Navbar from '../../components/Navbar';
import { requestPasswordReset, resetPassword } from '../../api/studentsApi';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [step, setStep] = useState(1);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  // Prefer role from path when visiting /admin/reset-password, fallback to ?role=admin|student, default to student
  const roleFromPath = location.pathname.startsWith('/admin/')
    ? 'admin'
    : location.pathname.startsWith('/student/')
      ? 'student'
      : null;
  const roleParam = (roleFromPath || params.get('role') || 'student').toLowerCase();
  const redirectToAdmin = roleParam === 'admin';

  const requestOtp = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      setLoading(true);
      const res = await requestPasswordReset(userId);
      setMsg(res?.message || 'OTP sent to registered email');
      setStep(2);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to request reset');
    } finally {
      setLoading(false);
    }
  };

  const validatePassword = (password) => {
    const lengthCheck = password.length >= 6;
    const specialCharCheck = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const uppercaseCheck = /[A-Z]/.test(password);
    const numberCheck = /[0-9]/.test(password);

    if (!lengthCheck) return 'Password must be at least 6 characters long';
    if (!specialCharCheck) return 'Password must contain at least one special character';
    if (!uppercaseCheck) return 'Password must contain at least one uppercase letter';
    if (!numberCheck) return 'Password must contain at least one number';

    return null;
  };

  const doReset = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');

    const validationError = validatePassword(newPassword);
    if (validationError) {
      setErr(validationError);
      return;
    }

    try {
      setLoading(true);
      const res = await resetPassword(userId, otp, newPassword);
      setMsg(res?.message || 'Password reset successful');
      setStep(3);
      // Redirect to appropriate login after a short confirmation
      setTimeout(() => {
        try {
          alert('Password reset successful. Please login with your new password.');
        } catch {}
        navigate(redirectToAdmin ? '/admin/login' : '/student/login', { replace: true });
      }, 600);
    } catch (error) {
      setErr(error.response?.data?.error || 'Failed to reset');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-20 flex justify-center">
        <div className="bg-white p-6 rounded shadow w-96">
          <h2 className="text-xl font-semibold mb-4 text-indigo-700">Reset Password</h2>
          {msg && <div className="text-green-600 mb-2">{msg}</div>}
          {err && <div className="text-red-600 mb-2">{err}</div>}

          {step === 1 && (
            <form onSubmit={requestOtp}>
              <label className="block text-sm mb-2">
                User ID <span className="text-red-600">*</span>
                <input
                  value={userId}
                  onChange={(e) => setUserId(e.target.value)}
                  placeholder="User ID"
                  className="border p-2 w-full mb-3"
                  required
                />
              </label>
              <button
                disabled={loading || !userId}
                className="bg-indigo-600 text-white w-full py-2 rounded"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={doReset}>
              <label className="block text-sm mb-2">
                OTP <span className="text-red-600">*</span>
                <input
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="OTP"
                  className="border p-2 w-full mb-3"
                  required
                />
              </label>
              <label className="block text-sm mb-2">
                New Password <span className="text-red-600">*</span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="New Password"
                  className="border p-2 w-full mb-3"
                  required
                />
              </label>
              <button
                disabled={loading || !otp || !newPassword}
                className="bg-indigo-600 text-white w-full py-2 rounded"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 3 && (
            <div className="text-sm text-gray-700">You can now login with your new password.</div>
          )}
        </div>
      </div>
    </div>
  );
}
