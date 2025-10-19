import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getMyElections } from '../../api/electionApi';
import { getResults } from '../../api/voteApi';
import Select from '../../components/ui/Select';
import Alert from '../../components/ui/Alert';

export default function ResultsPage(){
	const [electionId, setElectionId] = useState('');
	const [elections, setElections] = useState([]);
	const [results, setResults] = useState([]);
	const [err, setErr] = useState('');
    const [message, setMessage] = useState('');

	useEffect(()=>{
		(async () => {
			try {
				const list = await getMyElections();
				setElections(list);
				const published = (list || []).filter(e => e.is_published);
				if (published.length) {
					setElectionId(String(published[0].election_id));
				}
			} catch (error) {
				setErr(error.response?.data?.error || 'No elections available');
			}
		})();
	},[]);

	useEffect(()=>{
		const load = async () => {
			setResults([]); setMessage('');
			if (!electionId) return;
			try {
				const r = await getResults(electionId);
				setResults(r || []);
				if (!r || r.length === 0) {
					setMessage('No votes recorded. Faculty advisor and HOD will decide next steps.');
				} else {
					const top = Math.max(...r.map(x=>x.votes));
					const ties = r.filter(x=>x.votes === top);
					if (top === 0) setMessage('No votes recorded. Faculty advisor and HOD will decide next steps.');
					else if (ties.length > 1) setMessage('Tie detected. Faculty advisor and HOD will resolve.');
				}
			} catch (error) {
				setErr(error.response?.data?.error || 'No results available');
			}
		};
		load();
	}, [electionId]);

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-6 py-8">
				<h1 className="text-2xl font-semibold mb-4">Results</h1>
				<div className="mb-4">
					<Select label="Select Election" value={electionId} onChange={e=>setElectionId(e.target.value)}>
						<option value="">-- Choose --</option>
						{(elections||[]).filter(e => e.is_published).map(e => (
							<option key={e.election_id} value={e.election_id}>Election #{e.election_id} — Voting ended {new Date(e.voting_end).toLocaleString()}</option>
						))}
					</Select>
				</div>
				{err && <div className="text-red-600 mb-2">{err}</div>}
				{message && <Alert kind="warning" className="mb-3">{message}</Alert>}
				<div className="bg-white rounded shadow">
					{results.map(r => (
						<div key={r.candidate_id} className="p-3 border-b flex items-center gap-4">
							{r.photo_url && <img src={r.photo_url} className="w-10 h-10 rounded object-cover" />}
							<div className="flex-1">
								<div className="font-semibold">{r.candidate_name} ({r.candidate_id})</div>
							</div>
							<div className="text-indigo-700 font-bold">{r.votes}</div>
						</div>
					))}
					{!results.length && !err && <div className="p-4 text-gray-600">No results.</div>}
				</div>
			</div>
		</div>
	);
}
