import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import { getMyActiveElection } from '../../api/electionApi';

export default function StudentDashboard() {
  const [election, setElection] = useState(null);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const data = await getMyActiveElection();
        setElection(data || null);
      }catch(err){
        setElection(null);
      }
    };
    fetch();
  },[]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Student Dashboard</h1>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <h2 className="font-semibold mb-2">Active Election</h2>
            {election ? (
              <>
                <div><strong>ID:</strong> {election.election_id}</div>
                <div><strong>Voting:</strong> {new Date(election.voting_start).toLocaleString()} - {new Date(election.voting_end).toLocaleString()}</div>
                <div className="mt-3 flex gap-2">
                  <Link to="/student/election" className="text-indigo-600">Details</Link>
                  <Link to="/student/nomination" className="text-indigo-600">Nominate</Link>
                  <Link to="/student/vote" className="text-indigo-600">Vote</Link>
                  <Link to="/student/results" className="text-indigo-600">Results</Link>
                </div>
              </>
            ) : (
              <div className="text-gray-600">No active election</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
