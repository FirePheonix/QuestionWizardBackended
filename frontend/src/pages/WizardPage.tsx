import React from 'react';
import AIQuestionWizard from '../components/AIQuestionWizard';
import { useNavigate } from 'react-router-dom';

const WizardPage: React.FC = () => {
  const navigate = useNavigate();

  const handleComplete = (data: any) => {
    console.log('Wizard completed with data:', data);
    alert('Generation Complete! You will now be returned to the dashboard.');
    navigate('/dashboard');
  };

  const handleCancel = () => {
    console.log('Wizard cancelled');
    navigate('/dashboard');
  };

  return (
    <AIQuestionWizard 
      onComplete={handleComplete}
      onCancel={handleCancel}
    />
  );
};

export default WizardPage;
