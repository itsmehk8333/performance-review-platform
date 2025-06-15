import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChakraProvider } from '@chakra-ui/react';
import theme from './theme';
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute, PublicRoute, AdminRoute, ManagerRoute } from './components/RouteGuards';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Goals from './pages/Goals';
import GoalDetail from './pages/GoalDetail';
import Feedback from './pages/Feedback';
import Reviews from './pages/Reviews';
import ReviewDetail from './pages/ReviewDetail';
import ReviewDashboard from './pages/ReviewDashboard';
import ReviewTemplates from './pages/ReviewTemplates';
import ReviewCycles from './pages/ReviewCycles';
import Exports from './pages/Exports';
import OrgChart from './pages/OrgChart';

function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
            </Route>
            
            {/* Private routes */}
            <Route element={<PrivateRoute />}>              <Route path="/dashboard" element={<Dashboard />} />
                {/* Goals routes */}
              <Route path="/goals" element={<Goals />} />
              <Route path="/goals/:id" element={<GoalDetail />} />
                {/* Feedback routes */}
              <Route path="/feedback" element={<Feedback />} />
                {/* Review routes */}
              <Route path="/reviews" element={<Reviews />} />
              <Route path="/reviews/dashboard" element={<ReviewDashboard />} />
              <Route path="/reviews/:id" element={<ReviewDetail />} />
            </Route>            {/* Admin and Manager routes */}            <Route element={<ManagerRoute />}>
              <Route path="/reviews/templates" element={<ReviewTemplates />} />
              <Route path="/reviews/cycles" element={<ReviewCycles />} />
              <Route path="/exports" element={<Exports />} />
            </Route>
            
            {/* Admin-only routes */}
            <Route element={<AdminRoute />}>
              <Route path="/org-chart" element={<OrgChart />} />
            </Route>
            
            {/* Default redirect */}
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </AuthProvider>
      </Router>
    </ChakraProvider>
  );
}

export default App;
