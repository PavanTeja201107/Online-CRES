import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyActiveElection, getMyElections } from '../../api/electionApi';
import { submitNomination, getMyNomination } from '../../api/nominationApi';
import { getPolicy, acceptPolicy } from '../../api/policyApi';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function NominationForm(){
		const [election, setElection] = useState(null);
		const [eligibleElections, setEligibleElections] = useState([]);
		const [myNomination, setMyNomination] = useState(null);
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
				// fetch all my class elections and filter where nominations are open
				const list = await getMyElections();
				const now = Date.now();
				const open = (list||[]).filter(e => now >= new Date(e.nomination_start).getTime() && now <= new Date(e.nomination_end).getTime());
				setEligibleElections(open);
				if (open.length) setElection(open[0]);
				try { const p = await getPolicy(); setPolicy(p); } catch {}
			} catch (error) {
				setErr(error.response?.data?.error || 'Failed to load elections');
			}
		})();
	},[]);

		useEffect(()=>{
			(async ()=>{
				setMyNomination(null);
				if (!election) return;
				try{
					const mine = await getMyNomination(election.election_id);
					setMyNomination(mine);
				}catch{}
			})();
		}, [election]);

		const submit = async (e) => {
		e.preventDefault(); setErr(''); setMsg('');
		try {
				if (!election) throw new Error('Select an election where nominations are open');
				if (myNomination) throw new Error('You have already submitted a nomination for this election');
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
						{err && <Alert kind="danger" className="mb-2">{err}</Alert>}
						{msg && <Alert kind="success" className="mb-2">{msg}</Alert>}
						<form onSubmit={submit} className="bg-white p-4 rounded shadow max-w-xl">
							<div className="mb-3">
								<Select label="Select Election (open nominations)" value={election?.election_id || ''} onChange={(e)=>{
									const id = Number(e.target.value); const sel = eligibleElections.find(x=>x.election_id===id); setElection(sel||null);
								}}>
									<option value="">-- Choose --</option>
									{eligibleElections.map(e => (
										<option key={e.election_id} value={e.election_id}>Election #{e.election_id} — {new Date(e.nomination_end).toLocaleString()} closes</option>
									))}
								</Select>
							</div>
							{myNomination && (
								<Alert kind="info" className="mb-3">You already submitted a nomination for Election #{election?.election_id}. You can’t submit again.</Alert>
							)}
					<label className="block text-sm mb-2">Manifesto <span className="text-red-600">*</span>
						<textarea value={manifesto} onChange={e=>setManifesto(e.target.value)} placeholder="Your manifesto" className="border p-2 w-full h-32 mt-1 mb-3" required />
					</label>
					<label className="block text-sm mb-2">Photo URL (optional)
						<input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://..." className="border p-2 w-full mt-1 mb-3" />
					</label>
							<Button disabled={!manifesto || !election || !!myNomination} className="px-4">Submit Nomination</Button>
				</form>

	        {showPolicy && policy && (
	          <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4">
	            <div className="bg-white rounded shadow max-w-2xl w-full p-4">
	              <h2 className="text-lg font-semibold mb-2">Election Policy</h2>
	              <div className="h-64 overflow-auto border p-2 whitespace-pre-wrap text-sm mb-3">{policy.policy_text}</div>
								<div className="flex justify-end gap-2">
									<Button variant="secondary" onClick={()=>setShowPolicy(false)}>Cancel</Button>
									<Button onClick={async ()=>{ try{ await acceptPolicy(); setAccepted(true); setShowPolicy(false); setMsg('Policy accepted. Please submit again.'); }catch(e){ setErr(e.response?.data?.error || 'Failed to accept'); } }}>I Accept</Button>
								</div>
	            </div>
	          </div>
	        )}
			</div>
		</div>
	);
}
