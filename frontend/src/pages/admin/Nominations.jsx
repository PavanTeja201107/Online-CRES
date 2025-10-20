import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getElections } from '../../api/electionApi';
import axios from '../../api/axiosInstance';
import Select from '../../components/ui/Select';

export default function AdminNominations(){
  const [electionId, setElectionId] = useState('');
  const [noms, setNoms] = useState([]);
  const [err, setErr] = useState('');
  const [elections, setElections] = useState([]);

  const load = async (id)=>{
    try { const { data } = await axios.get(`/nominations/election/${id}`); setNoms(data); }
    catch(e){ setErr(e.response?.data?.error || 'Failed to load'); }
  };

  useEffect(()=>{
    (async()=>{
      try{
        const list = await getElections();
        setElections(list || []);
        if (list?.length){ setElectionId(list[0].election_id); load(list[0].election_id); }
      }catch(e){ setErr(e.response?.data?.error || 'Failed to load elections'); }
    })();
  },[]);

  const handleChange = async (e)=>{ setElectionId(e.target.value); load(e.target.value); };
  const approve = async (id)=>{ const nom = noms.find(x=>x.nomination_id===id); if(nom && (nom.status==='APPROVED'||nom.status==='REJECTED')) return; await axios.put(`/nominations/${id}/approve`); load(electionId); };
  const reject = async (id)=>{ const nom = noms.find(x=>x.nomination_id===id); if(nom && (nom.status==='APPROVED'||nom.status==='REJECTED')) return; const reason = prompt('Reason?') || ''; await axios.put(`/nominations/${id}/reject`, { reason }); load(electionId); };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">Nominations</h1>
        {err && <div className="text-red-600 mb-2">{err}</div>}
        <div className="bg-white p-4 rounded shadow mb-4">
          <Select label="Election" value={electionId} onChange={handleChange}>
            <option value="">-- Select Election --</option>
            {elections.map(e => (
              <option key={e.election_id} value={e.election_id}>{e.election_id} - Class {e.class_id} {e.class_name ? `(${e.class_name})` : ''} — {new Date(e.nomination_start).toLocaleDateString()}</option>
            ))}
          </Select>
        </div>
        <div className="bg-white rounded shadow">
          {noms.map(n => {
            const decided = n.status === 'APPROVED' || n.status === 'REJECTED';
            return (
              <div key={n.nomination_id} className="p-3 border-b flex items-center justify-between">
                <div>
                  <div className="font-semibold">{n.student_id}</div>
                  <div className="text-sm text-gray-600">{n.status}{n.rejection_reason ? ` — ${n.rejection_reason}` : ''}</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={()=>approve(n.nomination_id)} disabled={decided} className={`text-green-700 ${decided? 'opacity-50 cursor-not-allowed':''}`}>Approve</button>
                  <button onClick={()=>reject(n.nomination_id)} disabled={decided} className={`text-red-600 ${decided? 'opacity-50 cursor-not-allowed':''}`}>Reject</button>
                </div>
              </div>
            );
          })}
          {!noms.length && <div className="p-4 text-gray-600">No nominations.</div>}
        </div>
      </div>
    </div>
  );
}
