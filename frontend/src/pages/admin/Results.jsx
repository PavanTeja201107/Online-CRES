/**
 * Page: AdminResults
 *
 * Allows administrators to view the results of all class elections, including vote counts and visualizations.
 * Uses Chart.js for bar charts.
 *
 * Features:
 *   - Fetches and displays election results for selected election
 *   - Shows vote breakdown and statistics
 *   - Uses Chart.js for data visualization
 *
 * Usage:
 *   Rendered as part of the admin dashboard routes.
 */
import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi'; // Correct: Use getElections
import { getResults } from '../../api/voteApi';
import Alert from '../../components/ui/Alert';

// 1. Import Chart.js components
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// 2. Register the components Chart.js needs
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function AdminResults() {
  const [electionId, setElectionId] = useState('');
  const [results, setResults] = useState([]);
  const [summary, setSummary] = useState({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
  const [err, setErr] = useState('');
  const [electionsList, setElectionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [winner, setWinner] = useState(null);
  const [electionStatus, setElectionStatus] = useState('');
  const [isPublished, setIsPublished] = useState(false);

  const load = async (id) => {
    if (!id) {
      setResults([]);
      setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
      setWinner(null);
      setElectionStatus('');
      setIsPublished(false);
      return;
    }

    setIsLoading(true);
    setWinner(null);
    setElectionStatus('');
    setIsPublished(false);

    try {
      setErr('');
      const data = await getResults(id);

      // Validate response
      if (!data && !Array.isArray(data)) {
        console.error('getResults did not return valid data:', data);
        setErr('Failed to load results');
        setResults([]);
        setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
        setIsLoading(false);
        return;
      }

      // Admin API now returns { candidates, summary, status, is_published }
      let candidatesList = [];
      let statusVal = '';
      let isPublishedVal = false;

      if (Array.isArray(data)) {
        candidatesList = data;
        setSummary({ totalEligible: 0, votedCount: 0, notVotedCount: 0 });
      } else {
        candidatesList = data.candidates || [];
        setSummary(data.summary || { totalEligible: 0, votedCount: 0, notVotedCount: 0 });
        statusVal = data.status || '';
        isPublishedVal = data.is_published === true || data.is_published === 1;
      }

      setElectionStatus(statusVal);
      setIsPublished(isPublishedVal);

      // Normalize Google Drive URLs
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

      const normalizedResults = candidatesList.map((x) => ({
        ...x,
        photo_url: normalize(x.photo_url),
      }));
      setResults(normalizedResults);

      // Determine winner
      if (candidatesList.length > 0) {
        const topVotes = Math.max(...candidatesList.map((x) => x.votes));
        const potentialWinners = candidatesList.filter((x) => x.votes === topVotes);

        if (topVotes > 0 && potentialWinners.length === 1) {
          setWinner(potentialWinners[0]);
        }
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
  };

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await getElections();

        // Validate that list is an array
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

  // Prepare data for the bar chart with winner highlighting
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

  // Configure options for the chart
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
              return `${context.dataset.label}: ${votes} ${votes === 1 ? 'vote' : 'votes'}`;
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Results</h1>

        {/* --- Election Selector --- */}
        <div className="bg-white p-4 rounded shadow mb-8">
          <label htmlFor="electionSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Election
          </label>
          <select
            id="electionSelect"
            value={electionId}
            onChange={(e) => {
              setElectionId(e.target.value);
              load(e.target.value);
            }}
            className="border p-2 rounded w-full md:w-1/2"
          >
            <option value="">-- Choose --</option>
            {/* --- THIS IS THE LINE THAT WAS CHANGED --- */}
            {electionsList.map((e) => (
              <option key={e.election_id} value={e.election_id}>
                {e.title || `Election #${e.election_id}`}
                {/* Check if voting_end exists before displaying */}
                {e.voting_end ? ` — Voting ended ${new Date(e.voting_end).toLocaleString()}` : ''}
              </option>
            ))}
            {/* --- END OF CHANGE --- */}
          </select>
        </div>

        {/* --- Error Alert --- */}
        {err && (
          <Alert kind="danger" className="mb-6">
            {err}
          </Alert>
        )}

        {/* --- Loading State --- */}
        {isLoading ? (
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
        ) : results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            {/* --- Chart Column (Left) --- */}
            <div className="md:col-span-3">
              <div className="bg-white rounded shadow p-4">
                <div style={{ height: '450px' }}>
                  <Bar options={chartOptions} data={chartData} />
                </div>
              </div>
            </div>

            {/* --- Detailed Breakdown Column (Right) --- */}
            <div className="md:col-span-2">
              <h2 className="text-xl font-bold mb-3">Detailed Breakdown</h2>

              {/* Summary Stats */}
              <div className="bg-white rounded shadow p-4 mb-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Eligible</div>
                  <div className="text-lg font-semibold">{summary.totalEligible}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Voted</div>
                  <div className="text-lg font-semibold text-green-700">{summary.votedCount}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Not Voted</div>
                  <div className="text-lg font-semibold text-red-700">{summary.notVotedCount}</div>
                </div>
              </div>

              {/* Alerts */}
              {results.length > 0 && (
                <>
                  {/* Check for ties */}
                  {(() => {
                    const topVotes = Math.max(...results.map((x) => x.votes));
                    const topCandidates = results.filter((x) => x.votes === topVotes);
                    if (topVotes > 0 && topCandidates.length > 1) {
                      return (
                        <Alert kind="warning" className="mb-4">
                          <strong>Tie Detected:</strong> Multiple candidates have {topVotes}{' '}
                          {topVotes === 1 ? 'vote' : 'votes'}.
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

              {/* Candidate Results */}
              <div className="bg-white rounded shadow overflow-hidden">
                {results.map((r) => {
                  const isWinner = winner && r.candidate_id === winner.candidate_id;
                  const voteText = r.votes === 1 ? 'vote' : 'votes';

                  // Determine badge
                  let badge = null;
                  if (isWinner && isPublished) {
                    badge = { text: 'WINNER', color: 'bg-green-100 text-green-700' };
                  } else if (isWinner && electionStatus === 'voting' && !isPublished) {
                    badge = { text: 'LEADING', color: 'bg-yellow-100 text-yellow-700' };
                  }

                  return (
                    <div
                      key={r.candidate_id}
                      className={`p-4 border-b last:border-b-0 flex items-center gap-4 transition-colors ${
                        badge ? 'bg-gray-50 hover:bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* Candidate Photo */}
                      {r.photo_url ? (
                        <img
                          src={r.photo_url}
                          alt={r.candidate_name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = '/default-avatar.png';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center">
                          <svg
                            className="w-8 h-8 text-gray-500"
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
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 truncate">
                          {r.candidate_name}
                        </div>
                        <div className="text-sm text-gray-500">{r.candidate_id}</div>
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
        ) : (
          !electionId &&
          !err && (
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
              <p className="text-gray-600 text-lg">Please select an election to view results.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
