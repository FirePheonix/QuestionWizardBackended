import React from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { SignIn, SignUp } from '@clerk/clerk-react';

import Layout from './pages/Layout';
import DashboardPage from './pages/DashboardPage';
import WizardPage from './pages/WizardPage';

function App() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 font-inter">
      <Routes>
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" afterSignInUrl="/dashboard" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" signInUrl="/sign-in" afterSignUpUrl="/dashboard" />} />
        
        <Route element={<Layout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/wizard" element={<WizardPage />} />
        </Route>
      </Routes>
    </div>
  );
}

export default App;
