import React, { useState, useRef, useCallback } from 'react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import type { PlantAnalysisResponse } from '../../api/types';

interface PlantIdentificationProps {
  onAnalysisComplete: (result: PlantAnalysisResponse) => void;
  onError: (error: string) => void;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

type OrganType = 'leaf' | 'flower' | 'fruit' | 'bark';

export const PlantIdentification: React.FC<PlantIdentificationProps> = ({
  onAnalysisComplete,
  onError,
  isLoading,
  setIsLoading,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOrgans, setSelectedOrgans] = useState<OrganType[]>(['leaf']);
  const [maxCompounds, setMaxCompounds] = useState(5);
  const [enablePredictions, setEnablePredictions] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file (JPEG or PNG)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      onError('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [onError]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const toggleOrgan = (organ: OrganType) => {
    setSelectedOrgans(prev => {
      if (prev.includes(organ)) {
        // Don't allow empty selection
        if (prev.length === 1) return prev;
        return prev.filter(o => o !== organ);
      }
      return [...prev, organ];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      onError('Please select an image first');
      return;
    }

    setIsLoading(true);

    try {
      // Import dynamically to reduce initial bundle
      const { analyzePlantUpload } = await import('../../api/plantApi');

      const result = await analyzePlantUpload(
        selectedFile,
        selectedOrgans,
        maxCompounds,
        enablePredictions
      );

      onAnalysisComplete(result);
    } catch (err) {
      onError(err instanceof Error ? err.message : 'Plant analysis failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedOrgans(['leaf']);
    setMaxCompounds(5);
    setEnablePredictions(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const organs: { id: OrganType; label: string; icon: string }[] = [
    { id: 'leaf', label: 'Leaf', icon: '🍃' },
    { id: 'flower', label: 'Flower', icon: '🌸' },
    { id: 'fruit', label: 'Fruit', icon: '🍎' },
    { id: 'bark', label: 'Bark', icon: '🪵' },
  ];

  return (
    <Card className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
            Identify Plant from Photo
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Upload a photo of a plant to identify its species and analyze its medicinal compounds.
          </p>
        </div>

        {/* Image Upload Area */}
        <div
          className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            dragActive
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : previewUrl
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
              : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 dark:hover:border-primary-500'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/jpg"
            onChange={handleFileInputChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />

          {previewUrl ? (
            <div className="space-y-4">
              <img
                src={previewUrl}
                alt="Selected plant"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {selectedFile?.name}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl">📷</div>
              <div>
                <p className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Drop your plant photo here
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  or click to browse (JPEG, PNG, max 10MB)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Plant Organs Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            What part of the plant is visible?
          </label>
          <div className="flex flex-wrap gap-2">
            {organs.map((organ) => (
              <button
                key={organ.id}
                type="button"
                onClick={() => toggleOrgan(organ.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedOrgans.includes(organ.id)
                    ? 'bg-primary-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className="mr-1">{organ.icon}</span>
                {organ.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Helps improve identification accuracy
          </p>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compounds to analyze: {maxCompounds}
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={maxCompounds}
              onChange={(e) => setMaxCompounds(parseInt(e.target.value))}
              className="w-32 h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="flex items-center">
            <input
              id="plant-predictions"
              type="checkbox"
              checked={enablePredictions}
              onChange={(e) => setEnablePredictions(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
            />
            <label htmlFor="plant-predictions" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Enable ML predictions
              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Includes predicted targets (longer analysis time)
              </span>
            </label>
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!selectedFile || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Analyzing Plant...' : 'Identify & Analyze'}
          </Button>
          {selectedFile && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleClear}
              disabled={isLoading}
            >
              Clear
            </Button>
          )}
        </div>

        {/* Info Box */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm">
          <p className="font-medium text-blue-900 dark:text-blue-400 mb-1">How it works:</p>
          <ol className="list-decimal list-inside text-blue-800 dark:text-blue-300 space-y-1">
            <li>PlantNet AI identifies the plant species from your photo</li>
            <li>We look up known medicinal compounds for that plant</li>
            <li>Each compound is analyzed through ChEMBL for biological pathways</li>
            <li>Results show how plant compounds may affect your body</li>
          </ol>
        </div>
      </form>
    </Card>
  );
};
