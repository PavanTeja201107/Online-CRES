import React from 'react';
import { Routes, Route } from 'react-router-dom';
import StudentLogin from './student/StudentLogin';
import StudentDashboard from './student/StudentDashboard';
// import StudentElections from './student/StudentElections'; // Not implemented
// import StudentNominations from './student/StudentNominations'; // Not implemented
// import Vote from './student/Vote'; // Not implemented
import StudentProfile from './student/StudentProfile';
import VerifyOtp from './auth/VerifyOtp';

export default function StudentArea(){
  return (
    <Routes>
      <Route path="login" element={<StudentLogin/>} />
      <Route path="verify-otp" element={<VerifyOtp/>} />
      <Route path="dashboard" element={<StudentDashboard/>} />
      {/* <Route path="elections/:id" element={<StudentElections/>} /> */}
      {/* <Route path="elections/:id/vote" element={<Vote/>} /> */}
      {/* <Route path="nominations" element={<StudentNominations/>} /> */}
      {/* <Route path="profile" element={<StudentProfile/>} /> */}
    </Routes>
  )
}