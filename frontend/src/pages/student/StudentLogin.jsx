import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentLogin } from '../../api/authApi';

export default function StudentLogin() {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [step] = useState('login'); // keep for compatibility
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitLogin = async (e) => {
    e.preventDefault();
    setErr('');
    try {
      console.log('Submitting login for', studentId);
      setLoading(true);
      await studentLogin(studentId, password);
      // OTP sent -> go to verify page
      navigate('/student/verify-otp', { state: { studentId } });
    } catch (error) {
      setErr(error.response?.data?.error || 'Login failed');
      console.error('studentLogin error', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Student Login</h2>

        {err && <div className="text-red-600 mb-3">{err}</div>}

        {step === 'login' ? (
          <form onSubmit={submitLogin}>
            <input value={studentId} onChange={e=>setStudentId(e.target.value)} placeholder="Student ID" className="w-full border p-2 mb-3 rounded" />
            <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password" type="password" className="w-full border p-2 mb-5 rounded" />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-2 rounded disabled:opacity-60">
              {loading ? 'Sending...' : 'Send OTP'}
            </button>
          </form>
        ) : null}
      </div>
    </div>
  );
}
