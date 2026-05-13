'use client';

import React from 'react';

interface LandingScreenProps {
  onConnect: () => void;
}

const LandingScreen: React.FC<LandingScreenProps> = ({ onConnect }) => {
  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-2xl w-full">
        {/* HSBC Logo Placeholder / Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-16 h-16 bg-red-600 flex items-center justify-center rounded-lg shadow-lg shadow-red-900/20 transform rotate-45">
            <div className="w-8 h-8 bg-white transform -rotate-45"></div>
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-gray-100 mb-6 tracking-tight">
          Smarter Sharing with <span className="text-red-600">Friend&apos;s Legger</span>
        </h1>
        
        <p className="text-xl text-gray-400 mb-12 leading-relaxed">
          The ultimate AI-powered companion for managing shared expenses. 
          Connect your HSBC account to automatically track, split, and settle debts with ease.
        </p>

        <div className="bg-gray-900/50 border border-gray-800 rounded-2xl p-8 mb-12 backdrop-blur-sm">
          <div className="flex flex-col md:flex-row gap-8 text-left">
            <div className="flex-1">
              <h3 className="text-gray-100 font-bold mb-2">Secure Connection</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                We use the HSBC AI Agentic Gateway to ensure your data is encrypted and handled with the highest security standards.
              </p>
            </div>
            <div className="flex-1">
              <h3 className="text-gray-100 font-bold mb-2">Automated Splitting</h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Our AI identifies shared meals, trips, and bills, suggesting splits so you don&apos;t have to manually enter everything.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onConnect}
          className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-red-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-600 hover:bg-red-700 w-full md:w-auto"
        >
          Connect your HSBC Account
          <svg 
            className="w-5 h-5 ml-2 -mr-1 transition-transform group-hover:translate-x-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </button>

        <p className="mt-8 text-xs text-gray-500">
          By connecting, you agree to our Terms of Service and Privacy Policy. 
          For demonstration purposes only.
        </p>
      </div>
    </div>
  );
};

export default LandingScreen;
