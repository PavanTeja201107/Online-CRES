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
  const [filteredElections, setFilteredElections] = useState([]);
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

  // Search/Filter states
  const [searchClassId, setSearchClassId] = useState('');
  const [searchActive, setSearchActive] = useState('');
  const [searchPublished, setSearchPublished] = useState('');
  const [searchErr, setSearchErr] = useState('');

  const load = async () => {
    try {
      const list = await getElections();
      setElections(list);
      setFilteredElections(list);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load');
    }
  };

  const applyFilters = () => {
    // Validation: Class ID must be selected
    if (!searchClassId) {
      setSearchErr('Please select Class ID to search');
      setTimeout(() => setSearchErr(''), 3000);
      return;
    }

    setSearchErr('');
    let filtered = [...elections];

    console.log('All elections:', elections);
    console.log('Selected Class ID:', searchClassId, 'Type:', typeof searchClassId);

    // Filter by Class ID (handle both string and number comparison)
    filtered = filtered.filter((e) => {
      console.log('Comparing:', e.class_id, '(type:', typeof e.class_id, ') with', searchClassId);
      // Use loose equality to handle string vs number mismatch
      return e.class_id == searchClassId;
    });

    console.log('After class filter:', filtered);

    // Filter by Active status
    if (searchActive !== '') {
      const isActive = searchActive === 'true';
      filtered = filtered.filter((e) => {
        // Handle both boolean and number (1/0) values
        const eleActive = e.is_active === true || e.is_active === 1;
        return eleActive === isActive;
      });
    }

    // Filter by Published status
    if (searchPublished !== '') {
      const isPublished = searchPublished === 'true';
      filtered = filtered.filter((e) => {
        // Handle both boolean and number (1/0) values
        const elePublished = e.is_published === true || e.is_published === 1;
        return elePublished === isPublished;
      });
    }

    console.log('Final filtered:', filtered);
    setFilteredElections(filtered);
  };

  const resetFilters = () => {
    setSearchClassId('');
    setSearchActive('');
    setSearchPublished('');
    setSearchErr('');
    setFilteredElections(elections);
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

        {/* Create New Election Form */}
        <form
          onSubmit={submit}
          className="bg-white p-4 rounded shadow grid md:grid-cols-2 gap-3 mb-6"
        >
          <h2 className="md:col-span-2 text-lg font-semibold mb-2">Create New Election</h2>
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

        {/* Search Error Message */}
        {searchErr && <div className="text-red-600 mb-2">{searchErr}</div>}

        {/* Search/Filter Section */}
        <div className="bg-white p-4 rounded shadow mb-4">
          <h2 className="text-lg font-semibold mb-3">Search Elections</h2>
          <div className="grid md:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-sm font-medium mb-1">
                Class ID <span className="text-red-600">*</span>
              </label>
              <Select
                value={searchClassId}
                onChange={(e) => setSearchClassId(e.target.value)}
              >
                <option value="">-- Select Class --</option>
                {classes.map((c) => (
                  <option key={c.class_id} value={c.class_id}>
                    {c.class_id} - {c.class_name}
                  </option>
                ))}
              </Select>
            </div>
            <Select
              label="Active Status"
              value={searchActive}
              onChange={(e) => setSearchActive(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </Select>
            <Select
              label="Published Status"
              value={searchPublished}
              onChange={(e) => setSearchPublished(e.target.value)}
            >
              <option value="">All</option>
              <option value="true">Published</option>
              <option value="false">Not Published</option>
            </Select>
            <div className="md:col-span-3 flex gap-2">
              <Button onClick={applyFilters} disabled={!searchClassId}>
                Apply Filters
              </Button>
              <Button variant="secondary" onClick={resetFilters}>
                Reset
              </Button>
            </div>
          </div>
        </div>

        {/* Elections List Table */}
        <div className="bg-white rounded shadow overflow-auto">
          <div className="p-3 bg-gray-50 border-b">
            <span className="text-sm text-gray-600">
              Showing {filteredElections.length} of {elections.length} elections
            </span>
          </div>
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
              {filteredElections.map((e) => (
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
                    {(() => {
                      const now = Date.now();
                      const nomEnded = new Date(e.nomination_end).getTime() < now;
                      const voteEnded = new Date(e.voting_end).getTime() < now;

                      // Helper to show toast on error and success
                      const safeNotify = async (fn, id, successMsg) => {
                        try {
                          await fn(id);
                          push(successMsg, 'success');
                        } catch (err) {
                          push(err.response?.data?.error || 'Failed to send notification', 'error');
                        }
                      };

                      return (
                        <>
                          <button
                            onClick={async () => {
                              if (nomEnded) return;
                              await safeNotify(notifyNominationOpen, e.election_id, 'Nomination notifications sent');
                            }}
                            disabled={nomEnded}
                            className={`px-2 py-1 rounded text-sm font-medium ${nomEnded ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                            title={nomEnded ? 'Nomination period has ended' : 'Send nomination open notification'}
                          >
                            Notify Nomination
                          </button>

                          <button
                            onClick={async () => {
                              if (voteEnded) return;
                              await safeNotify(notifyVotingOpen, e.election_id, 'Voting notifications sent');
                            }}
                            disabled={voteEnded}
                            className={`px-2 py-1 rounded text-sm font-medium ${voteEnded ? 'text-gray-400 bg-gray-100 cursor-not-allowed' : 'text-blue-600 hover:bg-blue-50'}`}
                            title={voteEnded ? 'Voting period has ended' : 'Send voting open notification'}
                          >
                            Notify Voting
                          </button>
                        </>
                      );
                    })()}
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
