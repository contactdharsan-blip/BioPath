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

type OrganType = 'leaf' | 'flower' | 'fruit' | 'bark' | 'root';

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      onError('Please select an image file (JPEG or PNG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      onError('Image file is too large. Maximum size is 10MB.');
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  }, [onError]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const toggleOrgan = (organ: OrganType) => {
    setSelectedOrgans(prev => {
      if (prev.includes(organ)) {
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
    { id: 'root', label: 'Root', icon: '🥕' },
  ];

  return (
    <Card className="max-w-lg mx-auto">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 mb-1.5">
            Identify Plant
          </h2>
          <p className="text-sm text-slate-400">
            Upload a photo to identify species and analyze medicinal compounds.
          </p>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/jpg"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Image Preview or Upload Button */}
        {previewUrl ? (
          <div className="border border-green-500/30 bg-green-500/5 rounded-2xl p-4 sm:p-6 text-center">
            <img
              src={previewUrl}
              alt="Selected plant"
              className="max-h-48 sm:max-h-64 mx-auto rounded-xl mb-3 object-cover"
            />
            <p className="text-xs text-slate-400 mb-2 truncate">
              {selectedFile?.name}
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
            >
              Change Photo
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border border-dashed border-white/10 hover:border-primary-500/30 rounded-2xl p-8 sm:p-10 text-center bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-primary-500/10 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-500/15 transition-colors">
              <svg className="w-7 h-7 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm font-medium text-slate-300 mb-1">Upload a plant photo</p>
            <p className="text-xs text-slate-500">JPEG or PNG, max 10MB</p>
          </button>
        )}

        {/* Plant Organs Selection */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">
            Visible plant part
          </label>
          <div className="flex flex-wrap gap-2">
            {organs.map((organ) => (
              <button
                key={organ.id}
                type="button"
                onClick={() => toggleOrgan(organ.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 min-h-[40px] ${
                  selectedOrgans.includes(organ.id)
                    ? 'bg-primary-500/20 text-primary-300 border border-primary-500/30'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:border-white/10'
                }`}
              >
                <span className="mr-1">{organ.icon}</span>
                {organ.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-sm text-slate-300">
              Compounds: <span className="text-primary-400 font-medium">{maxCompounds}</span>
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={maxCompounds}
              onChange={(e) => setMaxCompounds(parseInt(e.target.value))}
              className="w-28 sm:w-36 h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary-500"
            />
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enablePredictions}
              onChange={(e) => setEnablePredictions(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5 text-primary-500 focus:ring-primary-500/30 focus:ring-offset-0"
            />
            <div>
              <span className="text-sm text-slate-300">Enable ML predictions</span>
              <span className="block text-xs text-slate-500">
                Includes predicted targets (longer analysis)
              </span>
            </div>
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-3 pt-1">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={isLoading}
            disabled={!selectedFile || isLoading}
            className="flex-1"
          >
            {isLoading ? 'Analyzing...' : 'Identify & Analyze'}
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
        <div className="glass rounded-xl p-4 text-xs">
          <p className="font-medium text-slate-300 mb-2">How it works</p>
          <ol className="list-decimal list-inside text-slate-400 space-y-1">
            <li>PlantNet AI identifies the plant species</li>
            <li>Known medicinal compounds are looked up</li>
            <li>Each compound is analyzed through ChEMBL</li>
            <li>Results show effects on your body</li>
          </ol>
        </div>
      </form>
    </Card>
  );
};
