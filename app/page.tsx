'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Vapi from '@vapi-ai/web';

// Define the distinct states of the application
type ViewState = 'welcome' | 'active' | 'complete';

// --- INNER COMPONENT (Handles Logic & Params) ---
function VoiceInterface() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<ViewState>('welcome');
  const [isConnecting, setIsConnecting] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Ref to keep the Vapi instance persistent
  const vapiRef = useRef<any>(null);

  // Determine Assistant ID: URL Param > Env Var
  const assistantId = searchParams.get('assistantId') || process.env.NEXT_PUBLIC_ASSISTANT_ID;

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY) {
      setErrorMsg('Missing Public Key');
      return;
    }

    // Initialize Vapi
    const vapiInstance = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY as string);
    vapiRef.current = vapiInstance;

    // --- Event Listeners ---
    vapiInstance.on('call-start', () => {
      console.log('Call has started');
      setIsConnecting(false);
      setStatus('active');
    });

    vapiInstance.on('call-end', () => {
      console.log('Call has ended');
      setStatus('complete');
    });

    vapiInstance.on('volume-level', (level: number) => {
      setVolumeLevel(level);
    });

    vapiInstance.on('error', (e: any) => {
      console.error('Vapi Error:', e);
      setIsConnecting(false);
    });

    // Cleanup on unmount
    return () => {
      vapiInstance.stop();
    };
  }, []);

  const startInterview = async () => {
    if (!assistantId) {
      setErrorMsg('No Assistant ID found. Please check configuration.');
      return;
    }

    setIsConnecting(true);
    try {
      await vapiRef.current.start(assistantId);
    } catch (err) {
      console.error('Failed to start call', err);
      setIsConnecting(false);
    }
  };

  const endInterview = () => {
    vapiRef.current.stop();
  };

  // Error State
  if (errorMsg) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-900 text-red-400">
        <p>Error: {errorMsg}</p>
      </div>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 text-white p-4">
      
      {/* HEADER / BRANDING */}
      <div className="absolute top-8 text-center">
        <h1 className="text-2xl font-bold tracking-widest text-emerald-400">GROWtalent</h1>
        <p className="text-gray-500 text-sm">Automated Intake System</p>
      </div>

      {/* STATE 1: WELCOME SCREEN */}
      {status === 'welcome' && (
        <div className="text-center space-y-8 animate-fade-in">
          <div className="space-y-2">
            <h2 className="text-4xl font-semibold">2026 Strategy Interview</h2>
            <p className="text-gray-400 max-w-md mx-auto">
              I am Kyle's AI Digital Twin. I'd like to ask you a few questions about your goals 
              to see if we are a good fit.
            </p>
          </div>
          
          <button
            onClick={startInterview}
            disabled={isConnecting}
            className={`px-8 py-4 rounded-full text-lg font-bold transition-all transform hover:scale-105 ${
              isConnecting 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-400 shadow-lg shadow-emerald-500/20'
            }`}
          >
            {isConnecting ? 'Connecting...' : 'Start Interview'}
          </button>
        </div>
      )}

      {/* STATE 2: ACTIVE CALL (VISUALIZER) */}
      {status === 'active' && (
        <div className="relative flex items-center justify-center">
          {/* The Orb Visualizer */}
          <div 
            className="w-32 h-32 bg-emerald-500 rounded-full blur-xl absolute transition-transform duration-100 ease-out"
            style={{ 
              transform: `scale(${1 + volumeLevel * 5})`, 
              opacity: 0.6 
            }}
          />
          <div 
            className="w-24 h-24 bg-white rounded-full relative z-10 shadow-2xl flex items-center justify-center"
          >
             <div className="w-4 h-4 bg-emerald-900 rounded-full animate-pulse" />
          </div>

          <div className="absolute bottom-[-100px] text-center">
            <p className="text-gray-400 mb-4 text-sm tracking-wide">LISTENING...</p>
            <button 
              onClick={endInterview}
              className="px-6 py-2 border border-red-500/50 text-red-400 rounded-full hover:bg-red-500/10 transition-colors text-sm"
            >
              End Call
            </button>
          </div>
        </div>
      )}

      {/* STATE 3: COMPLETE */}
      {status === 'complete' && (
        <div className="text-center space-y-6 animate-fade-in">
          <div className="text-6xl">✅</div>
          <h2 className="text-3xl font-bold">Interview Complete</h2>
          <p className="text-gray-400 max-w-md mx-auto">
            Thank you. I have synced your responses to our CRM. 
            A member of my team will review your profile shortly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="text-emerald-400 hover:text-emerald-300 underline underline-offset-4"
          >
            Start Over
          </button>
        </div>
      )}
    </main>
  );
}

// --- MAIN PAGE COMPONENT (Suspense Wrapper) ---
export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 flex items-center justify-center text-emerald-500">Loading...</div>}>
      <VoiceInterface />
    </Suspense>
  );
}
