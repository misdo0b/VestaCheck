import React from 'react';
import { useFormContext } from 'react-hook-form';
import { InspectionFormData } from '@/lib/validations/inspection';

export const HeaderSection: React.FC = () => {
  const { register, formState: { errors } } = useFormContext<InspectionFormData>();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-8">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        🏠 Informations Générales
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Adresse de la propriété
          </label>
          <input
            {...register('propertyAddress')}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.propertyAddress ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ex: 123 Rue de Rivoli, Paris"
          />
          {errors.propertyAddress && (
            <p className="text-red-500 text-xs mt-1">{errors.propertyAddress.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nom du locataire
          </label>
          <input
            {...register('tenantName')}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.tenantName ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Nom Complet"
          />
          {errors.tenantName && (
            <p className="text-red-500 text-xs mt-1">{errors.tenantName.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email du locataire
          </label>
          <input
            {...register('tenantEmail')}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.tenantEmail ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="email@exemple.com"
          />
          {errors.tenantEmail && (
            <p className="text-red-500 text-xs mt-1">{errors.tenantEmail.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Téléphone du locataire
          </label>
          <input
            {...register('tenantPhone')}
            className={`w-full p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none ${
              errors.tenantPhone ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="06 00 00 00 00"
          />
          {errors.tenantPhone && (
            <p className="text-red-500 text-xs mt-1">{errors.tenantPhone.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type d'état des lieux
          </label>
          <select
            {...register('type')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Entrée">Entrée</option>
            <option value="Sortie">Sortie</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date de l'inspection
          </label>
          <input
            type="date"
            {...register('date')}
            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      </div>
    </div>
  );
};
