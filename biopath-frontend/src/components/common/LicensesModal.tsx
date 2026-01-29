import React from 'react';
import { Card } from './Card';

interface LicensesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LicensesModal: React.FC<LicensesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const licenses = [
    {
      name: 'PubChem',
      description: 'Chemical compound data and structures',
      license: 'Public Domain',
      url: 'https://pubchem.ncbi.nlm.nih.gov/',
    },
    {
      name: 'ChEMBL',
      description: 'Bioactivity database of drug-like molecules',
      license: 'CC BY-SA 3.0',
      url: 'https://www.ebi.ac.uk/chembl/',
    },
    {
      name: 'Reactome',
      description: 'Pathway and reaction database',
      license: 'CC BY 4.0',
      url: 'https://reactome.org/',
    },
    {
      name: 'Open Targets',
      description: 'Drug target validation and pathway data',
      license: 'Apache 2.0',
      url: 'https://platform.opentargets.org/',
    },
    {
      name: 'UniProt',
      description: 'Protein sequence and functional information',
      license: 'CC BY 4.0',
      url: 'https://www.uniprot.org/',
    },
    {
      name: 'RDKit',
      description: 'Open-source cheminformatics toolkit',
      license: 'BSD 3-Clause',
      url: 'https://www.rdkit.org/',
    },
    {
      name: '3Dmol.js',
      description: '3D molecular visualization',
      license: 'BSD 3-Clause',
      url: 'https://3dmol.org/',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <Card className="max-w-2xl w-full max-h-[80vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Licenses & Attributions
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            BioPath integrates data from multiple scientific databases and uses open-source tools.
            We gratefully acknowledge the following resources:
          </p>

          <div className="space-y-3">
            {licenses.map((item) => (
              <div
                key={item.name}
                className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {item.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                    {item.license}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary-500 hover:text-primary-600 dark:hover:text-primary-400 mt-2 inline-block"
                >
                  {item.url}
                </a>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              BioPath Application
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Created by Dharsan Kesavan. This application is provided for educational and research purposes only.
              The information displayed is derived from public scientific databases and should not be used
              for medical diagnosis or treatment decisions.
            </p>
          </div>
        </div>
      </Card>
      </div>
    </div>
  );
};
