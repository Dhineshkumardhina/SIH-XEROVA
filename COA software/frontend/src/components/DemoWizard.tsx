import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';

/**
 * DemoWizard – guided demonstration flow for SIH.
 * It is displayed on the Dashboard when the URL contains `?demo=shared-block`.
 * The wizard walks through the predefined steps, showing WHAT, WHY and WHAT AI does.
 */
const steps = [
  {
    title: 'Dashboard',
    what: 'The main analytics view showing overall system status.',
    why: 'Provides a high‑level picture before diving into details.',
    ai: 'No AI action yet; just visual context.',
  },
  {
    title: 'Critical maintenance',
    what: 'Shows critical maintenance tasks flagged for immediate attention.',
    why: 'Critical tasks can block trains and must be scheduled first.',
    ai: 'AI will prioritize these tasks in the optimization stage.',
  },
  {
    title: 'Train traffic',
    what: 'Displays current and planned train movements across corridors.',
    why: 'Understanding traffic helps avoid conflicts with maintenance.',
    ai: 'AI analyzes traffic density to propose feasible windows.',
  },
  {
    title: 'Corridor',
    what: 'Shows corridor topology, capacity and current usage.',
    why: 'Corridor constraints limit how many blocks can be placed simultaneously.',
    ai: 'AI respects corridor capacity when generating shared blocks.',
  },
  {
    title: 'Department requests',
    what: 'Lists requests from different departments (e.g., Engineering, Signal).',
    why: 'All requests must be considered to generate a balanced plan.',
    ai: 'AI scores each request based on priority and impact.',
  },
  {
    title: 'Generate AI plan',
    what: 'Invokes the AI priority model to score tasks.',
    why: 'Creates a weighted list that the optimizer will consume.',
    ai: 'Rule‑based priority model returns explainable scores.',
  },
  {
    title: 'Optimization',
    what: 'Runs the OR‑Tools optimizer to produce a block plan.',
    why: 'Finds a feasible schedule that satisfies all constraints.',
    ai: 'Optimizer uses the AI‑generated scores as objective weights.',
  },
  {
    title: 'Recommended shared block',
    what: 'Shows the shared maintenance block recommended by the optimizer.',
    why: 'Shared blocks reduce downtime by combining compatible tasks.',
    ai: 'AI explains why the block is optimal (e.g., minimal train impact).',
  },
  {
    title: 'Simulation',
    what: 'Runs the digital‑twin simulation using the new plan.',
    why: 'Validates that the plan does not cause conflicts or excessive delays.',
    ai: 'Simulation reports delays and confirms constraint compliance.',
  },
  {
    title: 'Before vs After',
    what: 'Compares key metrics before and after applying the plan.',
    why: 'Demonstrates the tangible benefit of the shared‑block optimization.',
    ai: 'AI highlights improvements in delay reduction and block duration.',
  },
  {
    title: 'Control Officer approval',
    what: 'Shows the approval UI for the Control Officer role.',
    why: 'Ensures the plan is authorised before execution.',
    ai: 'No AI action; just RBAC‑protected approval step.',
  },
  {
    title: 'Updated analytics',
    what: 'Refreshes the dashboard with post‑approval analytics.',
    why: 'Shows the final state of the system after the plan is applied.',
    ai: 'AI updates forecasts based on the new schedule.',
  },
];

const DemoWizard: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);

  // Determine if we are in demo mode from query param
  const isDemo = new URLSearchParams(location.search).get('demo') === 'shared-block';

  useEffect(() => {
    if (!isDemo) return;
    // Initialise demo backend data once when wizard loads
    const initDemo = async () => {
      setLoading(true);
      try {
        await axios.post('/api/demo/start'); // proxy to FastAPI demo endpoint
      } catch (e) {
        console.error('Failed to initialise demo', e);
      } finally {
        setLoading(false);
      }
    };
    initDemo();
  }, [isDemo]);

  if (!isDemo) return null;

  const handleNext = () => {
    if (activeStep < steps.length - 1) setActiveStep(activeStep + 1);
    else navigate('/dashboard'); // after last step, stay on dashboard
  };

  const handleBack = () => {
    if (activeStep > 0) setActiveStep(activeStep - 1);
  };

  const current = steps[activeStep];

  return (
    <div className="max-w-2xl mx-auto p-4 mt-4 border border-gray-200 rounded-lg bg-white">
      <h2 className="text-xl font-semibold mb-4">
        SIH Demonstration – Step {activeStep + 1} of {steps.length}
      </h2>
      <nav className="flex mb-4 overflow-x-auto" aria-label="Demo steps">
        <ul className="flex space-x-2">
          {steps.map((step, idx) => (
            <li key={step.title} className={`px-2 py-1 rounded text-xs ${idx === activeStep ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
              {step.title}
            </li>
          ))}
        </ul>
      </nav>
      <section className="mt-3">
        <p className="text-sm text-gray-700"><strong>WHAT IS HAPPENING:</strong> {current.what}</p>
        <p className="text-sm text-gray-700 mt-2"><strong>WHY IT MATTERS:</strong> {current.why}</p>
        <p className="text-sm text-gray-700 mt-2"><strong>WHAT AI IS DOING:</strong> {current.ai}</p>
      </section>
      <div className="flex justify-between mt-4">
        <button
          className="px-3 py-1 border border-gray-300 rounded disabled:opacity-50"
          disabled={activeStep === 0}
          onClick={handleBack}
        >
          Back
        </button>
        <button
          className="px-4 py-1 bg-blue-600 text-white rounded disabled:opacity-50"
          onClick={handleNext}
          disabled={loading}
        >
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default DemoWizard;
