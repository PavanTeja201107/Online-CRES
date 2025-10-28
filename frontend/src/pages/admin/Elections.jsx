/*
 * Page: AdminElections
 *
 * Allows administrators to create and manage elections, including setting nomination and voting periods.
 *
 * Features:
 *   - Lists all elections
 *   - Provides a form to create new elections with validation
 *   - Allows notification of voting and nomination openings
 *
 * Usage:
 *   Rendered as part of the admin dashboard routes.
 */

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import {
  getElections,
  createElection,
  notifyVotingOpen,
  notifyNominationOpen,
} from '../../api/electionApi';
import { listClasses } from '../../api/adminApi';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/ToastProvider';

export default function AdminElections() {
  const [elections, setElections] = useState([]);
  const [form, setForm] = useState({
    class_id: '',
    nomination_start: '',
    nomination_end: '',
    voting_start: '',
    voting_end: '',
  });
  const [msg, setMsg] = useState('');
  const { push } = useToast();
  const [err, setErr] = useState('');
  const [classes, setClasses] = useState([]);
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    try {
      const list = await getElections();
      setElections(list);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load');
    }
  };
  useEffect(() => {
    load();
    (async () => {
      try {
        const c = await listClasses();
        setClasses(c || []);
      } catch {}
    })();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isCreating) return;
    
    setIsCreating(true);
    setErr('');
    setMsg('');
    // client-side strict validation: ns < ne < vs < ve
    try {
      const ns = new Date(form.nomination_start);
      const ne = new Date(form.nomination_end);
      const vs = new Date(form.voting_start);
      const ve = new Date(form.voting_end);
      if (!(ns < ne && ne < vs && vs < ve)) {
        setErr(
          'Invalid timeline: ensure nomination_start < nomination_end < voting_start < voting_end',
        );
        setIsCreating(false);
        return;
      }
      await createElection(form);
      setMsg('Election created');
      setForm({
        class_id: '',
        nomination_start: '',
        nomination_end: '',
        voting_start: '',
        voting_end: '',
      });
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  // Bulk/activate/publish actions removed; automation handles lifecycle

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Elections</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        {msg && <div className="text-green-600 mb-2">{msg}</div>}

        <form
          onSubmit={submit}
          className="bg-white p-4 rounded shadow grid md:grid-cols-2 gap-3 mb-6"
        >
          <Select
            label="Class"
            required
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
          >
            <option value="">-- Select Class --</option>
            {classes.map((c) => (
              <option key={c.class_id} value={c.class_id}>
                {c.class_id} - {c.class_name}
              </option>
            ))}
          </Select>
          <Input
            label="Nomination start"
            required
            type="datetime-local"
            value={form.nomination_start}
            onChange={(e) => setForm({ ...form, nomination_start: e.target.value })}
          />
          <Input
            label="Nomination end"
            required
            type="datetime-local"
            value={form.nomination_end}
            onChange={(e) => setForm({ ...form, nomination_end: e.target.value })}
          />
          <Input
            label="Voting start"
            required
            type="datetime-local"
            value={form.voting_start}
            onChange={(e) => setForm({ ...form, voting_start: e.target.value })}
          />
          <Input
            label="Voting end"
            required
            type="datetime-local"
            value={form.voting_end}
            onChange={(e) => setForm({ ...form, voting_end: e.target.value })}
          />
          <Button
            disabled={
              !form.class_id ||
              !form.nomination_start ||
              !form.nomination_end ||
              !form.voting_start ||
              !form.voting_end ||
              isCreating
            }
          >
            {isCreating ? 'Creating...' : 'Create'}
          </Button>
        </form>

        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-100 text-left">
                {/* Select column removed */}
                <th className="p-2">ID</th>
                <th className="p-2">Class</th>
                <th className="p-2">Nomination</th>
                <th className="p-2">Voting</th>
                <th className="p-2">Active</th>
                <th className="p-2">Published</th>
                <th className="p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {elections.map((e) => (
                <tr key={e.election_id} className="border-b">
                  {/* Select checkbox removed */}
                  <td className="p-2">{e.election_id}</td>
                  <td className="p-2">
                    {(() => {
                      const c = classes.find((x) => x.class_id === e.class_id);
                      return c ? `${c.class_id} - ${c.class_name}` : e.class_id;
                    })()}
                  </td>
                  <td className="p-2">
                    {new Date(e.nomination_start).toLocaleString()} -{' '}
                    {new Date(e.nomination_end).toLocaleString()}
                  </td>
                  <td className="p-2">
                    {new Date(e.voting_start).toLocaleString()} -{' '}
                    {new Date(e.voting_end).toLocaleString()}
                  </td>
                  <td className="p-2">{e.is_active ? 'Yes' : 'No'}</td>
                  <td className="p-2">{e.is_published ? 'Yes' : 'No'}</td>
                  <td className="p-2 flex gap-2">
                    {/* Only show notification buttons, remove activate/publish */}
                    <button
                      onClick={async () => {
                        await notifyNominationOpen(e.election_id);
                        push('Nomination notifications sent', 'success');
                      }}
                      className="text-blue-600"
                    >
                      Notify Nomination
                    </button>
                    <button
                      onClick={async () => {
                        await notifyVotingOpen(e.election_id);
                        push('Voting notifications sent', 'success');
                      }}
                      className="text-blue-600"
                    >
                      Notify Voting
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Bulk publish removed as publishing is automated */}
      </div>
    </div>
  );
}
