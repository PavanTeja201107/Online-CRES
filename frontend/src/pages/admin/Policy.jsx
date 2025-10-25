/**
 * Page: AdminPolicy
 *
 * Allows administrators to view and edit the Nomination Policy and Voting Policy texts.
 *
 * Features:
 *   - Fetches all policies and filters for the two main types
 *   - Allows editing and updating policy text
 *   - Displays error and success messages
 *
 * Usage:
 *   Rendered as part of the admin dashboard routes.
 */

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import axios from '../../api/axiosInstance';

export default function AdminPolicy() {
  const [policies, setPolicies] = useState([]);
  const [editText, setEditText] = useState({});
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  // Only show the two allowed policies
  const load = async () => {
    try {
      const { data } = await axios.get('/policy/all');
      // Filter for only Nomination Policy and Voting Policy
      const filtered = (data || []).filter(
        (p) => p.name === 'Nomination Policy' || p.name === 'Voting Policy',
      );
      setPolicies(filtered);
      setEditText(Object.fromEntries(filtered.map((p) => [p.policy_id, p.policy_text])));
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load');
    }
  };
  useEffect(() => {
    load();
  }, []);

  // Update policy text/version only
  const update = async (policy) => {
    setErr('');
    setMsg('');
    try {
      await axios.put('/policy/update', {
        name: policy.name,
        policy_text: editText[policy.policy_id],
      });
      setMsg('Policy updated');
      load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Policies</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        {msg && <div className="text-green-600 mb-2">{msg}</div>}
        <div className="bg-white p-4 rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="p-2">Name</th>
                <th className="p-2">Version</th>
                <th className="p-2">Policy Text</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((p) => (
                <tr key={p.policy_id} className="border-b">
                  <td className="p-2 font-semibold">{p.name}</td>
                  <td className="p-2">{p.version}</td>
                  <td className="p-2">
                    <textarea
                      value={editText[p.policy_id] || ''}
                      onChange={(e) => setEditText({ ...editText, [p.policy_id]: e.target.value })}
                      className="border p-2 w-full h-24"
                    />
                  </td>
                  <td className="p-2">
                    <button
                      className="bg-indigo-600 text-white px-4 py-2 rounded"
                      onClick={() => update(p)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))}
              {!policies.length && (
                <tr>
                  <td className="p-2 text-gray-500" colSpan="4">
                    No policies found. Only two policies are allowed: Nomination Policy and Voting
                    Policy.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
