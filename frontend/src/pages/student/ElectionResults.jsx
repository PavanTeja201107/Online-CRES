/**
 * Page: ElectionResults
 *
 * Allows students to view the results of their class elections, including winner, vote counts,
 * and visualizations. Uses Chart.js for bar charts and confetti for winner celebration.
 *
 * Features:
 *   - Fetches and displays election results
 *   - Shows winner and vote breakdown
 *   - Displays confetti animation for winners
 *   - Uses Chart.js for data visualization
 *
 * Usage:
 *   Rendered as part of the student dashboard routes.
 */

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { getMyElections } from '../../api/electionApi'; // Use getMyElections for Student
import { getResults } from '../../api/voteApi';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Confetti from 'react-confetti'; // Import Confetti
import useWindowSize from 'react-use/lib/useWindowSize'; // Import useWindowSize

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
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function ResultsPage() {
    const [electionId, setElectionId] = useState('');
    const [elections, setElections] = useState([]);
    const [results, setResults] = useState([]);
    const [err, setErr] = useState('');
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Add loading state

    // Get window size for confetti effect
    const { width, height } = useWindowSize();

    // Effect to load student-specific, published elections
    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                const list = await getMyElections();
                if (!list || !Array.isArray(list)) {
                    throw new Error('Invalid response format');
                }
                setElections(list);
                
                // Filter published elections and sort by voting_end date (most recent first)
                const published = list
                    .filter(e => e.is_published)
                    .sort((a, b) => new Date(b.voting_end) - new Date(a.voting_end));
                
                if (published.length) {
                    setElectionId(String(published[0].election_id));
                } else if (list.length > 0) {
                    setMessage("No election results have been published yet.");
                }
            } catch (error) {
                console.error('Election load error:', error);
                setErr(error.response?.data?.error || 'Could not load elections.');
                setElections([]);
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    // Effect to load results when electionId changes, and determine winner/tie
    useEffect(() => {
        const load = async () => {
            if (!electionId) {
                setResults([]);
                setMessage('');
                setWinner(null);
                return;
            }

            setIsLoading(true);
            setResults([]);
            setMessage('');
            setWinner(null);
            setErr('');

            try {
                const r = await getResults(electionId);
                if (!r || !Array.isArray(r)) {
                    throw new Error('Invalid results format');
                }
                
                setResults(r);

                if (r.length === 0) {
                    setMessage('No votes were recorded for this election.');
                } else {
                    // Calculate total votes and top votes
                    const totalVotes = r.reduce((sum, x) => sum + x.votes, 0);
                    const topVotes = Math.max(...r.map(x => x.votes));
                    const potentialWinners = r.filter(x => x.votes === topVotes);

                    if (totalVotes === 0) {
                        setMessage('No votes recorded. Faculty advisor and HOD will decide next steps.');
                    } else if (potentialWinners.length === 1 && topVotes > 0) {
                        setWinner(potentialWinners[0]);
                        setMessage(`🎉 Congratulations ${potentialWinners[0].candidate_name}! 🎉`);
                    } else if (potentialWinners.length > 1 && topVotes > 0) {
                        setMessage(`Tie detected between ${potentialWinners.length} candidates with ${topVotes} votes each. Faculty advisor and HOD will resolve.`);
                    }
                }
            } catch (error) {
                console.error('Results load error:', error);
                setWinner(null);
                setResults([]);
                setErr(error.response?.data?.error || 'Could not load results for this election.');
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [electionId]); // Rerun when electionId changes

    // 3. Prepare data for the bar chart
    const chartData = useMemo(() => {
        if (!results || results.length === 0) return null;
        
        // Create gradient colors based on winner status
        const getBackgroundColor = (index) => {
            const result = results[index];
            if (winner && winner.candidate_id === result.candidate_id) {
                return 'rgba(34, 197, 94, 0.6)'; // Green for winner
            }
            return 'rgba(79, 70, 229, 0.6)'; // Default indigo
        };

        const getBorderColor = (index) => {
            const result = results[index];
            if (winner && winner.candidate_id === result.candidate_id) {
                return 'rgba(34, 197, 94, 1)'; // Solid green for winner
            }
            return 'rgba(79, 70, 229, 1)'; // Default solid indigo
        };

        return {
            labels: results.map(r => `${r.candidate_name} (${r.candidate_id})`),
            datasets: [{
                label: 'Total Votes',
                data: results.map(r => r.votes),
                backgroundColor: results.map((_, index) => getBackgroundColor(index)),
                borderColor: results.map((_, index) => getBorderColor(index)),
                borderWidth: 1,
                borderRadius: 4,
            }],
        };
    }, [results, winner]);

    // 4. Configure options for the chart
    const chartOptions = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: {
                display: true,
                text: 'Election Results',
                font: { size: 18, weight: 'bold' },
                padding: { bottom: 20 }
            },
            tooltip: {
                callbacks: {
                    label: (context) => {
                        const votes = context.parsed.y;
                        return `${votes} vote${votes === 1 ? '' : 's'}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    callback: (value) => `${value} vote${value === 1 ? '' : 's'}`
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            x: {
                grid: {
                    display: false
                }
            }
        },
        animation: {
            duration: 750,
            easing: 'easeInOutQuart'
        }
    }), []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Render Confetti if there is a winner */}
            {winner && <Confetti width={width} height={height} recycle={false} numberOfPieces={300} />}

            <Navbar />
            <div className="container mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold mb-4">Results</h1>
                
                {/* --- Election Selector Dropdown --- */}
                <div className="mb-4 bg-white p-4 rounded shadow">
                    <Select label="Select Election" value={electionId} onChange={e => setElectionId(e.target.value)} aria-label="Select published election to view results">
                        <option value="">-- Choose --</option>
                        {/* Only map over published elections */}
                        {(elections || []).filter(e => e.is_published).map(e => (
                            <option key={e.election_id} value={e.election_id}>
                                {e.title || `Election #${e.election_id}`} — Voting ended {new Date(e.voting_end).toLocaleString()}
                            </option>
                        ))}
                    </Select>
                     {/* Show message if no published elections are available */}
                     {(elections || []).length > 0 && (elections || []).filter(e => e.is_published).length === 0 && !err && (
                        <p className="text-sm text-gray-500 mt-2">No election results have been published yet.</p>
                     )}
                </div>

                {/* --- Alerts for errors, messages (winner/tie/no votes) --- */}
                {err && <Alert kind="danger" className="mb-3">{err}</Alert>}
                {/* Use success alert for winner message, warning otherwise */}
                {message && <Alert kind={winner ? "success" : "warning"} className="mb-3">{message}</Alert>}

                {/* --- Main Content Grid (Chart and Details) --- */}
                {isLoading ? (
                    <div className="bg-white rounded shadow p-8">
                        <div className="animate-pulse space-y-8">
                            {/* Chart skeleton */}
                            <div className="md:col-span-3">
                                <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
                                <div className="h-64 bg-gray-100 rounded w-full"></div>
                            </div>
                            {/* Detailed breakdown skeleton */}
                            <div className="space-y-4">
                                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-100 rounded-full"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                            <div className="h-3 bg-gray-100 rounded w-1/2 mt-2"></div>
                                        </div>
                                        <div className="h-8 bg-gray-200 rounded w-16"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : results.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                        {/* --- Chart Column (Left) --- */}
                        <div className="md:col-span-3">
                            <div className="bg-white rounded shadow p-4">
                                <div style={{ height: '400px', position: 'relative' }}>
                                    <Bar options={chartOptions} data={chartData} />
                                </div>
                            </div>
                        </div>

                        {/* --- Detailed Breakdown Column (Right) --- */}
                        <div className="md:col-span-2">
                            <h2 className="text-xl font-bold mb-3">Detailed Breakdown</h2>
                            <div className="bg-white rounded shadow divide-y">
                                {results.map(r => (
                                    <div 
                                      key={r.candidate_id} 
                                      className={`p-4 flex items-center gap-4 transition-colors ${
                                        winner && winner.candidate_id === r.candidate_id 
                                          ? 'bg-green-50 hover:bg-green-100' 
                                          : 'hover:bg-gray-50'
                                      }`}
                                    >
                                       {r.photo_url ? (
                                         <img 
                                           src={r.photo_url} 
                                           alt={r.candidate_name} 
                                           className="w-12 h-12 rounded-full object-cover shadow-sm" 
                                           onError={(e) => { e.target.src = '/default-avatar.png'; }}
                                         />
                                       ) : (
                                         <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shadow-sm">
                                           <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                             <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                           </svg>
                                         </div>
                                       )}
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">{r.candidate_name}</div>
                                            <div className="text-sm text-gray-500">{r.candidate_id}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-lg font-bold text-indigo-600">{r.votes}</div>
                                            <div className="text-sm text-gray-500">vote{r.votes === 1 ? '' : 's'}</div>
                                            {/* Add vote percentage */}
                                            <div className="text-xs text-gray-400">
                                                {((r.votes / results.reduce((sum, x) => sum + x.votes, 0)) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                        {winner && winner.candidate_id === r.candidate_id && (
                                            <div className="flex flex-col items-center ml-2">
                                                <span className="text-sm font-bold text-green-700 bg-green-100 px-4 py-1.5 rounded-full shadow-sm animate-pulse">
                                                    🏆 WINNER
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Show message if no election is selected and no error/message
                    !electionId && !err && !message && (
                        <div className="bg-white rounded shadow p-8 text-center text-gray-600">
                            <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-lg">Please select an election to view results.</p>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}