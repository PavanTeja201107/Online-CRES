/*
 * Page: VotingPage
 * 
 * Complete voting flow handling all cases:
 * 1. No active election
 * 2. Election exists but voting not started
 * 3. Election completed (treated as no active election)
 * 4. During voting window:
 *    - First time: Accept policy
 *    - Policy accepted: Don't ask again
 *    - Vote casted: Show confirmation
 */

import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyActiveElection } from '../../api/electionApi';
import { getPolicy, getPolicyStatus, acceptPolicy } from '../../api/policyApi';
import { getVoteToken, castVote, checkVoteStatus } from '../../api/voteApi';

export default function VotingPage() {
  const [election, setElection] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [token, setToken] = useState('');
  
  // Steps: no-election, not-started, policy-needed, voting, already-voted
  const [step, setStep] = useState('loading');

  useEffect(() => {
    loadVotingState();
  }, []);

  const loadVotingState = async () => {
    setLoading(true);
    setError('');
    
    try {
      // Try to get active election
      const electionData = await getMyActiveElection();
      
      if (!electionData) {
        // Case 1: No active election
        setStep('no-election');
        setLoading(false);
        return;
      }
      
      setElection(electionData);
      
      const now = new Date();
      const voteStart = new Date(electionData.voting_start);
      const voteEnd = new Date(electionData.voting_end);
      
      // Case 3: Election completed (after voting_end)
      if (now > voteEnd) {
        setStep('no-election');
        setLoading(false);
        return;
      }
      
      // Case 2: Election exists but voting not started
      if (now < voteStart) {
        setStep('not-started');
        setLoading(false);
        return;
      }
      
      // Case 4: During voting window (now >= voteStart && now <= voteEnd)
      if (!electionData.is_active) {
        setStep('no-election');
        setLoading(false);
        return;
      }
      
      // Fetch policy
      const policyData = await getPolicy('Voting Policy');
      setPolicy(policyData);
      
      // Check if user has accepted policy for THIS election
      const policyStatusData = await getPolicyStatus('Voting Policy', electionData.election_id);
      const isPolicyAccepted = !!policyStatusData.accepted;
      setPolicyAccepted(isPolicyAccepted);
      
      // FIRST: Check if user has already voted (lightweight check, no token generation)
      try {
        console.log('Checking vote status for election:', electionData.election_id);
        const voteStatus = await checkVoteStatus(electionData.election_id);
        console.log('Vote status result:', voteStatus);
        
        if (voteStatus.has_voted) {
          // User already voted - show confirmation immediately
          console.log('User has already voted, showing already-voted screen');
          setStep('already-voted');
          setLoading(false);
          return;
        }
        console.log('User has not voted yet, continuing...');
      } catch (err) {
        // If vote status check fails, continue to token check
        console.warn('Vote status check failed:', err);
      }
      
      // User hasn't voted yet - now check policy and get token if needed
      if (!isPolicyAccepted) {
        // Policy not accepted yet, show policy
        setStep('policy-needed');
      } else {
        // Policy accepted, try to get token
        try {
          const tokenRes = await getVoteToken(electionData.election_id);
          
          if (tokenRes.status === 'already_voted') {
            // Backup check - should have been caught above
            setStep('already-voted');
          } else if (tokenRes.token) {
            // Got token - ready to vote
            setToken(tokenRes.token);
            setStep('voting');
          }
        } catch (err) {
          setError(err.response?.data?.error || 'Failed to generate voting token');
        }
      }
      
    } catch (err) {
      // If getMyActiveElection fails, treat as no active election
      if (err.response?.status === 404 || err.response?.data?.error?.includes('No active election')) {
        setStep('no-election');
      } else {
        setError(err.response?.data?.error || 'Failed to load election data');
      }
    }
    
    setLoading(false);
  };

  const handleAcceptPolicy = async () => {
    setError('');
    try {
      if (!election) return;
      
      // Accept policy for this election
      await acceptPolicy('Voting Policy', election.election_id);
      setPolicyAccepted(true);
      
      // After accepting, get voting token
      const tokenRes = await getVoteToken(election.election_id);
      
      if (tokenRes.status === 'already_voted') {
        setStep('already-voted');
      } else if (tokenRes.token) {
        setToken(tokenRes.token);
        setStep('voting');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept policy');
    }
  };

  const handleVote = async () => {
    setError('');
    
    if (!candidateId.trim()) {
      setError('Please enter a candidate ID');
      return;
    }
    
    if (!token) {
      setError('No voting token available');
      return;
    }
    
    if (!election) {
      setError('No active election');
      return;
    }

    try {
      console.log('Casting vote...');
      await castVote({ 
        token, 
        candidate_id: candidateId.trim(), 
        election_id: election.election_id 
      });
      
      console.log('Vote cast successfully, updating state to already-voted');
      setStep('already-voted');
      setCandidateId('');
    } catch (err) {
      console.error('Vote cast failed:', err);
      setError(err.response?.data?.error || 'Failed to cast vote');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20">
          <div className="text-center text-gray-600">
            <div className="animate-pulse">Loading voting information...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-2xl">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Vote for Class Representative</h1>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <p className="font-medium">⚠️ Error</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Case 1 & 3: No Active Election */}
        {step === 'no-election' && (
          <div className="p-8 bg-white rounded-lg shadow-md text-center">
            <div className="text-6xl mb-4">📋</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Active Election</h2>
            <p className="text-gray-600">
              There is no active election at the moment. Please check back later.
            </p>
          </div>
        )}

        {/* Case 2: Voting Window Not Started */}
        {step === 'not-started' && election && (
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⏰</div>
              <h2 className="text-xl font-semibold text-gray-700 mb-2">Voting Window Not Started</h2>
              <p className="text-gray-600 mb-4">
                The voting period has not begun yet. Please come back during the voting window.
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Election Details:</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <p>
                  <span className="font-medium">Election:</span> {election.title || 'Class Representative Election'}
                </p>
                <p>
                  <span className="font-medium">Voting Starts:</span>{' '}
                  {new Date(election.voting_start).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
                <p>
                  <span className="font-medium">Voting Ends:</span>{' '}
                  {new Date(election.voting_end).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'short'
                  })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Case 4a: Policy Needed (First Time) */}
        {step === 'policy-needed' && policy && (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Voting Policy</h2>
            
            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200 max-h-96 overflow-y-auto">
              <p className="text-gray-700 whitespace-pre-line text-sm leading-relaxed">
                {policy.policy_text}
              </p>
            </div>
            
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-yellow-600 text-xl">⚠️</span>
                <div>
                  <p className="font-semibold text-yellow-900 mb-1">Important Notice</p>
                  <p className="text-sm text-yellow-800">
                    You must read and accept the voting policy before you can cast your vote in this election.
                    This policy applies to this election only.
                  </p>
                </div>
              </div>
            </div>
            
            <button
              onClick={handleAcceptPolicy}
              className="w-full bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              I Accept the Voting Policy
            </button>
          </div>
        )}

        {/* Case 4b: Voting Form (Policy Already Accepted) */}
        {step === 'voting' && token && (
          <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Cast Your Vote</h2>
            
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-3">
                <span className="text-green-600 text-xl">✓</span>
                <div>
                  <p className="font-semibold text-green-900 mb-1">Ready to Vote</p>
                  <p className="text-sm text-green-800">
                    Your voting token has been generated. You can now cast your vote.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Candidate ID <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={candidateId}
                  onChange={(e) => setCandidateId(e.target.value)}
                  className="w-full border border-gray-300 px-4 py-3 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none"
                  placeholder="Enter Candidate ID (e.g., CL01S0001)"
                />
              </div>

              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs text-gray-600">
                  <strong className="text-gray-700">⚠️ Important:</strong> Once you submit your vote, it cannot be changed or withdrawn. 
                  Your vote will be recorded anonymously and securely.
                </p>
              </div>

              <button
                onClick={handleVote}
                disabled={!candidateId.trim()}
                className="w-full bg-emerald-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Submit Vote
              </button>
            </div>
          </div>
        )}

        {/* Case 4c: Already Voted */}
        {step === 'already-voted' && (
          <div className="p-8 bg-white rounded-lg shadow-md">
            <div className="flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-green-600 text-4xl">✓</span>
              </div>
              
              <h2 className="text-2xl font-bold text-green-800 mb-3">Vote</h2>
              
              <p className="text-lg text-gray-700 mb-2 font-medium">
                You have already cast your vote for this election.
              </p>
              
              <p className="text-gray-600 mb-4">
                You have already cast your vote for this election
              </p>
              
              <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg w-full">
                <p className="text-sm text-green-800">
                  <strong>Thank you for participating in the democratic process!</strong>
                </p>
                <p className="text-xs text-green-700 mt-2">
                  Your vote has been recorded anonymously and cannot be changed.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
