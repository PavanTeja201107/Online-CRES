import React, { useEffect, useState } from 'react';
import Navbar from '../../components/Navbar';
import { getAuditLogs } from '../../api/auditApi';

export default function AuditLogs(){
	const [logs, setLogs] = useState([]);
	const [err, setErr] = useState('');

	useEffect(()=>{
		(async()=>{
			try{ const data = await getAuditLogs(); setLogs(data || []); }
			catch(e){ setErr(e.response?.data?.error || 'Failed to load'); }
		})();
	},[]);

	return (
		<div className="min-h-screen bg-gray-50">
			<Navbar />
			<div className="container mx-auto px-6 py-8">
				<h1 className="text-2xl font-bold mb-4">Audit Logs</h1>
				{err && <div className="text-red-600 mb-2">{err}</div>}
				<div className="bg-white rounded shadow overflow-auto">
					<table className="min-w-full text-sm">
						<thead>
							<tr className="bg-gray-100 text-left">
								<th className="p-2">Timestamp</th>
								<th className="p-2">User</th>
								<th className="p-2">Role</th>
								<th className="p-2">Action</th>
								<th className="p-2">Meta</th>
							</tr>
						</thead>
						<tbody>
							{logs.map(l => (
								<tr key={l.id || `${l.user_id}-${l.timestamp}-${l.action_type}`} className="border-b">
									<td className="p-2 whitespace-nowrap">{new Date(l.timestamp).toLocaleString()}</td>
									<td className="p-2">{l.user_id}</td>
									<td className="p-2">{l.role}</td>
									<td className="p-2">{l.action_type}</td>
									<td className="p-2 max-w-[400px] truncate" title={typeof l.meta === 'string' ? l.meta : JSON.stringify(l.meta)}>
										{typeof l.meta === 'string' ? l.meta : JSON.stringify(l.meta)}
									</td>
								</tr>
							))}
							{!logs.length && (
								<tr><td className="p-4 text-gray-600" colSpan={5}>No logs.</td></tr>
							)}
						</tbody>
					</table>
				</div>
			</div>
		</div>
	);
}
