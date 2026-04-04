'use client';

import { InspectionForm } from '@/components/forms/InspectionForm';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 py-10">
      <div className="container mx-auto px-4">
        <InspectionForm />
      </div>
    </div>
  );
}
