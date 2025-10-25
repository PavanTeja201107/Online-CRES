/*
 * Page: AdminDashboard
 *
 * Provides an overview dashboard for administrators, displaying statistics and quick links
 * to key management areas such as students, elections, and nominations.
 *
 * Features:
 *   - Displays statistics (students, elections, nominations)
 *   - Provides navigation links to admin features
 *   - Shows last login banner
 *
 * Usage:
 *   Rendered as the main landing page for admin users after login.
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { listStudents } from '../../api/adminApi';
import { getElections } from '../../api/electionApi';
import { listByElection } from '../../api/nominationApi';
import LastLoginBanner from '../../components/ui/LastLoginBanner';

function StatCard({ title, value, accent = 'indigo', children }) {
  const accentMap = {
    indigo: 'from-indigo-500 to-indigo-600',
    emerald: 'from-emerald-500 to-emerald-600',
    blue: 'from-blue-500 to-blue-600',
    amber: 'from-amber-500 to-amber-600',
  };
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 transition hover:shadow-xl">
      <div
        className={`absolute inset-x-0 -top-24 h-40 bg-gradient-to-b ${accentMap[accent]} opacity-10 blur-2xl transition group-hover:opacity-20`}
      />
      <div className="p-6">
        <div className="mb-3 text-sm font-semibold text-gray-500">{title}</div>
        <div className="text-4xl font-extrabold tracking-tight text-gray-900">{value}</div>
        {children}
      </div>
    </div>
  );
}

function QuickLink({ to, label, svg }) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-indigo-300 hover:bg-indigo-50/60"
    >
      <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-100 text-indigo-600">
        {svg}
      </span>
      <span className="text-sm font-semibold text-gray-800 group-hover:text-indigo-700">
        {label}
      </span>
    </Link>
  );
}

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [totals, setTotals] = useState({ students: 0, activeElections: 0, pendingNominations: 0 });
  const [pendingDetails, setPendingDetails] = useState([]);
  const [activeDetails, setActiveDetails] = useState([]);
  const [showPending, setShowPending] = useState(false);
  const [showActive, setShowActive] = useState(false);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const [students, elections] = await Promise.all([
          listStudents().catch(() => []),
          getElections().catch(() => []),
        ]);

        const activeElectionsList = (elections || []).filter((e) => !!e.is_active);
        const activeElections = activeElectionsList.length;
        const electionIds = (elections || []).map((e) => e.election_id);

        const nominationsLists = await Promise.all(
          electionIds.map((id) => listByElection(id).catch(() => [])),
        );
        const pendingNominationsList = nominationsLists
          .flat()
          .filter((n) => String(n.status || '').toUpperCase() === 'PENDING');
        const pendingNominations = pendingNominationsList.length;

        // Details for pending nominations
        const pendingDetails = pendingNominationsList.map((n) => ({
          student_id: n.student_id,
          election_id: n.election_id,
          class_id: (elections.find((e) => e.election_id === n.election_id) || {}).class_id,
        }));

        // Details for active elections (all nominations in active elections)
        const activeDetails = nominationsLists
          .flat()
          .filter((n) => activeElectionsList.some((e) => e.election_id === n.election_id))
          .map((n) => ({
            student_id: n.student_id,
            election_id: n.election_id,
            class_id: (elections.find((e) => e.election_id === n.election_id) || {}).class_id,
          }));

        if (mounted) {
          setTotals({
            students: (students || []).length,
            activeElections,
            pendingNominations,
          });
          setPendingDetails(pendingDetails);
          setActiveDetails(activeDetails);
        }
      } catch (e) {
        if (mounted) setTotals({ students: 0, activeElections: 0, pendingNominations: 0 });
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = [
    { title: 'Total Students', value: loading ? '…' : totals.students, accent: 'indigo' },
    {
      title: 'Active Elections',
      value: loading ? '…' : totals.activeElections,
      accent: 'emerald',
      onClick: () => setShowActive((v) => !v),
    },
    {
      title: 'Pending Nominations',
      value: loading ? '…' : totals.pendingNominations,
      accent: 'amber',
      onClick: () => setShowPending((v) => !v),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Navbar />
      <div className="container mx-auto px-6 py-10">
        <LastLoginBanner />
        <header className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Admin Dashboard</h1>
          <p className="mt-1 text-gray-600">
            Use the quick actions below to manage your elections ecosystem.
          </p>
        </header>

        <section className="mb-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((s) => (
            <div key={s.title} onClick={s.onClick} style={s.onClick ? { cursor: 'pointer' } : {}}>
              <StatCard title={s.title} value={s.value} accent={s.accent} />
            </div>
          ))}
        </section>

        {/* Expandable details for pending nominations */}
        {showPending && (
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold mb-3">Pending Nominations</h3>
            {pendingDetails.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2">Student ID</th>
                    <th className="p-2">Election ID</th>
                    <th className="p-2">Class ID</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDetails.map((d, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{d.student_id}</td>
                      <td className="p-2">{d.election_id}</td>
                      <td className="p-2">{d.class_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500">No pending nominations found.</div>
            )}
          </section>
        )}

        {/* Expandable details for active elections nominations */}
        {showActive && (
          <section className="mb-8 bg-white rounded-xl shadow p-6">
            <h3 className="text-lg font-bold mb-3">Active Elections - Nominated Students</h3>
            {activeDetails.length ? (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="p-2">Student ID</th>
                    <th className="p-2">Election ID</th>
                    <th className="p-2">Class ID</th>
                  </tr>
                </thead>
                <tbody>
                  {activeDetails.map((d, i) => (
                    <tr key={i} className="border-b">
                      <td className="p-2">{d.student_id}</td>
                      <td className="p-2">{d.election_id}</td>
                      <td className="p-2">{d.class_id}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-gray-500">No nominations found for active elections.</div>
            )}
          </section>
        )}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <QuickLink
              to="/admin/students"
              label="Manage Students"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12a5 5 0 100-10 5 5 0 000 10Zm-9 9a9 9 0 1118 0H3Z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/classes"
              label="Manage Classes"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M4 6a2 2 0 012-2h12a2 2 0 012 2v1H4V6Zm0 3h16v9a2 2 0 01-2 2H6a2 2 0 01-2-2V9Zm5 3h4v2H9v-2Z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/elections"
              label="Manage Elections"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 7H5a2 2 0 00-2 2v9h18V9a2 2 0 00-2-2ZM7 3h10v2H7z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/nominations"
              label="Review Nominations"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 12l2 2 4-4 1.5 1.5L11 17 7.5 13.5 9 12z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/results"
              label="View Results"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M5 3h4v18H5V3Zm5 8h4v10h-4V11Zm5-6h4v16h-4V5Z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/policy"
              label="Manage Policy"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 2h9l5 5v13a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2Zm8 1.5V8h4.5L14 3.5Z" />
                </svg>
              }
            />
            <QuickLink
              to="/admin/audit"
              label="Audit Logs"
              svg={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 8a4 4 0 110 8 4 4 0 010-8Zm0-6a10 10 0 100 20 10 10 0 000-20Z" />
                </svg>
              }
            />
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
