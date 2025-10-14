import React, { useEffect, useState } from 'react';
import axios from '../../api/axiosInstance';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function StudentDashboard() {
  const [election, setElection] = useState(null);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/student/login');
  };

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await axios.get('/elections/class/1/active'); // backend returns single object or null
        setElection(res.data || null);
      }catch(err){
        console.error(err);
      }
    }
    fetch();
  },[])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Student Dashboard</h1>
        <button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded">Logout</button>
      </div>
      {election ? (
        <div className="grid gap-4 md:grid-cols-2">
          <div key={election.election_id} className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold">{election.class_name} Election</h3>
            <div className="mt-2 text-sm text-gray-600">Nomination ends: {new Date(election.nomination_end).toLocaleString()}</div>
            <div className="mt-2 flex gap-2">
              <Link to={`/student/nominations?election=${election.election_id}`} className="px-4 py-2 bg-blue-600 text-white rounded">Nominate</Link>
              <Link to={`/student/elections/${election.election_id}`} className="px-4 py-2 bg-green-600 text-white rounded">Vote</Link>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-gray-500">No active election for your class</div>
      )}
    </div>
  )
}
