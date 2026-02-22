import React, { useState, useEffect } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { AutocompleteInput } from '../common/AutocompleteInput';

export interface Medication {
  id: string;
  name: string;
  addedAt: string;
}

interface MedicationListManagerProps {
  medications: Medication[];
  onMedicationsChange: (medications: Medication[]) => void;
}

const STORAGE_KEY = 'biopath-medications';

export const MedicationListManager: React.FC<MedicationListManagerProps> = ({
  medications,
  onMedicationsChange,
}) => {
  const [medicationInput, setMedicationInput] = useState('');

  // Load medications from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        onMedicationsChange(parsed);
      }
    } catch (error) {
      console.error('Failed to load medications from localStorage:', error);
    }
  }, []);

  // Save medications to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(medications));
    } catch (error) {
      console.error('Failed to save medications to localStorage:', error);
    }
  }, [medications]);

  const handleAddMedication = () => {
    const trimmed = medicationInput.trim();
    if (!trimmed) return;

    if (medications.some((m) => m.name.toLowerCase() === trimmed.toLowerCase())) {
      alert('This medication is already in your list');
      return;
    }

    const newMedication: Medication = {
      id: `med_${Date.now()}`,
      name: trimmed,
      addedAt: new Date().toISOString(),
    };

    onMedicationsChange([...medications, newMedication]);
    setMedicationInput('');
  };

  const handleRemoveMedication = (id: string) => {
    onMedicationsChange(medications.filter((m) => m.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm('Are you sure you want to remove all medications?')) {
      onMedicationsChange([]);
    }
  };

  const handleSelectMedication = (name: string) => {
    setMedicationInput(name);
  };

  return (
    <Card className="max-w-lg mx-auto">
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1.5">
            My Medications
          </h2>
          <p className="text-sm text-slate-400">
            Add medications to check for interactions when analyzing compounds.
          </p>
        </div>

        {/* Medication List */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Your Medications ({medications.length})
          </label>

          {medications.length > 0 ? (
            <div className="space-y-2 mb-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-200 text-sm truncate">{med.name}</p>
                    <p className="text-xs text-slate-500">
                      Added {new Date(med.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="ml-3 p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0"
                    aria-label="Remove medication"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-5 bg-primary-500/5 border border-primary-500/10 rounded-xl text-center mb-4">
              <p className="text-sm text-slate-400">
                No medications added yet. Add your medications to get personalized interaction warnings.
              </p>
            </div>
          )}
        </div>

        {/* Add Medication Input */}
        <div>
          <label htmlFor="medication" className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Add Medication
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <AutocompleteInput
                value={medicationInput}
                onChange={setMedicationInput}
                onSelect={handleSelectMedication}
                placeholder="e.g., Lisinopril, Metformin..."
              />
            </div>
            <Button
              type="button"
              onClick={handleAddMedication}
              variant="primary"
              size="md"
              className="flex-shrink-0"
            >
              Add
            </Button>
          </div>
        </div>

        {/* Actions */}
        {medications.length > 0 && (
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-xs text-slate-500">
              {medications.length} medication{medications.length !== 1 ? 's' : ''} saved
            </span>
            <button
              onClick={handleClearAll}
              className="text-xs text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {medications.length > 0 && (
          <p className="text-xs text-slate-500">
            Analyze any compound or plant to see interactions with your medications.
          </p>
        )}

        {/* Info Box */}
        <div className="glass rounded-xl p-4">
          <p className="text-xs text-amber-400/80">
            <strong>Important:</strong> This tool is for educational purposes only.
            Always consult your healthcare provider before combining medications.
          </p>
        </div>
      </div>
    </Card>
  );
};

export const exportMedications = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.stringify(JSON.parse(stored), null, 2) : '[]';
  } catch {
    return '[]';
  }
};

export const importMedications = (jsonString: string): Medication[] => {
  try {
    const parsed = JSON.parse(jsonString);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    throw new Error('Invalid medication list format');
  } catch (error) {
    console.error('Failed to import medications:', error);
    return [];
  }
};
