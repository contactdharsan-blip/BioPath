import React from 'react';

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
      className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-end sm:items-center justify-center z-50 animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="glass-strong w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] sm:max-h-[80vh] overflow-hidden animate-slide-up"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-white/5">
          <h2 className="text-lg font-bold text-slate-100">
            Licenses & Attributions
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-white/5 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-3">
          <p className="text-sm text-slate-400">
            BioPath integrates data from multiple scientific databases and open-source tools.
          </p>

          <div className="space-y-2">
            {licenses.map((item) => (
              <div
                key={item.name}
                className="p-3 bg-white/[0.03] rounded-xl border border-white/5"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-200 text-sm">
                      {item.name}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {item.description}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-primary-500/10 text-primary-400 rounded-full flex-shrink-0">
                    {item.license}
                  </span>
                </div>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-400/70 hover:text-primary-400 mt-1.5 inline-block transition-colors truncate max-w-full"
                >
                  {item.url}
                </a>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-white/5">
            <h3 className="font-semibold text-slate-200 text-sm mb-1">
              BioPath Application
            </h3>
            <p className="text-xs text-slate-400">
              Created by Dharsan Kesavan. For educational and research purposes only.
              Not for medical diagnosis or treatment decisions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
