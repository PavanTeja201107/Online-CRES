// import React, { useEffect, useState, useMemo } from 'react';
// import Navbar from '../../components/Navbar';
// import { getElections } from '../../api/electionApi'; // Correct: Use getElections
// import { getResults } from '../../api/voteApi';
// import Alert from '../../components/ui/Alert';

// // 1. Import Chart.js components
// import { Bar } from 'react-chartjs-2';
// import {
//   Chart as ChartJS,
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend,
// } from 'chart.js';

// // 2. Register the components Chart.js needs
// ChartJS.register(
//   CategoryScale,
//   LinearScale,
//   BarElement,
//   Title,
//   Tooltip,
//   Legend
// );

// export default function AdminResults() {
//   const [electionId, setElectionId] = useState('');
//   const [results, setResults] = useState([]);
//   const [err, setErr] = useState('');
//   const [electionsList, setElectionsList] = useState([]);

//   const load = async (id) => {
//     if (!id) {
//       setResults([]);
//       return;
//     }
//     try {
//       setErr('');
//       const data = await getResults(id);
//       setResults(data);
//     } catch (e) {
//       setResults([]);
//       setErr(e.response?.data?.error || 'Failed to load results');
//     }
//   };

//   useEffect(() => {
//     (async () => {
//       try {
//         const list = await getElections();
//         setElectionsList(list || []);
//       } catch (e) {
//         setErr(e.response?.data?.error || 'Failed to load elections list.');
//       }
//     })();
//   }, []);

//   // 3. Prepare data for the bar chart
//   const chartData = useMemo(() => {
//     if (!results || results.length === 0) {
//       return null;
//     }
//     return {
//       labels: results.map(r => `${r.candidate_name} (${r.candidate_id})`),
//       datasets: [
//         {
//           label: 'Total Votes',
//           data: results.map(r => r.votes),
//           backgroundColor: 'rgba(79, 70, 229, 0.6)',
//           borderColor: 'rgba(79, 70, 229, 1)',
//           borderWidth: 1,
//         },
//       ],
//     };
//   }, [results]);

//   // 4. Configure options for the chart
//   const chartOptions = {
//     responsive: true,
//     plugins: {
//       legend: {
//         display: false,
//       },
//       title: {
//         display: true,
//         text: 'Election Results',
//         font: {
//           size: 18,
//         },
//       },
//     },
//     scales: {
//       y: {
//         beginAtZero: true,
//         ticks: {
//           precision: 0,
//         },
//       },
//       x: {
//         beginAtZero: true,
//       },
//     },
//   };

//   return (
//     <div className="min-h-screen bg-gray-50">
//       <Navbar />
//       <div className="container mx-auto px-6 py-8">
//         <h1 className="text-2xl font-bold mb-4">Results</h1>

//         {/* --- Election Selector --- */}
//         <div className="bg-white p-4 rounded shadow mb-8">
//           <label htmlFor="electionSelect" className="block text-sm font-medium text-gray-700 mb-1">
//             Select Election
//           </label>
//           <select
//             id="electionSelect"
//             value={electionId}
//             onChange={e => {
//               setElectionId(e.target.value);
//               load(e.target.value);
//             }}
//             className="border p-2 rounded w-full md:w-1/2"
//           >
//             <option value="">-- Choose --</option>
//             {/* --- THIS IS THE LINE THAT WAS CHANGED --- */}
//             {electionsList.map(e => (
//               <option key={e.election_id} value={e.election_id}>
//                 {e.title || `Election #${e.election_id}`} 
//                 {/* Check if voting_end exists before displaying */}
//                 {e.voting_end ? ` — Voting ended ${new Date(e.voting_end).toLocaleString()}` : ''}
//               </option>
//             ))}
//             {/* --- END OF CHANGE --- */}
//           </select>
//         </div>

//         {/* --- Error Alert --- */}
//         {err && <Alert kind="danger" className="mb-6">{err}</Alert>}

//         {/* --- Main Content Grid --- */}
//         {results.length > 0 ? (
//           <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
//             {/* --- Chart Column (Left) --- */}
//             <div className="md:col-span-3">
//               <div className="bg-white rounded shadow p-4">
//                 <div style={{ maxHeight: '450px' }}>
//                   <Bar options={chartOptions} data={chartData} />
//                 </div>
//               </div>
//             </div>

//             {/* --- Detailed Breakdown Column (Right) --- */}
//             <div className="md:col-span-2">
//               <h2 className="text-xl font-bold mb-3">Detailed Breakdown</h2>
//               <div className="bg-white rounded shadow">
//                 {results.map(r => (
//                   <div key={r.candidate_id} className="p-3 border-b flex items-center gap-4">
//                     {r.photo_url && <img src={r.photo_url} alt={r.candidate_name} className="w-10 h-10 rounded object-cover" />}
//                     <div className="flex-1">
//                       <div className="font-semibold">{r.candidate_name} ({r.candidate_id})</div>
//                     </div>
//                     <div className="text-indigo-700 font-bold text-xl">{r.votes}</div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>
//         ) : (
//           !electionId && !err && (
//             <div className="bg-white rounded shadow p-4 text-gray-600">
//               Please select an election to view results.
//             </div>
//           )
//         )}
//       </div>
//     </div>
//   );
// }

import React, { useEffect, useState, useMemo } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi'; // Use getElections for Admin
import { getResults } from '../../api/voteApi';
import Alert from '../../components/ui/Alert'; // Ensure Alert component is imported

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

export default function AdminResults() {
  const [electionId, setElectionId] = useState('');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');
  const [electionsList, setElectionsList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedElection, setSelectedElection] = useState(null);

  // Function to load results for a specific election
  const load = async (id) => {
    if (!id) {
      setResults([]);
      setSelectedElection(null);
      return;
    }

    setIsLoading(true);
    setErr('');
    
    try {
      const election = electionsList.find(e => e.election_id.toString() === id.toString());
      setSelectedElection(election || null);
      
      const data = await getResults(id);
      if (!Array.isArray(data)) {
        throw new Error('Invalid response format');
      }
      
      // Sort results by votes in descending order
      const sortedResults = [...data].sort((a, b) => b.votes - a.votes);
      setResults(sortedResults);
    } catch (e) {
      console.error('Results load error:', e);
      setResults([]);
      setErr(e.response?.data?.error || 'Failed to load results');
    } finally {
      setIsLoading(false);
    }
  };

  // Effect to load the list of all elections on component mount
  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        const list = await getElections();
        if (!Array.isArray(list)) {
          throw new Error('Invalid elections list format');
        }
        
        // Sort elections by voting end date (most recent first)
        const sortedList = [...list].sort((a, b) => 
          new Date(b.voting_end || 0) - new Date(a.voting_end || 0)
        );
        
        setElectionsList(sortedList);
        
        // Auto-select the most recent election if available
        if (sortedList.length > 0) {
          const recentElection = sortedList[0];
          setElectionId(recentElection.election_id.toString());
          setSelectedElection(recentElection);
          await load(recentElection.election_id);
        }
      } catch (e) {
        console.error('Elections load error:', e);
        setErr(e.response?.data?.error || 'Failed to load elections list');
        setElectionsList([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  // Calculate total votes and percentages
  const totalVotes = useMemo(() => 
    results.reduce((sum, r) => sum + (r.votes || 0), 0),
    [results]
  );

  // 3. Prepare data for the bar chart using useMemo for optimization
  const chartData = useMemo(() => {
    if (!results || results.length === 0) {
      return null;
    }

    // Calculate percentages and find the winner
    const maxVotes = Math.max(...results.map(r => r.votes || 0));
    
    return {
      labels: results.map(r => `${r.candidate_name} (${r.candidate_id})`),
      datasets: [
        {
          label: 'Total Votes',
          data: results.map(r => r.votes),
          backgroundColor: results.map(r => 
            r.votes === maxVotes && maxVotes > 0
              ? 'rgba(34, 197, 94, 0.6)'  // Green for winner
              : 'rgba(79, 70, 229, 0.6)'  // Indigo for others
          ),
          borderColor: results.map(r => 
            r.votes === maxVotes && maxVotes > 0
              ? 'rgba(34, 197, 94, 1)'
              : 'rgba(79, 70, 229, 1)'
          ),
          borderWidth: 1,
          borderRadius: 4,
        }
      ],
    };
  }, [results]);

  // 4. Configure options for the chart
  const chartOptions = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: selectedElection 
          ? `Results: ${selectedElection.title || `Election #${selectedElection.election_id}`}`
          : 'Election Results',
        font: {
          size: 18,
          weight: 'bold'
        },
        padding: { bottom: 20 }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const votes = context.parsed.y;
            const percentage = totalVotes ? ((votes / totalVotes) * 100).toFixed(1) : 0;
            return `${votes} vote${votes === 1 ? '' : 's'} (${percentage}%)`;
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
  }), [selectedElection, totalVotes]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Results</h1>

        {/* --- Election Selector Dropdown --- */}
        <div className="bg-white p-4 rounded shadow mb-8">
          <label htmlFor="electionSelect" className="block text-sm font-medium text-gray-700 mb-1">
            Select Election
          </label>
          <select
            id="electionSelect"
            value={electionId}
            onChange={e => {
              setElectionId(e.target.value);
              load(e.target.value); // Load results when selection changes
            }}
            className="border p-2 rounded w-full md:w-1/2"
            aria-label="Select election to view results"
          >
            <option value="">-- Choose --</option>
            {electionsList.map(e => (
              <option key={e.election_id} value={e.election_id}>
                {e.title || `Election #${e.election_id}`}
                {/* Add voting end time if available */}
                {e.voting_end ? ` — Voting ended ${new Date(e.voting_end).toLocaleString()}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* --- Error Alert Display --- */}
        {err && <Alert kind="danger" className="mb-6">{err}</Alert>}

        {/* --- Main Content Area --- */}
        {isLoading ? (
          <div className="bg-white rounded shadow p-8">
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
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
              <div className="bg-white rounded shadow overflow-hidden">
                <div className="p-4 bg-gray-50 border-b">
                  <h2 className="text-lg font-bold">Detailed Breakdown</h2>
                  {totalVotes > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Total Votes: {totalVotes}
                    </p>
                  )}
                </div>
                <div className="divide-y divide-gray-100">
                  {results.map((r, index) => {
                    const percentage = totalVotes ? ((r.votes / totalVotes) * 100).toFixed(1) : 0;
                    const isLeading = index === 0 && r.votes > 0;
                    
                    return (
                      <div 
                        key={r.candidate_id} 
                        className={`p-4 flex items-center gap-4 transition-colors ${
                          isLeading ? 'bg-green-50 hover:bg-green-100' : 'hover:bg-gray-50'
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
                          <div className="text-sm text-gray-500">{percentage}%</div>
                        </div>
                        {isLeading && (
                          <div className="flex flex-col items-center ml-2">
                            <span className="text-xs font-bold text-green-700 bg-green-100 px-3 py-1 rounded-full shadow-sm">
                              LEADING
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : (
          !electionId && !err && (
            <div className="bg-white rounded shadow p-8 text-center">
              <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} 
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg text-gray-600">Please select an election to view results.</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}