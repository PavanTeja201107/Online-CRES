import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyElections } from '../../api/electionApi';
import { submitNomination, getMyNomination } from '../../api/nominationApi';
import { getPolicy, acceptPolicy } from '../../api/policyApi';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';

export default function NominationForm(){
			const [election, setElection] = useState(null);
			const [allElections, setAllElections] = useState([]);
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
				const list = await getMyElections();
				setAllElections(list||[]);
			try { const p = await getPolicy('Nomination Policy'); setPolicy(p); } catch {}
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
					if (mine && mine.manifesto) setManifesto(mine.manifesto);
					if (mine && mine.photo_url) setPhotoUrl(mine.photo_url);
				}catch{}
			})();
		}, [election]);

	const toDirectImageUrl = (url) => {
		try {
			if (!url) return url;
			// Handle Google Drive share links
			// Formats:
			// - https://drive.google.com/file/d/FILE_ID/view?usp=sharing -> https://drive.google.com/uc?export=view&id=FILE_ID
			// - https://drive.google.com/open?id=FILE_ID -> https://drive.google.com/uc?export=view&id=FILE_ID
			let m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
			if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
			m = url.match(/[?&]id=([^&]+)/);
			if (m && m[1]) return `https://drive.google.com/uc?export=view&id=${m[1]}`;
			return url;
		} catch { return url; }
	};

	const handleNominateClick = (e) => {
		// Check policy acceptance BEFORE showing nomination form
		if (policy && !accepted) {
			setShowPolicy(true);
			return;
		}
		setElection(e);
	};	const submit = async (e) => {
		e.preventDefault(); setErr(''); setMsg('');
		try {
			if (!election) throw new Error('Select an election where nominations are open');
			if (myNomination) throw new Error('You have already submitted a nomination for this election');
			// Policy already checked when clicking "Nominate" button
			const normalizedUrl = toDirectImageUrl(photoUrl);
			const res = await submitNomination({ election_id: election.election_id, manifesto, photo_url: normalizedUrl });
			setMsg(res?.message || 'Nomination submitted');
			// mark as submitted locally so the form disables without needing a refetch
			setMyNomination({ submitted: true });
			// optional: clear form fields
			setManifesto('');
			setPhotoUrl('');
		} catch (error) {
			setErr(error.response?.data?.error || error.message || 'Failed to submit');
		}
	};	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-6 py-8">
				<h1 className="text-2xl font-semibold mb-4">Nomination</h1>
				{err && <Alert kind="danger" className="mb-2">{err}</Alert>}
				{msg && <Alert kind="success" className="mb-2">{msg}</Alert>}

				{/* Show nomination form only if election is active and student has not nominated - MOVE TO TOP */}
				{election && (() => {
					const now = Date.now();
					const ns = new Date(election.nomination_start).getTime();
					const ne = new Date(election.nomination_end).getTime();
					const open = now >= ns && now <= ne;
					if (!open || myNomination) return null;
					return (
						<div className="bg-white p-4 rounded shadow max-w-xl mb-6">
							<h3 className="font-semibold mb-2">Submit Nomination for Election #{election.election_id}</h3>
							<form onSubmit={submit}>
								<label className="block text-sm mb-2">Manifesto <span className="text-red-600">*</span>
									<textarea value={manifesto} onChange={e=>setManifesto(e.target.value)} placeholder="Your manifesto" className="border p-2 w-full h-32 mt-1 mb-3" required />
								</label>
								<label className="block text-sm mb-2">Photo URL (optional)
									<input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} placeholder="https://..." className="border p-2 w-full mt-1 mb-3" />
								</label>
								<Button disabled={!manifesto} className="px-4">Submit Nomination</Button>
							</form>
						</div>
					);
				})()}

				{/* Show manifesto and photo at the top if nomination is started and exists */}
				{election && (() => {
					const now = Date.now();
					const ns = new Date(election.nomination_start).getTime();
					const ne = new Date(election.nomination_end).getTime();
					const open = now >= ns && now <= ne;
					if (open && myNomination) {
						return (
							<div className="bg-white p-4 rounded shadow max-w-xl mb-6">
								<h3 className="font-semibold mb-2">Your Nomination for Election #{election.election_id}</h3>
								
								{/* Status Badge */}
								<div className="mb-3">
									<span className={`inline-block px-3 py-1 rounded text-sm font-semibold ${
										myNomination.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
										myNomination.status === 'REJECTED' ? 'bg-red-100 text-red-800' :
										'bg-yellow-100 text-yellow-800'
									}`}>
										{myNomination.status || 'PENDING'}
									</span>
								</div>

								{/* Rejection Reason */}
								{myNomination.status === 'REJECTED' && myNomination.rejection_reason && (
									<div className="mb-3 p-4 bg-red-50 border-l-4 border-red-500 rounded">
										<div className="flex items-start">
											<svg className="w-5 h-5 text-red-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
											</svg>
											<div>
												<strong className="text-red-900 block mb-1">Rejection Reason:</strong>
												<p className="text-red-700 text-sm whitespace-pre-wrap">{myNomination.rejection_reason}</p>
											</div>
										</div>
									</div>
								)}

								{/* Approval Message */}
								{myNomination.status === 'APPROVED' && (
									<div className="mb-3 p-4 bg-green-50 border-l-4 border-green-500 rounded">
										<div className="flex items-start">
											<svg className="w-5 h-5 text-green-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
												<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
											</svg>
											<div>
												<strong className="text-green-900 block mb-1">Nomination Approved!</strong>
												<p className="text-green-700 text-sm">Congratulations! Your nomination has been approved. You are now officially a candidate for this election. Students will be able to view your manifesto and vote for you when voting begins.</p>
											</div>
										</div>
									</div>
								)}

								{/* Pending Message */}
								{(!myNomination.status || myNomination.status === 'PENDING') && (
									<Alert kind="warning" className="mb-3">
										<strong>⏳ Under Review:</strong> Your nomination is pending admin review. You will be notified via email once a decision is made.
									</Alert>
								)}
								
								{myNomination.status === 'REJECTED' && (
									<Alert kind="danger" className="mb-3">
										<strong>Nomination Rejected:</strong> Unfortunately, your nomination was not approved. See the reason above. You may contact the admin for clarification.
									</Alert>
								)}
								
								<div className="mb-2">
									<div className="font-semibold">Manifesto:</div>
									<div className="border p-2 bg-gray-50 whitespace-pre-wrap">{myNomination.manifesto}</div>
								</div>
								{myNomination.photo_url && (
									<div className="mb-2">
										<div className="font-semibold">Photo:</div>
										<img src={toDirectImageUrl(myNomination.photo_url)} alt="Nominee" className="max-w-xs rounded border" />
									</div>
								)}
							</div>
						);
					}
					return null;
				})()}

				{/* Show only active nominations in the election list */}
				<div className="bg-white p-4 rounded shadow mb-6">
					<h2 className="font-semibold mb-3">Active Class Elections</h2>
					<ul className="divide-y">
						{(allElections||[]).filter(e => {
							const now = Date.now();
							const ns = new Date(e.nomination_start).getTime();
							const ne = new Date(e.nomination_end).getTime();
							return now >= ns && now <= ne;
						}).map(e => {
							const now = Date.now();
							const ns = new Date(e.nomination_start).getTime();
							const ne = new Date(e.nomination_end).getTime();
							const open = now >= ns && now <= ne;
							return (
								<li key={e.election_id} className="py-3 flex items-center justify-between">
									<div className="text-sm">
										<div className="font-medium">Election #{e.election_id}</div>
										<div className="text-gray-600">Nominations: {new Date(e.nomination_start).toLocaleString()} - {new Date(e.nomination_end).toLocaleString()}</div>
									</div>
									<div>
										<Button variant={open? 'primary':'secondary'} disabled={!open} onClick={()=>handleNominateClick(e)}>{open? 'Nominate' : 'Closed'}</Button>
									</div>
								</li>
							);
						})}
						{(!allElections || allElections.filter(e => {
							const now = Date.now();
							const ns = new Date(e.nomination_start).getTime();
							const ne = new Date(e.nomination_end).getTime();
							return now >= ns && now <= ne;
						}).length === 0) && (
							<li className="py-3 text-gray-600">No active elections found for your class.</li>
						)}
					</ul>
				</div>

				{/* After active nominations, show all elections (completed) below */}
				<div className="bg-white p-4 rounded shadow mb-6">
					<h2 className="font-semibold mb-3">Completed Class Elections</h2>
					<ul className="divide-y">
						{(allElections||[]).filter(e => {
							const now = Date.now();
							const ns = new Date(e.nomination_start).getTime();
							const ne = new Date(e.nomination_end).getTime();
							return now > ne;
						}).map(e => (
							<li key={e.election_id} className="py-3 flex items-center justify-between">
								<div className="text-sm">
									<div className="font-medium">Election #{e.election_id}</div>
									<div className="text-gray-600">Nominations: {new Date(e.nomination_start).toLocaleString()} - {new Date(e.nomination_end).toLocaleString()}</div>
								</div>
								<div>
									<Button variant="secondary" disabled>Closed</Button>
								</div>
							</li>
						))}
						{(!allElections || allElections.filter(e => {
							const now = Date.now();
							const ns = new Date(e.nomination_start).getTime();
							const ne = new Date(e.nomination_end).getTime();
							return now > ne;
						}).length === 0) && (
							<li className="py-3 text-gray-600">No completed elections found for your class.</li>
						)}
					</ul>
				</div>

					{showPolicy && policy && (
						<div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
							<div className="bg-white rounded shadow max-w-2xl w-full p-4">
								<h2 className="text-lg font-semibold mb-2">Nomination Policy</h2>
								<div className="h-64 overflow-auto border p-2 whitespace-pre-wrap text-sm mb-3">{policy.policy_text}</div>
								<div className="flex justify-end gap-2">
									<Button variant="secondary" onClick={()=>setShowPolicy(false)}>Cancel</Button>
									<Button onClick={async ()=>{
										try {
											await acceptPolicy('Nomination Policy');
											setAccepted(true);
											setShowPolicy(false);
											setMsg('Policy accepted. Please click "Nominate" again to proceed.');
										} catch(e) {
											setErr(e.response?.data?.error || 'Failed to accept');
										}
									}}>I Accept</Button>
								</div>
							</div>
						</div>
					)}
			</div>
		</div>
	);
}
