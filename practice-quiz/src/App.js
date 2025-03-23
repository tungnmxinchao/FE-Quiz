import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Login from './pages/Login';
import QuizList from './pages/QuizList';
import QuizAttempt from './pages/QuizAttempt';
import QuizResult from './pages/QuizResult';
import QuizHistory from './pages/QuizHistory';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/dashboard/UserManagement';
import SubjectManagement from './pages/dashboard/SubjectManagement';
import QuizManagement from './pages/dashboard/QuizManagement';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/subject/:subjectId/quizzes" element={<QuizList />} />
        <Route path="/quiz/:quizId" element={<QuizAttempt />} />
        <Route path="/quiz/:quizId/result" element={<QuizResult />} />
        <Route path="/history" element={<QuizHistory />} />
        <Route path="/profile" element={<Profile />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/users" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <UserManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/subjects" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <SubjectManagement />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/quizzes" 
          element={
            <ProtectedRoute allowedRole="teacher">
              <QuizManagement />
            </ProtectedRoute>
          } 
        />
        <Route path="/" element={<Navigate to="/home" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
