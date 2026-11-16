import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const RoleContext = createContext();

export const RoleProvider = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Role: 'patient' | 'doctor' | 'lab'
  const [role, setRole] = useState(() => {
    if (location.pathname.startsWith('/doctor')) return 'doctor';
    if (location.pathname.startsWith('/lab')) return 'lab';
    return localStorage.getItem('portal_role') || 'patient';
  });

  useEffect(() => {
    if (location.pathname.startsWith('/doctor')) {
      setRole('doctor');
      localStorage.setItem('portal_role', 'doctor');
    } else if (location.pathname.startsWith('/lab')) {
      setRole('lab');
      localStorage.setItem('portal_role', 'lab');
    }
  }, [location.pathname]);

  const selectRole = (newRole) => {
    setRole(newRole);
    localStorage.setItem('portal_role', newRole);
    if (newRole === 'patient') navigate('/');
    else if (newRole === 'doctor') navigate('/doctor');
    else if (newRole === 'lab') navigate('/lab');
  };

  return (
    <RoleContext.Provider value={{ role, selectRole }}>
      {children}
    </RoleContext.Provider>
  );
};

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};
