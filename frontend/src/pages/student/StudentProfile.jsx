import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyProfile, requestPasswordReset } from '../../api/studentsApi';

export default function StudentProfile(){
  const [profile, setProfile] = useState(null);

  useEffect(()=>{
    const fetch = async ()=>{
      try{
        const res = await getMyProfile();
        setProfile(res);
      }catch(err){
        console.error(err);
      }
    };
    fetch();
  },[]);

  const requestReset = async () => {
    try {
      if (!profile?.student_id) return;
      const res = await requestPasswordReset(profile.student_id);
      alert(res?.message || 'Reset OTP sent');
    } catch (e) {
      alert(e.response?.data?.error || 'Failed to request');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        {!profile ? (
          <div className="bg-white p-6 rounded shadow max-w-md">Loading...</div>
        ) : (
          <div className="bg-white p-6 rounded shadow max-w-xl">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Student ID</div>
                <div className="font-medium">{profile.student_id}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Name</div>
                <div className="font-medium">{profile.name}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Email</div>
                <div className="font-medium">{profile.email}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Class</div>
                <div className="font-medium">{profile.class_name}</div>
              </div>
            </div>
            <div className="mt-6">
              <button onClick={requestReset} className="bg-indigo-600 hover:bg-indigo-700 transition text-white px-4 py-2 rounded">Request Password Reset</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}