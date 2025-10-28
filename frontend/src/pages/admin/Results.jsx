/**
 * Page: AdminResults
 *
 * Allows administrators to view the results of all class elections.
 *
 * Features:
 * - Fetches and displays election results for selected election.
 * - NEW: Shows a "Live Turnout" pie chart for 'voting' elections
 * to hide candidate counts and prevent bias.
 * - Shows final candidate vote counts and bar chart for 'completed' elections.
 * - Uses Chart.js for data visualization (Bar and Pie).
 * - NEW: Live-polls for updates every 5 seconds during an active election.
 */
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi';
import { getResults } from '../../api/voteApi';
import Alert from '../../components/ui/Alert';

// Chart.js imports for Bar and Pie charts
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
);

/**
 * LiveTurnoutView Component
 * 
 * Displays real-time voting turnout statistics during active elections.
 * Shows pie chart and statistics to prevent bias by hiding candidate-specific results.
 * 
 * @param {Object} summary - Voting summary containing totalEligible, votedCount, notVotedCount
 */
function LiveTurnoutView({ summary }) {
  const { totalEligible, votedCount, notVotedCount } = summary;

  // Handle division by zero if no students are eligible
  const percentageCasted =
    totalEligible > 0 ? (votedCount / totalEligible) * 100 : 0;

  const pieData = {
    labels: ['Votes Casted', 'Votes Not Casted'],
    datasets: [
      {
        data: [votedCount, notVotedCount],
        backgroundColor: [
          'rgba(75, 192, 192, 0.8)', 
          // Green/Teal for casted
          'rgba(255, 99, 132, 0.8)', 
          // Red for not casted
        ],
        borderColor: ['#FFFFFF', '#FFFFFF'],
        borderWidth: 2,
      },
    ],
  };

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Live Election Turnout',
        font: {
          size: 18,
          weight: 'bold',
        },
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.raw || 0;
            const percentage =
              totalEligible > 0
                ? ((value / totalEligible) * 100).toFixed(1)
                : 0;
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className="bg-white rounded shadow p-6 md:p-8">
      <h2 className="text-xl font-bold mb-3 text-center">
         Live Election Dashboard
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
        {/* Stats Column */}
        <div className="text-center md:text-left">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">
            Turnout Statistics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-600">Total Eligible Students:</span>
              <span className="font-bold text-lg text-gray-900">
                {totalEligible}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-green-50 rounded-lg">
              <span className="text-green-700">Total Votes Casted:</span>
              <span className="font-bold text-lg text-green-700">
                {votedCount}
              </span>
            </div>
            <div className="flex justify-between p-3 bg-red-50 rounded-lg">
              <span className="text-red-700">Total Votes Not Casted:</span>
              <span className="font-bold text-lg text-red-700">
                {notVotedCount}
              </span>
            </div>
          </div>
          <div className="mt-6 text-center">
            <span className="text-3xl font-bold text-indigo-600">
              {percentageCasted.toFixed(2)}%
            </span>
            <span className="text-gray-600 block text-lg">Turnout</span>
          </div>
        </div>

        {/* Pie Chart Column */}
        <div style={{ height: '350px' }}>
          {/* Add a key so the Pie fully re-mounts when counts change to ensure chart updates */}
          <Pie
            key={`${votedCount}-${notVotedCount}`}
            data={pieData}
            options={pieOptions}
          />
        </div>
      </div>
    </div>
  );
}

export default function AdminResults() {
  const [electionId, setElectionId] = useState('');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({
    totalEligible: 0,
    votedCount: 0,
    notVotedCount: 0,
  });
  const [err, setErr] = useState('');
  const [electionsList, setElectionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [winner, setWinner] = useState(null);
  const [electionStatus, setElectionStatus] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  /**
   * Loads election results and summary data
   * Wrapped in useCallback for stable reference in polling useEffect
   */
  const load = useCallback(async (id) => {
    if (!id) {
      setResults([]);
      setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
      setWinner(null);
      setElectionStatus('');
      setIsPublished(false);
      return;
    }

    setIsLoading(true);

    // Only reset winner/status state on election change, not on every poll
    if (id !== electionId) {
      setWinner(null);
      setElectionStatus('');
      setIsPublished(false);
    }

    try {
      setErr('');
      const data = await getResults(id);

      // Validate API response structure
      if (!data && !Array.isArray(data)) {
        console.error('getResults did not return valid data:', data);
        setErr('Failed to load results');
        setResults([]);
        setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
        setIsLoading(false);
        return;
      }

      // Parse API response (supports both array and object structures)
      let candidatesList = [];
      let statusVal = '';
      let isPublishedVal = false;

      if (Array.isArray(data)) {
        // Legacy API structure
        candidatesList = data;
        setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
      } else {
        // Current API structure with candidates, summary, status, and is_published
        candidatesList = data.candidates || [];
        setSummary(
          data.summary || { totalEligible: 0, votedCount: 0, notVotedCount: 0 },
        );
        statusVal = data.status || '';
        isPublishedVal = data.is_published === true || data.is_published === 1;
      }

      // Normalize backend status strings to frontend-friendly values
      // Maps: 'VOTING' -> 'voting', 'CLOSED' -> 'completed', etc.
      const normalizeStatus = (s) => {
        if (!s) return '';
        const lower = String(s).toLowerCase();
        if (lower === 'closed') return 'completed';
        if (lower === 'voting') return 'voting';
        if (lower === 'nomination') return 'nomination';
        if (lower === 'upcoming') return 'upcoming';
        return lower;
      };

      setElectionStatus(normalizeStatus(statusVal));
      setIsPublished(isPublishedVal);
      setResults(candidatesList);

      // Calculate winner from results
      if (candidatesList.length > 0) {
        const topVotes = Math.max(...candidatesList.map((x) => x.votes));
        const potentialWinners = candidatesList.filter(
          (x) => x.votes === topVotes,
        );

        if (topVotes > 0 && potentialWinners.length === 1) {
          setWinner(potentialWinners[0]);
        } else {
          setWinner(null);
        }
      } else {
        setWinner(null);
      }
    } catch (e) {
      console.error('Error loading results:', e);
      setResults([]);
      setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
      setErr(e.response?.data?.error || 'Failed to load results');
      setWinner(null);
      setElectionStatus('');
      setIsPublished(false);
    } finally {
      setIsLoading(false);
    }
  }, [electionId]);

  // Load elections list on component mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await getElections();

        if (!Array.isArray(list)) {
          console.error('getElections did not return an array:', list);
          setErr('Failed to load elections');
          setElectionsList([]);
          setIsLoading(false);
          return;
        }

        setElectionsList(list);
      } catch (e) {
        console.error('Error loading elections:', e);
        setErr(e.response?.data?.error || 'Failed to load elections list.');
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  /**
   * Live polling effect for active elections
   * Polls every 5 seconds when election is in 'voting' state and unpublished
   */
  useEffect(() => {
    // Only poll during active voting that hasn't been published
    if (electionId && electionStatus === 'voting' && !isPublished) {
      const pollInterval = setInterval(() => {
        console.log('Polling for live results...');
        load(electionId);
      }, 5000);

      // Cleanup: Stop polling when conditions change or component unmounts
      return () => {
        console.log('Stopping live results polling.');
        clearInterval(pollInterval);
      };
    }
  }, [electionId, electionStatus, isPublished, load]);

  // Prepare bar chart data
  const chartData = useMemo(() => {
    if (!results || results.length === 0) {
      return null;
    }

    const winnerId = winner?.candidate_id;
    const showWinner = isPublished && winner;

    return {
      labels: results.map((r) => `${r.candidate_name} (${r.candidate_id})`),
      datasets: [
        {
          label: 'Total Votes',
          data: results.map((r) => r.votes),
          backgroundColor: results.map((r) =>
            showWinner && r.candidate_id === winnerId
              ? 'rgba(34, 197, 94, 0.6)'
              : 'rgba(79, 70, 229, 0.6)',
          ),
          borderColor: results.map((r) =>
            showWinner && r.candidate_id === winnerId
              ? 'rgba(34, 197, 94, 1)'
              : 'rgba(79, 70, 229, 1)',
          ),
          borderWidth: 1,
        },
      ],
    };
  }, [results, winner, isPublished]);

  // Configure bar chart options
  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 750,
        easing: 'easeInOutQuart',
      },
      plugins: {
        legend: {
          display: false,
        },
        title: {
          display: true,
          text: 'Election Results',
          font: {
            size: 18,
            weight: 'bold',
          },
          padding: {
            bottom: 20,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const votes = context.parsed.y;
              return `${context.dataset.label}: ${votes} ${
                votes === 1 ? 'vote' : 'votes'
              }`;
            },
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
            callback: function (value) {
              return `${value} ${value === 1 ? 'vote' : 'votes'}`;
            },
          },
          grid: {
            display: true,
            color: 'rgba(0, 0, 0, 0.1)',
          },
        },
        x: {
          grid: {
            display: false,
          },
        },
      },
    }),
    [],
  );

  /**
   * Renders appropriate content based on election status and loading state
   */
  const renderContent = () => {
    // Show loading skeleton on initial load only (not during background polls)
    if (isLoading && summary.totalEligible === 0 && !err) {
      return (
        <div className="space-y-4">
          <div className="bg-white rounded shadow p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-64 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
            <p className="text-center text-gray-500 mt-4">Loading results...</p>
          </div>
        </div>
      );
    }

    // No election selected state
    if (!electionId && !err) {
      return (
        <div className="bg-white rounded shadow p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-gray-600 text-lg">
            Please select an election to view results.
          </p>
        </div>
      );
    }

    // Live election: Show turnout dashboard instead of candidate results
    if (electionStatus === 'voting' && !isPublished) {
      return <LiveTurnoutView summary={summary} />;
    }

    // Completed election: Show final results with bar chart and candidate breakdown
    if (
      (electionStatus === 'completed' || isPublished) &&
      results.length > 0
    ) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Chart Column (Left) */}
          <div className="md:col-span-3">
            <div className="bg-white rounded shadow p-4">
              <div style={{ height: '450px' }}>
                <Bar options={chartOptions} data={chartData} />
              </div>
            </div>
          </div>

          {/* Detailed Breakdown Column (Right) */}
          <div className="md:col-span-2">
            <h2 className="text-xl font-bold mb-3">Detailed Breakdown</h2>

            {/* Summary Stats */}
            <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-3 gap-3 text-center">
              {/* (Your existing summary code...) */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Eligible</div>
                <div className="text-lg font-semibold">
                  {summary.totalEligible}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Voted</div>
                <div className="text-lg font-semibold text-green-700">
                  {summary.votedCount}
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Not Voted</div>
                <div className="text-lg font-semibold text-red-700">
                  {summary.notVotedCount}
                </div>
              </div>
            </div>

            {/* Results alerts (tie detection, winner announcement) */}
            {results.length > 0 && (
              <>
                {/* Check for ties */}
                {(() => {
                  const topVotes = Math.max(...results.map((x) => x.votes));
                  const topCandidates = results.filter(
                    (x) => x.votes === topVotes,
                  );
                  if (topVotes > 0 && topCandidates.length > 1) {
                    return (
                      <Alert kind="warning" className="mb-4">
                        <strong>Tie Detected:</strong> Multiple candidates have{' '}
                        {topVotes} {topVotes === 1 ? 'vote' : 'votes'}.
                      </Alert>
                    );
                  }
                })()}

                {/* Check if all candidates have zero votes */}
                {results.every((x) => x.votes === 0) && (
                  <Alert kind="info" className="mb-4">
                    No votes have been cast yet in this election.
                  </Alert>
                )}
              </>
            )}

            {/* Candidate Results (Your existing candidate list code...) */}
            <div className="bg-white rounded shadow overflow-hidden">
              {results.map((r) => {
                const isWinner = winner && r.candidate_id === winner.candidate_id;
                const voteText = r.votes === 1 ? 'vote' : 'votes';
                let badge = null;

                if (isWinner && isPublished) {
                  badge = {
                    text: 'WINNER',
                    color: 'bg-green-100 text-green-700',
                  };
                } else if (
                  isWinner &&
                  electionStatus === 'voting' &&
                  !isPublished
                ) {
                  // Fallback: Shouldn't reach here with conditional rendering above
                  badge = {
                    text: 'LEADING',
                    color: 'bg-yellow-100 text-yellow-700',
                  };
                }

                return (
                  <div
                    key={r.candidate_id}
                    className={`p-4 border-b last:border-b-0 flex items-center gap-4 transition-colors ${
                      badge
                        ? 'bg-gray-50 hover:bg-gray-100'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* Candidate Photo */}
                    <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center">
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

                    {/* Candidate Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {r.candidate_name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {r.candidate_id}
                      </div>
                    </div>

                    {/* Vote Count */}
                    <div className="text-right">
                      <div
                        className={`font-bold text-xl ${
                          badge
                            ? badge.text === 'WINNER'
                              ? 'text-green-700'
                              : 'text-yellow-700'
                            : 'text-indigo-700'
                        }`}
                      >
                        {r.votes}
                      </div>
                      <div className="text-xs text-gray-500">{voteText}</div>
                    </div>

                    {/* Badge */}
                    {badge && (
                      <div
                        className={`${badge.color} px-3 py-1 rounded-full text-sm font-semibold`}
                      >
                        {badge.text}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Fallback: Election in other state (pending, nomination, etc.) or no results available
    if (!err) {
      return (
        <div className="bg-white rounded shadow p-8 text-center">
          <p className="text-gray-600 text-lg">
            {electionStatus === 'pending'
              ? 'This election has not started yet.'
              : 'Results are not yet available for this election.'}
          </p>
        </div>
      );
    }

    // If err is present, this will return null, and only the <Alert>
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Results</h1>

        {/* Election Selector */}
        <div className="bg-white p-4 rounded shadow mb-8">
          <label
            htmlFor="electionSelect"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Select Election
          </label>
          <select
            id="electionSelect"
            value={electionId}
            onChange={(e) => {
              const newId = e.target.value;
              setElectionId(newId);
              load(newId);
            }}
            className="border p-2 rounded w-full"
          >
            <option value="">-- Choose --</option>
            {electionsList.map((e) => {
              const now = new Date();
              const votingEnd = e.voting_end ? new Date(e.voting_end) : null;
              let statusText = '';
              
              if (votingEnd) {
                statusText = now > votingEnd 
                  ? ` — Voting ended ${votingEnd.toLocaleString()}`
                  : ` — Voting ends ${votingEnd.toLocaleString()}`;
              }
              
              return (
                <option key={e.election_id} value={e.election_id}>
                  {e.title || `Election #${e.election_id}`}{statusText}
                </option>
              );
            })}
          </select>
        </div>

        {/* Error Alert */}
        {err && (
          <Alert kind="danger" className="mb-6">
            {err}
          </Alert>
        )}

        {/* Render Content based on state */}
        {renderContent()}
      </div>
    </div>
  );
}