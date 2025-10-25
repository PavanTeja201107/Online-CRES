/*
 * Page: VotingPage
 *
 * Allows students to vote in class elections after accepting the voting policy.
 *
 * Features:
 *   - Fetches active election and voting policy
 *   - Handles policy acceptance and vote submission
 *   - Displays error and success messages
 *
 * Usage:
 *   Rendered as part of the student dashboard routes.
 */

export default function VotingPage() {
  const [election, setElection] = useState(null);
  const [policy, setPolicy] = useState(null);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchElectionAndPolicy = async () => {
      try {
        const e = await getMyActiveElection();
        setElection(e);
        // Always fetch the global Voting Policy
        const p = await getPolicy('Voting Policy');
        setPolicy(p);
        setAccepted(!!p.accepted);
      } catch (err) {
        setError('No active election or failed to load.');
      }
      setLoading(false);
    };
    fetchElectionAndPolicy();
  }, []);

  const handleAcceptPolicy = async () => {
    try {
      await acceptPolicy('Voting Policy');
      setAccepted(true);
    } catch (err) {
      setError('Failed to accept policy.');
    }
  };

  const handleVote = async () => {
    setError('');
    setSuccess('');
    try {
      if (!candidateId) {
        setError('Select a candidate.');
        return;
      }
      if (!election) {
        setError('No active election.');
        return;
      }
      const tokenRes = await getVoteToken(election.election_id);
      const token = tokenRes.token;
      await castVote({ token, candidate_id: candidateId, election_id: election.election_id });
      setSuccess('Vote cast successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cast vote.');
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20">Loading</div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-6 py-20 text-red-600">{error}</div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-10 max-w-xl">
        <h1 className="text-2xl font-bold mb-6">Vote for Class Representative</h1>
        {policy && !accepted && (
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Voting Policy</h2>
            <div className="text-gray-700 whitespace-pre-line mb-4">{policy.policy_text}</div>
            <button
              onClick={handleAcceptPolicy}
              className="bg-indigo-600 text-white px-4 py-2 rounded"
            >
              Accept Policy
            </button>
          </div>
        )}
        {accepted && (
          <div className="mb-6 p-4 bg-white rounded shadow">
            <h2 className="text-lg font-semibold mb-2">Cast Your Vote</h2>
            <label className="block mb-3">
              Candidate ID
              <input
                value={candidateId}
                onChange={(e) => setCandidateId(e.target.value)}
                className="border p-2 w-full mt-1"
                placeholder="Enter Candidate ID"
              />
            </label>
            <button onClick={handleVote} className="bg-emerald-600 text-white px-4 py-2 rounded">
              Vote
            </button>
            {success && <div className="mt-3 text-green-600">{success}</div>}
            {error && <div className="mt-3 text-red-600">{error}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
