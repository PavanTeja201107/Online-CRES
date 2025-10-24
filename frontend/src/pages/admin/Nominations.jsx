import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi';
import axios from '../../api/axiosInstance';
import Select from '../../components/ui/Select';
import Modal from '../../components/ui/Modal';

export default function AdminNominations() {
  const [electionId, setElectionId] = useState('');
  const [noms, setNoms] = useState([]);
  const [err, setErr] = useState('');
  const [success, setSuccess] = useState('');
  const [elections, setElections] = useState([]);
  const [selectedNomination, setSelectedNomination] = useState(null);
  const [showManifestoModal, setShowManifestoModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const load = async (id) => {
    try {
      const { data } = await axios.get(`/nominations/election/${id}`);
      setNoms(data);
      setErr('');
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to load nominations');
    }
  };

  useEffect(() => {
    (async () => {
      try {
        const list = await getElections();
        setElections(list || []);
        if (list?.length) {
          setElectionId(list[0].election_id);
          load(list[0].election_id);
        }
      } catch (e) {
        setErr(e.response?.data?.error || 'Failed to load elections');
      }
    })();
  }, []);

  const handleChange = async (e) => {
    setElectionId(e.target.value);
    load(e.target.value);
  };

  const viewManifesto = (nom) => {
    setSelectedNomination(nom);
    setShowManifestoModal(true);
    setErr('');
    setSuccess('');
  };

  const handleApprove = async () => {
    if (!selectedNomination) return;

    setIsSubmitting(true);
    try {
      await axios.put(`/nominations/${selectedNomination.nomination_id}/approve`);
      setSuccess('Nomination approved successfully! Student has been notified via email.');
      setShowManifestoModal(false);
      setSelectedNomination(null);
      await load(electionId);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to approve nomination');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openRejectModal = () => {
    setShowManifestoModal(false);
    setShowRejectModal(true);
    setRejectionReason('');
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    if (!selectedNomination) return;

    setIsSubmitting(true);
    try {
      await axios.put(`/nominations/${selectedNomination.nomination_id}/reject`, {
        reason: rejectionReason.trim(),
      });
      setSuccess('Nomination rejected and student has been notified via email.');
      setShowRejectModal(false);
      setSelectedNomination(null);
      setRejectionReason('');
      await load(electionId);
    } catch (e) {
      setErr(e.response?.data?.error || 'Failed to reject nomination');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeAllModals = () => {
    setShowManifestoModal(false);
    setShowRejectModal(false);
    setSelectedNomination(null);
    setRejectionReason('');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Nominations</h1>

        {err && (
          <div className="text-red-600 mb-4 p-3 bg-red-50 rounded border border-red-200">{err}</div>
        )}

        {success && (
          <div className="text-green-600 mb-4 p-3 bg-green-50 rounded border border-green-200">
            {success}
          </div>
        )}

        <div className="bg-white p-4 rounded shadow mb-4">
          <Select label="Election" value={electionId} onChange={handleChange}>
            <option value="">-- Select Election --</option>
            {elections.map((e) => (
              <option key={e.election_id} value={e.election_id}>
                {e.election_id} - Class {e.class_id} {e.class_name ? `(${e.class_name})` : ''} —{' '}
                {new Date(e.nomination_start).toLocaleDateString()}
              </option>
            ))}
          </Select>
        </div>

        <div className="bg-white rounded shadow">
          {noms.map((n) => {
            const decided = n.status === 'APPROVED' || n.status === 'REJECTED';
            return (
              <div key={n.nomination_id} className="p-4 border-b last:border-b-0">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      {n.name || n.student_id}
                    </div>
                    <div className="text-sm text-gray-600 mb-2">Student ID: {n.student_id}</div>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
                          n.status === 'APPROVED'
                            ? 'bg-green-100 text-green-800'
                            : n.status === 'REJECTED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {n.status}
                      </span>
                    </div>
                    {n.manifesto && (
                      <button
                        onClick={() => viewManifesto(n)}
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium underline"
                      >
                        📄 View Manifesto & Review
                      </button>
                    )}
                    {n.rejection_reason && (
                      <div className="mt-2 p-3 bg-red-50 border-l-4 border-red-500 rounded text-sm">
                        <div className="flex items-start gap-2">
                          <svg
                            className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                              clipRule="evenodd"
                            />
                          </svg>
                          <div>
                            <strong className="text-red-900 block">Rejection Reason:</strong>
                            <p className="text-red-700 mt-1 whitespace-pre-wrap">
                              {n.rejection_reason}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          {!noms.length && (
            <div className="p-8 text-center text-gray-600">
              No nominations found for this election.
            </div>
          )}
        </div>

        {/* Manifesto Review Modal */}
        {showManifestoModal && selectedNomination && (
          <Modal
            isOpen={showManifestoModal}
            onClose={closeAllModals}
            title={`Review Nomination - ${selectedNomination.name || selectedNomination.student_id}`}
          >
            <div className="space-y-4">
              <div className="bg-gray-50 p-3 rounded border border-gray-200">
                <div className="text-sm text-gray-600">
                  <strong>Student ID:</strong> {selectedNomination.student_id}
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <strong>Status:</strong>{' '}
                  <span
                    className={`font-semibold ${
                      selectedNomination.status === 'APPROVED'
                        ? 'text-green-600'
                        : selectedNomination.status === 'REJECTED'
                          ? 'text-red-600'
                          : 'text-yellow-600'
                    }`}
                  >
                    {selectedNomination.status}
                  </span>
                </div>
              </div>

              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Manifesto:</div>
                <div className="border border-gray-300 rounded p-4 bg-white max-h-96 overflow-y-auto whitespace-pre-wrap text-sm">
                  {selectedNomination.manifesto || 'No manifesto provided.'}
                </div>
              </div>

              {selectedNomination.status === 'PENDING' && (
                <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={closeAllModals}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                    disabled={isSubmitting}
                  >
                    Close
                  </button>
                  <button
                    onClick={openRejectModal}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium"
                    disabled={isSubmitting}
                  >
                    ✕ Reject with Reason
                  </button>
                  <button
                    onClick={handleApprove}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? '⏳ Processing...' : '✓ Approve'}
                  </button>
                </div>
              )}

              {selectedNomination.status !== 'PENDING' && (
                <div className="flex justify-end pt-2 border-t border-gray-200">
                  <button
                    onClick={closeAllModals}
                    className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Rejection Reason Modal */}
        {showRejectModal && selectedNomination && (
          <Modal
            isOpen={showRejectModal}
            onClose={() => {
              setShowRejectModal(false);
              setShowManifestoModal(true);
            }}
            title="Provide Rejection Reason"
          >
            <div className="space-y-4">
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
                <p className="text-sm text-yellow-800">
                  <strong>⚠️ Important:</strong> The rejection reason will be sent to the student
                  via email.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Enter a clear and constructive reason for rejection..."
                  className="w-full border border-gray-300 rounded p-3 min-h-[140px] focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                  required
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  Be specific and professional. The student will receive this in their email.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setShowManifestoModal(true);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 font-medium"
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={!rejectionReason.trim() || isSubmitting}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '⏳ Sending...' : '✓ Confirm Rejection'}
                </button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
}
