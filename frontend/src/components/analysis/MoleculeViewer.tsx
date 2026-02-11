import React, { useEffect, useRef, useState } from 'react';
import { Card } from '../common/Card';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { CompoundIdentity } from '../../api/types';

// Import 3Dmol
import * as $3Dmol from '3dmol';

interface MoleculeViewerProps {
  compound: CompoundIdentity;
}

export const MoleculeViewer: React.FC<MoleculeViewerProps> = ({ compound }) => {
  const viewerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewerInstance, setViewerInstance] = useState<$3Dmol.GLViewer | null>(null);

  useEffect(() => {
    if (!viewerRef.current) return;

    // Clear previous viewer
    if (viewerInstance) {
      viewerInstance.clear();
    }

    setIsLoading(true);
    setError(null);

    // Create the 3D viewer
    const viewer = $3Dmol.createViewer(viewerRef.current, {
      backgroundColor: 'white',
    });
    setViewerInstance(viewer);

    // Function to load molecule
    const loadMolecule = async () => {
      try {
        if (compound.pubchem_cid) {
          // Load 3D structure from PubChem using CID
          const response = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.pubchem_cid}/SDF?record_type=3d`
          );

          if (!response.ok) {
            // Try 2D if 3D not available
            const response2d = await fetch(
              `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${compound.pubchem_cid}/SDF`
            );
            if (!response2d.ok) {
              throw new Error('Could not fetch molecular structure');
            }
            const sdfData = await response2d.text();
            viewer.addModel(sdfData, 'sdf');
          } else {
            const sdfData = await response.text();
            viewer.addModel(sdfData, 'sdf');
          }
        } else if (compound.canonical_smiles) {
          // Use SMILES to generate structure
          // Note: 3Dmol can parse SMILES but it's less reliable
          const response = await fetch(
            `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(compound.canonical_smiles)}/SDF?record_type=3d`
          );

          if (!response.ok) {
            throw new Error('Could not fetch molecular structure from SMILES');
          }

          const sdfData = await response.text();
          viewer.addModel(sdfData, 'sdf');
        } else {
          throw new Error('No PubChem CID or SMILES available for 3D visualization');
        }

        // Style the molecule
        viewer.setStyle({}, {
          stick: { radius: 0.15 },
          sphere: { scale: 0.25 },
        });

        // Add surface (optional - can be toggled)
        // viewer.addSurface($3Dmol.SurfaceType.VDW, { opacity: 0.8, color: 'white' });

        viewer.zoomTo();
        viewer.render();
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading molecule:', err);
        setError(err instanceof Error ? err.message : 'Failed to load 3D structure');
        setIsLoading(false);
      }
    };

    loadMolecule();

    // Cleanup
    return () => {
      if (viewer) {
        viewer.clear();
      }
    };
  }, [compound.pubchem_cid, compound.canonical_smiles]);

  // Style controls
  const setStyleStick = () => {
    if (viewerInstance) {
      viewerInstance.setStyle({}, { stick: { radius: 0.15 } });
      viewerInstance.render();
    }
  };

  const setStyleBallAndStick = () => {
    if (viewerInstance) {
      viewerInstance.setStyle({}, {
        stick: { radius: 0.15 },
        sphere: { scale: 0.25 },
      });
      viewerInstance.render();
    }
  };

  const setStyleSphere = () => {
    if (viewerInstance) {
      viewerInstance.setStyle({}, { sphere: { scale: 0.5 } });
      viewerInstance.render();
    }
  };

  const setStyleCartoon = () => {
    if (viewerInstance) {
      viewerInstance.setStyle({}, {
        stick: { colorscheme: 'Jmol', radius: 0.15 },
        sphere: { colorscheme: 'Jmol', scale: 0.25 },
      });
      viewerInstance.render();
    }
  };

  const resetView = () => {
    if (viewerInstance) {
      viewerInstance.zoomTo();
      viewerInstance.render();
    }
  };

  return (
    <Card className="animate-slide-up">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">3D Molecular Structure</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {compound.ingredient_name}
            {compound.pubchem_cid && ` (CID: ${compound.pubchem_cid})`}
          </p>
        </div>
      </div>

      {/* Style controls */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={setStyleBallAndStick}
          className="px-3 py-1.5 text-sm bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-200 dark:hover:bg-primary-800 transition-colors"
        >
          Ball & Stick
        </button>
        <button
          onClick={setStyleStick}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Stick
        </button>
        <button
          onClick={setStyleSphere}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Sphere
        </button>
        <button
          onClick={setStyleCartoon}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Color by Element
        </button>
        <button
          onClick={resetView}
          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors ml-auto"
        >
          Reset View
        </button>
      </div>

      {/* 3D Viewer Container */}
      <div className="relative w-full h-96 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-10">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Loading 3D structure...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-white dark:bg-gray-900 z-10">
            <div className="text-center text-red-500 dark:text-red-400">
              <svg
                className="w-12 h-12 mx-auto mb-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div
          ref={viewerRef}
          className="w-full h-full"
          style={{ position: 'relative' }}
        />
      </div>

      {/* Instructions */}
      <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
        <p><strong>Controls:</strong> Drag to rotate - Scroll to zoom - Shift+drag to pan</p>
      </div>

      {/* Compound details */}
      {compound.inchikey && (
        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">InChIKey</p>
          <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{compound.inchikey}</p>
        </div>
      )}
    </Card>
  );
};
