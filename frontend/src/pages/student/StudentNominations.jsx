import React, { useState } from 'react';
import axios from '../../api/axiosInstance';
import { useSearchParams } from 'react-router-dom';

export default function StudentNominations(){
  const [search] = useSearchParams();
  const electionId = search.get('election');
  const [manifesto, setManifesto] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [err, setErr] = useState('');

  const submit = async (e)=>{
    e.preventDefault();
    try{
      // Backend expects election_id, manifesto and photo_url (string)
      await axios.post('/nominations', { election_id: electionId, manifesto, photo_url: photoUrl });
      alert('Nomination submitted');
    }catch(error){
      setErr('Failed to submit');
      console.error(error);
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Submit Nomination</h1>
      <form onSubmit={submit} className="bg-white p-6 rounded shadow max-w-xl">
        {err && <div className="text-red-600 mb-3">{err}</div>}
        <textarea value={manifesto} onChange={e=>setManifesto(e.target.value)} placeholder="Manifesto" className="w-full border p-3 mb-3 rounded" />
        <input type="file" onChange={e=>setPhoto(e.target.files?.[0])} className="mb-3" />
        <button className="px-4 py-2 bg-blue-600 text-white rounded">Submit</button>
      </form>
    </div>
  )
}