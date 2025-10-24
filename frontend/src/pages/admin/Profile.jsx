import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getAdminProfile, updateAdminProfile } from '../../api/adminApi';
import {
  requestPasswordReset as requestResetApi,
  resetPassword as resetPasswordApi,
} from '../../api/authApi';

export default function AdminProfile() {
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  // inline reset states (mirrors student profile)
  const [otpRequested, setOtpRequested] = useState(false);
  const [otp, setOtp] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');

  const load = async () => {
    try {
      const data = await getAdminProfile();
      setProfile(data);
      setName(data.name);
      setEmail(data.email);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load');
    }
  };
  useEffect(() => {
    load();
  }, []);

  const save = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    try {
      await updateAdminProfile({ name, email });
      setMsg('Profile updated');
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update');
    }
  };

  const requestReset = async () => {
    try {
      if (!profile?.admin_id) return;
      setErr('');
      setMsg('');
      const res = await requestResetApi(profile.admin_id);
      setMsg(res?.message || 'Reset OTP sent to your Gmail. Please enter it below.');
      setOtpRequested(true);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to request');
    }
  };

  const submitReset = async (e) => {
    e.preventDefault();
    setErr('');
    setMsg('');
    if (!otp || !newPw || !confirmPw) {
      setErr('Please fill all fields');
      return;
    }
    if (newPw.length < 6) {
      setErr('Password must be at least 6 characters');
      return;
    }
    if (newPw !== confirmPw) {
      setErr('Passwords do not match');
      return;
    }
    try {
      const r = await resetPasswordApi(profile.admin_id, otp, newPw);
      setMsg(r?.message || 'Password reset successful');
      setOtp('');
      setNewPw('');
      setConfirmPw('');
      setOtpRequested(false);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to reset password');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Admin Profile</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        {msg && <div className="text-green-600 mb-2">{msg}</div>}
        {profile && (
          <div className="grid grid-cols-1 gap-6 max-w-3xl">
            <form onSubmit={save} className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">Profile Details</h2>
              <label className="block text-sm mb-2">
                Name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="border p-2 w-full mt-1"
                />
              </label>
              <label className="block text-sm mb-4">
                Email
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border p-2 w-full mt-1"
                />
              </label>
              <button className="bg-indigo-600 text-white px-4 py-2 rounded">Save</button>
            </form>

            <div className="bg-white p-4 rounded shadow">
              <h2 className="text-lg font-semibold mb-3">Reset Password</h2>
              <button
                onClick={requestReset}
                className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded"
              >
                Request Password Reset
              </button>
              {(msg || err) && (
                <div className={`mt-3 text-sm ${err ? 'text-red-600' : 'text-green-600'}`}>
                  {err || msg}
                </div>
              )}
              {otpRequested && (
                <form onSubmit={submitReset} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="text-sm">
                    OTP
                    <input
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="border p-2 w-full mt-1"
                      required
                    />
                  </label>
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="text-sm">
                      New Password
                      <input
                        type="password"
                        value={newPw}
                        onChange={(e) => setNewPw(e.target.value)}
                        placeholder="New password"
                        className="border p-2 w-full mt-1"
                        required
                      />
                    </label>
                    <label className="text-sm">
                      Confirm Password
                      <input
                        type="password"
                        value={confirmPw}
                        onChange={(e) => setConfirmPw(e.target.value)}
                        placeholder="Confirm password"
                        className="border p-2 w-full mt-1"
                        required
                      />
                    </label>
                  </div>
                  <div className="sm:col-span-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
                      Set New Password
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
