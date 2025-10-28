/**
 * Page: AdminClasses
 *
 * Allows administrators to view, create, and manage classes, and see students in each class.
 *
 * Features:
 *   - Lists all classes and students
 *   - Provides search and filtering
 *   - Allows creation and deletion of classes
 *
 * Usage:
 *   Rendered as part of the admin dashboard routes.
 */

import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '../../components/Navbar';
import Modal from '../../components/ui/Modal';
import { listClasses, createClass, deleteClass, listStudents } from '../../api/adminApi';

export default function AdminClasses() {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [search, setSearch] = useState('');
  const [name, setName] = useState('');
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const load = async () => {
    try {
      setErr('');
      const [cls, std] = await Promise.all([listClasses(), listStudents().catch(() => [])]);
      setClasses(cls || []);
      setStudents(std || []);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load');
    }
  };
  useEffect(() => {
    load();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    
    // Prevent multiple submissions
    if (isCreating) return;
    
    setIsCreating(true);
    setErr('');
    setMsg('');
    try {
      await createClass(name);
      setMsg('Class created');
      setName('');
      await load();
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to create');
    } finally {
      setIsCreating(false);
    }
  };

  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter(
      (c) =>
        String(c.class_id).toLowerCase().includes(q) ||
        String(c.class_name || '')
          .toLowerCase()
          .includes(q),
    );
  }, [classes, search]);

  const studentsByClass = useMemo(() => {
    const map = new Map();
    (students || []).forEach((s) => {
      const key = s.class_id || 'NONE';
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(s);
    });
    return map;
  }, [students]);

  const selectedStudents = useMemo(() => {
    if (!selectedClassId) return [];
    return studentsByClass.get(selectedClassId) || [];
  }, [studentsByClass, selectedClassId]);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const requestDelete = async (clazz) => {
    const count = (studentsByClass.get(clazz.class_id) || []).length;
    if (count > 0) {
      setPendingDelete({ ...clazz, count });
      setConfirmOpen(true);
    } else {
      // direct delete
      try {
        await deleteClass(clazz.class_id);
        if (selectedClassId === clazz.class_id) setSelectedClassId(null);
        setMsg(`Class ${clazz.class_name} deleted successfully`);
        setErr('');
        await load();
      } catch (e) {
        setErr(e.response?.data?.error || 'Failed to delete class');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Classes</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        {msg && <div className="text-green-600 mb-2">{msg}</div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Manage + List */}
          <div className="lg:col-span-1 space-y-4">
            <form onSubmit={submit} className="bg-white p-4 rounded shadow flex gap-2 items-end">
              <label className="flex-1 text-sm">
                Class name <span className="text-red-600">*</span>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Class name"
                  className="border p-2 w-full mt-1"
                  required
                />
              </label>
              <button
                disabled={!name || isCreating}
                className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCreating ? 'Adding...' : 'Add'}
              </button>
            </form>

            <div className="bg-white p-4 rounded shadow">
              <div className="mb-3">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search classes by id or name"
                  className="border p-2 w-full rounded"
                />
              </div>
              <div className="divide-y">
                {filteredClasses.map((c) => {
                  const count = (studentsByClass.get(c.class_id) || []).length;
                  const active = selectedClassId === c.class_id;
                  return (
                    <div
                      key={c.class_id}
                      className={`w-full text-left p-3 flex items-center justify-between ${active ? 'bg-indigo-50' : 'hover:bg-gray-50'} cursor-pointer`}
                      onClick={() => setSelectedClassId(c.class_id)}
                    >
                      <div>
                        <div className="font-medium">
                          {c.class_id} - {c.class_name}
                        </div>
                        <div className="text-xs text-gray-600">{count} students</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            requestDelete(c);
                          }}
                          className="text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
                {!filteredClasses.length && <div className="p-4 text-gray-600">No classes</div>}
              </div>
            </div>
          </div>

          {/* Right: Selected class details */}
          <div className="lg:col-span-2">
            {!selectedClassId ? (
              <div className="bg-white p-6 rounded shadow text-gray-600">
                Select a class to view enrolled students.
              </div>
            ) : (
              <div className="bg-white p-6 rounded shadow">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <div className="text-xl font-semibold">Class {selectedClassId}</div>
                    <div className="text-sm text-gray-600">{selectedStudents.length} students</div>
                  </div>
                </div>
                <div className="overflow-auto rounded border">
                  <table className="min-w-full divide-y">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Student ID
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Name
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-600">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {selectedStudents.map((s) => (
                        <tr key={s.student_id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-mono">{s.student_id}</td>
                          <td className="px-4 py-2 text-sm">{s.name}</td>
                          <td className="px-4 py-2 text-sm text-gray-600">{s.email}</td>
                        </tr>
                      ))}
                      {!selectedStudents.length && (
                        <tr>
                          <td colSpan="3" className="px-4 py-6 text-center text-gray-600">
                            No students in this class.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <Modal
        isOpen={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setPendingDelete(null);
        }}
        title="Delete class and all linked data?"
        footer={[
          <button
            key="cancel"
            onClick={() => {
              setConfirmOpen(false);
              setPendingDelete(null);
            }}
            className="px-4 py-2 rounded border"
          >
            Cancel
          </button>,
          <button
            key="confirm"
            onClick={async () => {
              if (!pendingDelete) return;
              try {
                await deleteClass(pendingDelete.class_id, { force: true });
                if (selectedClassId === pendingDelete.class_id) setSelectedClassId(null);
                setMsg(
                  `Class ${pendingDelete.class_name} deleted. ${pendingDelete.count} students and all related elections, nominations, and votes were removed.`,
                );
                setErr('');
                setConfirmOpen(false);
                setPendingDelete(null);
                await load(); // Wait for reload to complete
              } catch (e) {
                setErr(e.response?.data?.error || 'Failed to delete class');
                setConfirmOpen(false);
                setPendingDelete(null);
              }
            }}
            className="px-4 py-2 rounded bg-red-600 text-white"
          >
            Delete All
          </button>,
        ]}
      >
        {pendingDelete ? (
          <div className="space-y-3">
            <p>
              The class <strong>{pendingDelete.class_name}</strong> (ID: {pendingDelete.class_id})
              has <strong>{pendingDelete.count}</strong> enrolled students.
            </p>
            <p className="text-red-700">
              This destructive action will remove:
              <br />• All student accounts linked to this class
              <br />• All elections for this class (including nominations and votes)
              <br />• Related voting tokens and voter status
            </p>
            <p>All enrolled students will be notified by email (if SMTP is configured).</p>
            <p className="text-sm text-gray-600">This cannot be undone.</p>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}

// Confirmation Modal footer buttons will be rendered where component is used
