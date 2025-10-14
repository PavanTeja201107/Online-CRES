import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "./pages/auth/AdminLogin";
import AdminDashboard from "./pages/admin/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentArea from "./pages/StudentArea";

function Landing(){
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="p-8 bg-white rounded shadow text-center">
        <h1 className="text-2xl font-bold mb-4">Welcome to CRES</h1>
        <div className="space-x-4">
          <a href="/admin/login" className="text-blue-600 underline">Admin Login</a>
          <a href="/student/login" className="text-blue-600 underline">Student Login</a>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      {/* default -> simple landing to choose admin/student */}
      <Route path="/" element={<Landing />} />

      <Route path="/admin/login" element={<AdminLogin />} />
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute role="ADMIN">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      {/* student area mounted under /student */}
      <Route path="/student/*" element={<StudentArea />} />

      <Route path="*" element={<div>Page Not Found</div>} />
    </Routes>
  );
}
