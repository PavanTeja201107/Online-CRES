import React from 'react';
import { Link } from 'react-router-dom';

export default function Navbar(){
	return (
		<header className="bg-white p-4 shadow">
			<nav className="container mx-auto flex justify-between">
				<div className="font-bold">CRES</div>
				<div className="space-x-4">
					<Link to="/student/login" className="text-blue-600">Student</Link>
					<Link to="/admin/login" className="text-blue-600">Admin</Link>
				</div>
			</nav>
		</header>
	);
}
