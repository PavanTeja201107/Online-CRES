import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyActiveElection } from '../../api/electionApi';
import { submitNomination } from '../../api/nominationApi';
import { getPolicy, acceptPolicy } from '../../api/policyApi';

export default function NominationForm(){
	const [election, setElection] = useState(null);
	const [manifesto, setManifesto] = useState('');
	const [photoUrl, setPhotoUrl] = useState('');
	const [msg, setMsg] = useState('');
	const [err, setErr] = useState('');
	const [policy, setPolicy] = useState(null);
	const [showPolicy, setShowPolicy] = useState(false);
	const [accepted, setAccepted] = useState(false);

	useEffect(()=>{
		(async () => {
			try {
				const e = await getMyActiveElection();
				setElection(e);
          try { const p = await getPolicy(); setPolicy(p); } catch {}
			} catch (error) {
				setErr(error.response?.data?.error || 'No active election');
			}
		})();
	},[]);

	const submit = async (e) => {
		e.preventDefault(); setErr(''); setMsg('');
		try {
			if (!election) throw new Error('No active election');
      if (policy && !accepted) { setShowPolicy(true); return; }
			const res = await submitNomination({ election_id: election.election_id, manifesto, photo_url: photoUrl });
			setMsg(res?.message || 'Nomination submitted');
		} catch (error) {
			setErr(error.response?.data?.error || error.message || 'Failed to submit');
		}
	};

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-6 py-8">
				<h1 className="text-2xl font-semibold mb-4">Nomination</h1>
				{err && <div className="text-red-600 mb-2">{err}</div>}
				{msg && <div className="text-green-600 mb-2">{msg}</div>}
				<form onSubmit={submit} className="bg-white p-4 rounded shadow max-w-xl">
					<label className="block text-sm mb-2">Manifesto <span className="text-red-600">*</span>
						<textarea value={manifesto} onChange={e=>setManifesto(e.target.value)} placeholder="Your manifesto" className="border p-2 w-full h-32 mt-1 mb-3" required />
					</label>
					<label className="block text-sm mb-2">Photo URL (optional)
						<input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://..." className="border p-2 w-full mt-1 mb-3" />
					</label>
					<button disabled={!manifesto} className="bg-indigo-600 text-white px-4 py-2 rounded disabled:opacity-60">Submit Nomination</button>
				</form>

	        {showPolicy && policy && (
	          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
	            <div className="bg-white rounded shadow max-w-2xl w-full p-4">
	              <h2 className="text-lg font-semibold mb-2">Election Policy</h2>
	              <div className="h-64 overflow-auto border p-2 whitespace-pre-wrap text-sm mb-3">{policy.policy_text}</div>
	              <div className="flex justify-end gap-2">
	                <button onClick={()=>setShowPolicy(false)} className="px-3 py-1 rounded border">Cancel</button>
	                <button onClick={async ()=>{ try{ await acceptPolicy(); setAccepted(true); setShowPolicy(false); setMsg('Policy accepted. Please submit again.'); }catch(e){ setErr(e.response?.data?.error || 'Failed to accept'); } }} className="px-3 py-1 rounded bg-indigo-600 text-white">I Accept</button>
	              </div>
	            </div>
	          </div>
	        )}
			</div>
		</div>
	);
}
