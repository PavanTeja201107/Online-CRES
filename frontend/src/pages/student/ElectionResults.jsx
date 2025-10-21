import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { getMyElections } from '../../api/electionApi';
import { getResults } from '../../api/voteApi';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';
import Confetti from 'react-confetti';

// Import Chart.js components
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

// Register the components Chart.js needs
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
    const [isLoading, setIsLoading] = useState(false);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        (async () => {
            setIsLoading(true);
            try {
                const list = await getMyElections();
                // Validate that list is an array
                if (!Array.isArray(list)) {
                    console.error('getMyElections did not return an array:', list);
                    setErr('Failed to load elections');
                    setElections([]);
                    setIsLoading(false);
                    return;
                }
                setElections(list);
                const published = list.filter(e => e.is_published);
                if (published.length) {
                    setElectionId(String(published[0].election_id));
                }
            } catch (error) {
                console.error('Error loading elections:', error);
                setErr(error.response?.data?.error || 'No elections available');
            } finally {
                setIsLoading(false);
            }
        })();
    }, []);

    useEffect(() => {
        const load = async () => {
            // Reset state when electionId changes
            setResults([]);
            setMessage('');
            setErr('');
            setWinner(null);
            
            if (!electionId) return;
            
            setIsLoading(true);
            try {
                const r = await getResults(electionId);
                
                // Validate that r is an array or has candidates array
                if (!Array.isArray(r) && !Array.isArray(r?.candidates)) {
                    console.error('getResults did not return valid data:', r);
                    setErr('Failed to load results');
                    setIsLoading(false);
                    return;
                }
                
                const data = Array.isArray(r) ? r : (r?.candidates || []);
                
                // Normalize Google Drive URLs
                const normalize = (url) => {
                    try {
                        if (!url) return url;
                        let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
                        if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
                        m = url.match(/[?&]id=([^&]+)/);
                        if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
                        return url;
                    } catch { return url; }
                };
                
                const normalizedResults = data.map(x => ({ ...x, photo_url: normalize(x.photo_url) }));
                setResults(normalizedResults);
                
                if (!data || data.length === 0) {
                    setMessage('No votes recorded. Faculty advisor and HOD will decide next steps.');
                } else {
                    const topVotes = Math.max(...data.map(x => x.votes));
                    const potentialWinners = data.filter(x => x.votes === topVotes);
                    
                    if (topVotes === 0) {
                        setMessage('No votes recorded. Faculty advisor and HOD will decide next steps.');
                        setWinner(null);
                    } else if (potentialWinners.length > 1) {
                        setMessage('Tie detected. Faculty advisor and HOD will resolve.');
                        setWinner(null);
                    } else if (topVotes > 0 && potentialWinners.length === 1) {
                        // We have a clear winner!
                        setWinner(potentialWinners[0]);
                        setMessage(`🎉 ${potentialWinners[0].candidate_name} has won the election!`);
                    }
                }
            } catch (error) {
                console.error('Error loading results:', error);
                setErr(error.response?.data?.error || 'No results available');
                setWinner(null);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, [electionId]);

    // Prepare data for the bar chart with winner highlighting
    const chartData = useMemo(() => {
        if (!results || results.length === 0) {
            return null;
        }
        
        const winnerId = winner?.candidate_id;
        
        return {
            labels: results.map(r => `${r.candidate_name} (${r.candidate_id})`),
            datasets: [
                {
                    label: 'Total Votes',
                    data: results.map(r => r.votes),
                    backgroundColor: results.map(r => 
                        r.candidate_id === winnerId 
                            ? 'rgba(34, 197, 94, 0.6)' 
                            : 'rgba(79, 70, 229, 0.6)'
                    ),
                    borderColor: results.map(r => 
                        r.candidate_id === winnerId 
                            ? 'rgba(34, 197, 94, 1)' 
                            : 'rgba(79, 70, 229, 1)'
                    ),
                    borderWidth: 1,
                },
            ],
        };
    }, [results, winner]);

    // Configure options for the chart
    const chartOptions = useMemo(() => ({
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
                    label: function(context) {
                        const votes = context.parsed.y;
                        return `${context.dataset.label}: ${votes} ${votes === 1 ? 'vote' : 'votes'}`;
                    }
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    precision: 0,
                    callback: function(value) {
                        return `${value} ${value === 1 ? 'vote' : 'votes'}`;
                    }
                },
                grid: {
                    display: true,
                    color: 'rgba(0, 0, 0, 0.1)',
                }
            },
            x: {
                grid: {
                    display: false,
                }
            },
        },
    }), []);

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />
            
            {/* Confetti celebration for winner */}
            {winner && <Confetti recycle={false} numberOfPieces={500} />}
            
            <div className="container mx-auto px-6 py-8">
                <h1 className="text-2xl font-semibold mb-4">Results</h1>
                
                {/* Election Selector */}
                <div className="mb-4 bg-white p-4 rounded shadow">
                    <Select label="Select Election" value={electionId} onChange={e => setElectionId(e.target.value)}>
                        <option value="">-- Choose --</option>
                        {(elections || []).filter(e => e.is_published).map(e => (
                            <option key={e.election_id} value={e.election_id}>
                                {e.title || `Election #${e.election_id}`} — Voting ended {new Date(e.voting_end).toLocaleString()}
                            </option>
                        ))}
                    </Select>
                </div>

                {/* Alerts */}
                {err && <Alert kind="danger" className="mb-3">{err}</Alert>}
                {message && winner && <Alert kind="success" className="mb-3">{message}</Alert>}
                {message && !winner && <Alert kind="warning" className="mb-3">{message}</Alert>}

                {/* Loading State */}
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
                    // Main Content: Grid Layout
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
                            <div className="bg-white rounded shadow overflow-hidden">
                                {results.map(r => {
                                    const isWinner = winner && r.candidate_id === winner.candidate_id;
                                    const voteText = r.votes === 1 ? 'vote' : 'votes';
                                    
                                    return (
                                        <div 
                                            key={r.candidate_id} 
                                            className={`p-4 border-b last:border-b-0 flex items-center gap-4 transition-colors ${
                                                isWinner 
                                                    ? 'bg-green-50 hover:bg-green-100' 
                                                    : 'hover:bg-gray-50'
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
                                                <div className="text-sm text-gray-500">
                                                    {r.candidate_id}
                                                </div>
                                            </div>
                                            
                                            {/* Vote Count */}
                                            <div className="text-right">
                                                <div className={`font-bold text-xl ${isWinner ? 'text-green-700' : 'text-indigo-700'}`}>
                                                    {r.votes}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {voteText}
                                                </div>
                                            </div>
                                            
                                            {/* Winner Badge */}
                                            {isWinner && (
                                                <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                                                    WINNER
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                ) : (
                    // Fallback for No Results
                    !err && !message && (
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
                    )
                )}
            </div>
        </div>
    );
}