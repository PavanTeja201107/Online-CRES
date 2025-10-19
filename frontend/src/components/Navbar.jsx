import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar(){
	const { user, logout } = useAuth();
	const navigate = useNavigate();
	const [open, setOpen] = useState(false);
	const location = useLocation();

	// Close mobile nav when route changes
	useEffect(()=>{ setOpen(false); }, [location.pathname]);

	const handleLogout = () => {
		logout();
		if (user?.role === 'ADMIN') navigate('/admin/login');
		else navigate('/student/login');
	};

	const isAdmin = user?.role === 'ADMIN';

	const linkClass = ({isActive}) => `block px-3 py-2 rounded-md transition ${isActive ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`;

	const AdminMenu = () => (
		<nav className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm">
			<NavLink to="/admin/students" className={linkClass}>Students</NavLink>
			<NavLink to="/admin/classes" className={linkClass}>Classes</NavLink>
			<NavLink to="/admin/elections" className={linkClass}>Elections</NavLink>
			<NavLink to="/admin/nominations" className={linkClass}>Nominations</NavLink>
			<NavLink to="/admin/policy" className={linkClass}>Policy</NavLink>
			<NavLink to="/admin/results" className={linkClass}>Results</NavLink>
			<NavLink to="/admin/profile" className={linkClass}>Profile</NavLink>
		</nav>
	);

	const StudentMenu = () => (
		<nav className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-sm">
			<NavLink to="/student/election" className={linkClass}>Election</NavLink>
			<NavLink to="/student/nomination" className={linkClass}>Nomination</NavLink>
			<NavLink to="/student/vote" className={linkClass}>Vote</NavLink>
			<NavLink to="/student/results" className={linkClass}>Results</NavLink>
			<NavLink to="/student/profile" className={linkClass}>Profile</NavLink>
		</nav>
	);
	return (
		<header className="bg-white/90 backdrop-blur border-b shadow-sm sticky top-0 z-40">
			<div className="container mx-auto p-4">
				<div className="flex items-center justify-between">
					<Link to="/" className="flex items-center gap-3 no-underline">
						<div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-blue-500 rounded flex items-center justify-center text-white font-bold">CR</div>
						<div className="text-lg font-semibold text-gray-800">Class Representative Election System</div>
					</Link>
					{/* Mobile menu button */}
					{user && (
						<button className="md:hidden inline-flex items-center justify-center p-2 rounded border border-gray-300 text-gray-600" onClick={()=>setOpen(o=>!o)} aria-label="Toggle menu" aria-expanded={open} aria-controls="nav-menu">
							<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
								<path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
							</svg>
						</button>
					)}
				</div>

				{user && (
					<div id="nav-menu" className={`mt-3 md:mt-0 md:flex md:items-center md:justify-between ${open ? '' : 'hidden md:flex'}`}>
						<div className="md:mr-6">
							{isAdmin ? <AdminMenu/> : <StudentMenu/>}
						</div>
						<div className="mt-3 md:mt-0 flex items-center gap-3">
							<span className="hidden md:inline text-xs text-gray-600 px-2 py-1 rounded bg-gray-100">{user?.role}</span>
							<button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 transition text-white text-sm px-3 py-1 rounded">Logout</button>
						</div>
					</div>
				)}
			</div>
		</header>
	);
}
