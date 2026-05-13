'use client';

import React, { useState, useMemo } from 'react';

interface AuthSimulationProps {
  onComplete: () => void;
  onCancel: () => void;
}

type AuthStep = 'confirm' | 'success';

const AuthSimulation: React.FC<AuthSimulationProps> = ({ onComplete, onCancel }) => {
  const [step, setStep] = useState<AuthStep>('confirm');

  // Use fixed demo values for the "request details" to match the professional look
  const currentDate = useMemo(() => {
    const now = new Date();
    return now.toLocaleString('en-GB', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }).replace(',', ' at');
  }, []);

  const handleApprove = () => {
    setStep('success');
    // Auto-transition back after success message
    setTimeout(() => {
      onComplete();
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans">
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        <div className="max-w-sm w-full">
          {step === 'confirm' && (
            <div className="animate-in fade-in duration-500 flex flex-col items-start">
              {/* Graphic Placeholder (Simplified SVG to match the image concept) */}
              <div className="mb-10 w-full flex justify-center">
                <svg width="240" height="140" viewBox="0 0 240 140" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Computer Monitor */}
                  <rect x="30" y="45" width="56" height="38" rx="4" stroke="#E5E7EB" strokeWidth="2"/>
                  <path d="M48 83L45 92H71L68 83" stroke="#E5E7EB" strokeWidth="2"/>
                  <circle cx="58" cy="55" r="7" stroke="#374151" strokeWidth="1.5"/>
                  <path d="M52 64C52 64 54 66 58 66C62 66 64 64 64 64" stroke="#374151" strokeWidth="1.5"/>
                  <rect x="52" y="68" width="12" height="10" rx="2" stroke="#374151" strokeWidth="1.5"/>
                  
                  {/* Dotted Connection */}
                  <path d="M96 70H124" stroke="#D1D5DB" strokeWidth="2" strokeDasharray="4 4"/>
                  
                  {/* Phone */}
                  <rect x="135" y="25" width="60" height="95" rx="10" stroke="#374151" strokeWidth="2"/>
                  <rect x="145" y="45" width="40" height="24" rx="2" stroke="#374151" strokeWidth="1"/>
                  
                  {/* Small Icons in Phone Mockup */}
                  <g transform="translate(148, 48)">
                    <rect width="10" height="10" rx="1" fill="#DB0011" opacity="0.1"/>
                    <path d="M2 5L4 7L8 3" stroke="#DB0011" strokeWidth="1.5"/>
                  </g>
                  <g transform="translate(172, 48)">
                    <path d="M2 2L8 8M8 2L2 8" stroke="#EF4444" strokeWidth="1.5"/>
                  </g>
                </svg>
              </div>

              <h1 className="text-[22px] font-bold text-zinc-900 mb-6 leading-tight">
                HSBC Log on request by Preplexity
              </h1>

              <div className="space-y-2 text-[15px] text-gray-600 mb-16">
                <div className="flex gap-2">
                  <span className="font-normal min-w-[65px]">Browser:</span>
                  <span className="font-medium text-gray-900">Chrome 124.0.0.0</span>
                </div>
                <div className="flex gap-2">
                  <span className="font-normal min-w-[65px]">Date:</span>
                  <span className="font-medium text-gray-900">{currentDate}</span>
                </div>
              </div>

              <div className="w-full space-y-4">
                <button
                  onClick={handleApprove}
                  className="w-full bg-[#db0011] text-white font-bold py-[14px] text-[16px] transition-all hover:bg-[#b2000e] active:scale-[0.98]"
                >
                  Approve
                </button>
                <button
                  onClick={onCancel}
                  className="w-full bg-white text-gray-900 border border-gray-900 font-bold py-[14px] text-[16px] transition-all hover:bg-gray-50 active:scale-[0.98]"
                >
                  Reject
                </button>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="animate-in zoom-in-95 fade-in duration-500 flex flex-col items-center text-center">
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-10">
                <svg className="w-10 h-10 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              
              <h1 className="text-[24px] font-bold text-gray-900 mb-3">Request approved</h1>
              <p className="text-gray-500 text-[16px]">Your approval request has been completed.</p>
              
              <div className="mt-16 w-full h-[1px] bg-gray-100"></div>
              <button 
                onClick={onComplete}
                className="mt-8 text-gray-400 font-medium hover:text-gray-600 transition-colors"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Footer Visual Identity */}
      <div className="p-8 flex justify-center opacity-10">
        <div className="w-6 h-6 bg-red-600 rotate-45 flex items-center justify-center">
          <div className="w-3 h-3 bg-white -rotate-45"></div>
        </div>
      </div>
    </div>
  );
};

export default AuthSimulation;
