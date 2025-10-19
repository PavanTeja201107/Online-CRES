import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi';
import { getResults } from '../../api/voteApi';

export default function AdminResults(){
  const [electionId, setElectionId] = useState('');
  const [results, setResults] = useState([]);
  const [err, setErr] = useState('');

  const load = async (id)=>{
    try { const data = await getResults(id); setResults(data); }
    catch(e){ setErr(e.response?.data?.error || 'Failed to load'); }
  };

  useEffect(()=>{
    (async()=>{
      const list = await getElections();
      if (list?.length){ setElectionId(list[0].election_id); load(list[0].election_id); }
    })();
  },[]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Results</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        <div className="bg-white p-4 rounded shadow mb-4 flex gap-2">
          <label>Election ID</label>
          <input value={electionId} onChange={e=>{ setElectionId(e.target.value); load(e.target.value); }} className="border p-2 w-48" />
        </div>
        <div className="bg-white rounded shadow">
          {results.map(r => (
            <div key={r.candidate_id} className="p-3 border-b flex items-center gap-4">
              {r.photo_url && <img src={r.photo_url} className="w-10 h-10 rounded object-cover" />}
              <div className="flex-1">
                <div className="font-semibold">{r.candidate_name} ({r.candidate_id})</div>
              </div>
              <div className="text-indigo-700 font-bold">{r.votes}</div>
            </div>
          ))}
          {!results.length && <div className="p-4 text-gray-600">No results.</div>}
        </div>
      </div>
    </div>
  );
}
