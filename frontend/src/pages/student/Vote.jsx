import React from 'react';
import axios from '../../api/axiosInstance';
import { useSearchParams, useParams, useNavigate } from 'react-router-dom';

export default function Vote(){
  const [search] = useSearchParams();
  const candidate = search.get('candidate');
  const { id } = useParams();
  const navigate = useNavigate();

  const cast = async ()=>{
    try{
      await axios.post('/votes', { election_id: id, candidate_id: candidate });
      alert('Vote cast successfully');
      navigate('/student/dashboard');
    }catch(err){
      console.error(err);
      alert('Failed to cast vote');
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Cast Vote</h1>
      <div className="bg-white p-6 rounded shadow max-w-md">
        <p>Are you sure you want to vote for candidate {candidate}?</p>
        <div className="mt-4">
          <button onClick={cast} className="px-4 py-2 bg-green-600 text-white rounded">Confirm Vote</button>
        </div>
      </div>
    </div>
  )
}