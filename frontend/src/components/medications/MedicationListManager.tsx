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

    // Check if medication already exists
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
    <Card className="max-w-2xl mx-auto">
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            💊 My Medications
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Add your current medications to check for interactions when analyzing compounds or plants.
          </p>
        </div>

        {/* Medication List */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Your Medications ({medications.length})
          </label>

          {medications.length > 0 ? (
            <div className="space-y-2 mb-4">
              {medications.map((med) => (
                <div
                  key={med.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">💊</span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{med.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Added {new Date(med.addedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveMedication(med.id)}
                    className="px-3 py-1 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-center mb-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                No medications added yet. Add your medications to get personalized drug interaction warnings.
              </p>
            </div>
          )}
        </div>

        {/* Add Medication Input */}
        <div>
          <label htmlFor="medication" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Add Medication
          </label>
          <div className="flex gap-2">
            <div className="flex-1">
              <AutocompleteInput
                value={medicationInput}
                onChange={setMedicationInput}
                onSelect={handleSelectMedication}
                placeholder="Enter medication name (e.g., Lisinopril, Metformin)..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Press Enter or click Add to add medication to your list.
              </p>
            </div>
            <div className="flex items-end">
              <Button
                type="button"
                onClick={handleAddMedication}
                variant="primary"
                size="md"
              >
                + Add
              </Button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex gap-3 w-full">
            <Button
              type="button"
              onClick={handleClearAll}
              variant="outline"
              size="md"
              disabled={medications.length === 0}
            >
              Clear All
            </Button>
            {medications.length > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center flex-1">
                {medications.length} medication{medications.length !== 1 ? 's' : ''} saved
              </div>
            )}
          </div>
        </div>

        {medications.length > 0 && (
          <div className="pt-4">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Now you can analyze any compound or plant, and see how it interacts with your medications.
            </p>
          </div>
        )}

        {/* Info Box */}
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-sm text-yellow-800 dark:text-yellow-300">
            <strong>⚠️ Important:</strong> This tool provides information about potential drug interactions for educational purposes only.
            Always consult with your healthcare provider before combining medications or botanical supplements.
          </p>
        </div>
      </div>
    </Card>
  );
};

// Utility function to export medications (for potential future use)
export const exportMedications = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.stringify(JSON.parse(stored), null, 2) : '[]';
  } catch {
    return '[]';
  }
};

// Utility function to import medications
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
