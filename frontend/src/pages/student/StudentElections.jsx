import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import { useParams, useNavigate } from 'react-router-dom';

export default function StudentElections(){
  const { id } = useParams();
  const [election, setElection] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const navigate = useNavigate();

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await axios.get(`/elections/${id}`);
        setElection(res.data);
        const cand = await axios.get(`/nominations/election/${id}`);
        setCandidates(cand.data || []);
      }catch(err){
        console.error(err);
      }
    }
    if(id) fetch();
  },[id])

  const goToVote = (candidateId)=>{
    navigate(`/student/elections/${id}/vote?candidate=${candidateId}`);
  }

  if(!election) return <div className="p-6">Loading...</div>

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">{election.class_name} Election</h1>
      <div className="grid gap-4 md:grid-cols-2">
                {candidates.map(c=> (
          <div key={c.nomination_id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{c.name || c.student_name}</h3>
            <p className="text-sm text-gray-600 mt-2">{c.manifesto}</p>
            <div className="mt-3">
              <button onClick={()=>goToVote(c.student_id || c.student_id)} className="px-4 py-2 bg-green-600 text-white rounded">Vote</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}