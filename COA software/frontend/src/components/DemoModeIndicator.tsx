import React from 'react';
import { useDemoStore } from '../store/demoStore';
// import { useLocation } from 'react-router-dom'; // removed unused importoStore';
// import { Badge } from './ui/Badge'; // removed unused import

export const DemoModeIndicator: React.FC = () => {
  const { isDemoActive, toggleDemoMode } = useDemoStore();

  if (!isDemoActive) return null;

  return (
    <div
      className="px-2.5 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-[10px] font-mono font-semibold uppercase flex items-center gap-1.5 cursor-pointer"
      onClick={toggleDemoMode}
      title="Click to exit demo mode"
    >
      <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-ping" />
      DEMO MODE (click to exit)
    </div>
  );
};
