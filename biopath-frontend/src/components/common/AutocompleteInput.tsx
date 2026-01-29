import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { usePubChemSearch } from '../../hooks/usePubChemSearch';
import { LoadingSpinner } from './LoadingSpinner';

interface AutocompleteInputProps {
  value: string;
  onChange: (value: string) => void;
  onSelect: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  value,
  onChange,
  onSelect,
  placeholder = 'Type to search...',
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(value);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

  // Fetch suggestions from PubChem
  const { data: suggestions = [], isLoading } = usePubChemSearch(debouncedValue, isOpen);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(newValue.length >= 2);
  };

  const handleSelectSuggestion = (suggestion: string) => {
    onSelect(suggestion);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={clsx('relative', className)}>
      <input
        type="text"
        value={value}
        onChange={handleInputChange}
        onFocus={() => value.length >= 2 && setIsOpen(true)}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200"
      />

      {isOpen && debouncedValue.length >= 2 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-500">Searching...</span>
            </div>
          ) : suggestions.length > 0 ? (
            <ul className="py-1">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  onClick={() => handleSelectSuggestion(suggestion.name)}
                  className="px-4 py-2 hover:bg-primary-50 cursor-pointer transition-colors duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-gray-900">{suggestion.name}</span>
                    {suggestion.cid && (
                      <span className="text-xs text-gray-500">CID: {suggestion.cid}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-gray-500 text-center">
              No compounds found
            </div>
          )}
        </div>
      )}
    </div>
  );
};
