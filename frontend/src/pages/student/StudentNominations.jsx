import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyActiveElection } from '../../api/electionApi';
import { getPolicy, acceptPolicy } from '../../api/policyApi';
import { submitNomination } from '../../api/nominationApi';

export default function StudentNominations() {
	const [election, setElection] = useState(null);
	const [policy, setPolicy] = useState(null);
	const [accepted, setAccepted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState('');
	const [manifesto, setManifesto] = useState('');
	const [photoUrl, setPhotoUrl] = useState('');
	const [success, setSuccess] = useState('');

	useEffect(() => {
		const fetchElection = async () => {
			try {
				const e = await getMyActiveElection();
				setElection(e);
				// Always use global Nomination Policy by name
				const p = await getPolicy('Nomination Policy');
				setPolicy(p);
				setAccepted(!!p?.accepted);
			} catch (err) {
				setError('No active election or failed to load.');
			}
			setLoading(false);
		};
		fetchElection();
	}, []);

	const handleAcceptPolicy = async () => {
		try {
			await acceptPolicy('Nomination Policy');
			setAccepted(true);
		} catch (err) {
			setError('Failed to accept policy.');
		}
	};

	const handleNominate = async () => {
		setError(''); setSuccess('');
		try {
			if (!manifesto) { setError('Enter your manifesto.'); return; }
			await submitNomination({ election_id: election.election_id, manifesto, photo_url: photoUrl });
			setSuccess('Nomination submitted successfully!');
		} catch (err) {
			setError(err.response?.data?.error || 'Failed to submit nomination.');
		}
	};

	if (loading) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto px-6 py-20">Loading…</div></div>;

	if (error) return <div className="min-h-screen bg-gray-50"><Navbar /><div className="container mx-auto px-6 py-20 text-red-600">{error}</div></div>;

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-6 py-10 max-w-xl">
				<h1 className="text-2xl font-bold mb-6">Nominate Yourself</h1>
				{policy && !accepted && (
					<div className="mb-6 p-4 bg-white rounded shadow">
						<h2 className="text-lg font-semibold mb-2">Nomination Policy</h2>
						<div className="text-gray-700 whitespace-pre-line mb-4">{policy.policy_text}</div>
						<button onClick={handleAcceptPolicy} className="bg-indigo-600 text-white px-4 py-2 rounded">Accept Policy</button>
					</div>
				)}
				{accepted && (
					<div className="mb-6 p-4 bg-white rounded shadow">
						<h2 className="text-lg font-semibold mb-2">Submit Nomination</h2>
						<label className="block mb-3">Manifesto
							<textarea value={manifesto} onChange={e=>setManifesto(e.target.value)} className="border p-2 w-full mt-1" placeholder="Enter your manifesto" />
						</label>
						<label className="block mb-3">Photo URL (optional)
							<input value={photoUrl} onChange={e=>setPhotoUrl(e.target.value)} className="border p-2 w-full mt-1" placeholder="Photo URL" />
						</label>
						<button onClick={handleNominate} className="bg-emerald-600 text-white px-4 py-2 rounded">Submit Nomination</button>
						{success && <div className="mt-3 text-green-600">{success}</div>}
						{error && <div className="mt-3 text-red-600">{error}</div>}
					</div>
				)}
			</div>
		</div>
	);
}
