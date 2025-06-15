import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, Spinner, Center } from '@chakra-ui/react';

// Protected route that requires authentication
export const PrivateRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" />;
};

// Route that requires admin role
export const AdminRoute = () => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return user && isAdmin() ? <Outlet /> : <Navigate to="/dashboard" />;
};

// Route that requires manager role or higher
export const ManagerRoute = () => {
  const { user, loading, isManager } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return user && isManager() ? <Outlet /> : <Navigate to="/dashboard" />;
};

// Route for non-authenticated users only (e.g., login page)
export const PublicRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="brand.500" />
      </Center>
    );
  }

  return !user ? <Outlet /> : <Navigate to="/dashboard" />;
};
