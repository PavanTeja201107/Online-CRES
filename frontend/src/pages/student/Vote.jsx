/**
 * Page: Vote
 *
 * Allows students to cast their vote in active class elections, view candidates, and accept voting policy.
 *
 * Features:
 *   - Fetches active election and approved candidates
 *   - Handles voting token and submission
 *   - Displays policy and error/success messages
 *
 * Usage:
 *   Rendered as part of the student dashboard routes.
 */

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyActiveElection } from '../../api/electionApi';
import { listApprovedByElection } from '../../api/nominationApi';
import { getVoteToken, castVote } from '../../api/voteApi';
import { getPolicy, acceptPolicy } from '../../api/policyApi';

export default function VotePage() {
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [token, setToken] = useState('');
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [showPolicy, setShowPolicy] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [alreadyVoted, setAlreadyVoted] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const e = await getMyActiveElection();
        setElection(e);
        
        // Fetch candidates with manifesto
        const list = await listApprovedByElection(e.election_id);
        const normalize = (url) => {
          try {
            if (!url) return url;
            let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
            if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
            m = url.match(/[?&]id=([^&]+)/);
            if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
            return url;
          } catch {
            return url;
          }
        };
        setCandidates((list || []).map(c => ({ ...c, photo_url: normalize(c.photo_url) })));
        
        try {
          const p = await getPolicy('Voting Policy');
          setPolicy(p);
        } catch {}
      } catch (error) {
        setErr(error.response?.data?.error || 'No active election');
      } finally {
        setCheckingStatus(false);
      }
    })();
  }, []);

  const getToken = async () => {
    try {
      if (!election) return;

      // Check policy acceptance BEFORE getting token
      if (policy && !accepted) {
        setShowPolicy(true);
        return;
      }

      const res = await getVoteToken(election.election_id);
      
      // Check if response indicates already voted
      if (res.status === 'already_voted') {
        setAlreadyVoted(true);
        setErr('You have already cast your vote for this election.');
        return;
      }
      
      setToken(res.token);
      setMsg('Token issued. You can now cast your vote.');
    } catch (e) {
      const apiErr = e.response?.data?.error || 'Failed to get token';
      setErr(apiErr);
      if (apiErr.toLowerCase().includes('already voted')) {
        setAlreadyVoted(true);
      }
    }
  };

  const vote = async () => {
    setErr('');
    setMsg('');
    setLoading(true);
    try {
      if (!election || !selectedCandidateId || !token) {
        setErr('Please select a candidate and obtain a token.');
        return;
      }
      
      const res = await castVote({
        token,
        candidate_id: selectedCandidateId,
        election_id: election.election_id
      });
      
      setMsg(res?.message || 'Your vote was recorded successfully');
      setToken('');
      setSelectedCandidateId('');
      setAlreadyVoted(true);
    } catch (e) {
      const apiErr = e.response?.data?.error || 'Failed to cast vote';
      setErr(apiErr);
      if (apiErr.toLowerCase().includes('already voted')) {
        setAlreadyVoted(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-8">
          <div className="text-center text-gray-600">Loading election status...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-semibold mb-4">Vote</h1>

        {/* Error and Success Messages */}
        {err && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {err}
          </div>
        )}
        {msg && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
            {msg}
          </div>
        )}

        {/* Already Voted Message */}
        {alreadyVoted && (
          <div className="bg-indigo-50 border-2 border-indigo-300 rounded-lg p-6 text-center">
            <svg
              className="mx-auto h-12 w-12 text-indigo-600 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 className="text-xl font-semibold text-indigo-900 mb-2">
              You have already cast your vote for this election
            </h2>
            <p className="text-indigo-700">
              Thank you for participating in the democratic process!
            </p>
          </div>
        )}

        {/* Election Info and Get Token Button */}
        {!alreadyVoted && election && (
          <div className="bg-white p-4 rounded shadow mb-6">
            <div className="mb-3">
              <strong className="text-gray-700">Election ID:</strong>{' '}
              <span className="text-gray-900">{election.election_id}</span>
            </div>
            <button
              onClick={getToken}
              disabled={!!token}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {token ? 'Token Issued' : 'Get Token'}
            </button>
          </div>
        )}

        {/* Candidate List - Simplified Radio Button UI */}
        {!alreadyVoted && token && candidates.length > 0 && (
          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              Select Your Candidate
            </h2>
            
            {candidates.map(c => (
              <div
                key={c.student_id}
                className={`bg-white border-2 rounded-lg p-4 transition-all ${
                  selectedCandidateId === c.student_id
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-gray-200 hover:border-indigo-300'
                }`}
              >
                <label
                  htmlFor={`candidate-${c.student_id}`}
                  className="flex items-center gap-4 cursor-pointer"
                >
                  {/* Radio Button */}
                  <input
                    type="radio"
                    id={`candidate-${c.student_id}`}
                    name="candidate"
                    value={c.student_id}
                    checked={selectedCandidateId === c.student_id}
                    onChange={() => setSelectedCandidateId(c.student_id)}
                    className="w-5 h-5 text-indigo-600 focus:ring-indigo-500"
                  />

                  {/* Candidate Photo */}
                  {c.photo_url ? (
                    <img
                      src={c.photo_url}
                      alt={c.name}
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/default-avatar.png';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg
                        className="w-10 h-10 text-gray-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}

                  {/* Candidate Info */}
                  <div className="flex-1">
                    <div className="font-semibold text-lg text-gray-900">
                      {c.name}
                    </div>
                    <div className="text-sm text-gray-500 font-medium">
                      ID: {c.student_id}
                    </div>
                    {c.manifesto && (
                      <p className="text-sm text-gray-600 mt-1 line-clamp-3">
                        {c.manifesto}
                      </p>
                    )}
                  </div>
                </label>
              </div>
            ))}
          </div>
        )}

        {/* Submit Vote Button */}
        {!alreadyVoted && token && (
          <div className="mt-6">
            <button
              onClick={vote}
              disabled={loading || !selectedCandidateId || !token}
              className="bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Vote'}
            </button>
          </div>
        )}

        {/* Policy Modal */}
        {showPolicy && policy && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded shadow max-w-2xl w-full p-6">
              <h2 className="text-lg font-semibold mb-3">Voting Policy</h2>
              <div className="h-64 overflow-auto border p-3 whitespace-pre-wrap text-sm mb-4 bg-gray-50">
                {policy.policy_text}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowPolicy(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await acceptPolicy('Voting Policy');
                      setAccepted(true);
                      setShowPolicy(false);
                      setMsg('Policy accepted. Please click "Get Token" again to proceed.');
                    } catch (e) {
                      setErr(e.response?.data?.error || 'Failed to accept policy');
                    }
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  I Accept
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
