import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children, allowedRole }) => {
    const userRole = localStorage.getItem('userRole');
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRole && userRole !== allowedRole) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default ProtectedRoute; 