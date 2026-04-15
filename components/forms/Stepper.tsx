import React from 'react';
import { Check } from 'lucide-react';

interface Step {
  id: number;
  label: string;
}

interface StepperProps {
  currentStep: number;
  steps: Step[];
}

export const Stepper: React.FC<StepperProps> = ({ currentStep, steps }) => {
  const progress = (currentStep / (steps.length - 1)) * 100;

  return (
    <div className="mb-8 px-4">
      {/* Barre de progression linéaire */}
      <div className="relative h-1 w-full bg-white/5 rounded-full mb-8 overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)] transition-all duration-500 ease-in-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Cercles d'étapes */}
      <div className="flex justify-between items-start relative max-w-4xl mx-auto">
        {steps.map((step, index) => {
          const isCompleted = currentStep > index;
          const isActive = currentStep === index;

          return (
            <div key={step.id} className="flex flex-col items-center group relative z-10 w-1/4">
              <div 
                className={`
                  w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-300
                  ${isCompleted ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-600/20' : 
                    isActive ? 'bg-slate-900 border-blue-500 ring-4 ring-blue-500/10' : 
                    'bg-slate-950 border-white/10 text-slate-600'}
                `}
              >
                {isCompleted ? (
                  <Check className="text-white" size={20} />
                ) : (
                  <span className={`text-sm font-bold ${isActive ? 'text-blue-400' : ''}`}>
                    {step.id}
                  </span>
                )}
              </div>
              
              <div className="mt-3 text-center">
                <p className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'text-blue-400' : isCompleted ? 'text-slate-300' : 'text-slate-600'}`}>
                  {step.label}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
