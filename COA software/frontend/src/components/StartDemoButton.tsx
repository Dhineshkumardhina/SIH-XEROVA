import React from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * START SIH DEMO – resets demo state server‑side, flags demo mode, then opens the dashboard.
 */
const StartDemoButton: React.FC = () => {
  const navigate = useNavigate();

  const handleStartDemo = async () => {
    try {
      // Reset and load synthetic scenario on backend
      await axios.post('/api/demo/start');
    } catch (e) {
      console.error('Demo init failed', e);
    }
    // Flag demo mode client‑side
    localStorage.setItem('demoMode', 'true');
    // Navigate to dashboard with demo query param
    navigate('/dashboard?demo=shared-block');
  };

  return (
    <button
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
      onClick={handleStartDemo}
    >
      START SIH DEMO
    </button>
  );
};

export default StartDemoButton;
