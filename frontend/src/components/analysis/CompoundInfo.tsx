import React from 'react';
import { Card } from '../common/Card';
import type { CompoundIdentity } from '../../api/types';

interface CompoundInfoProps {
  compound: CompoundIdentity;
}

export const CompoundInfo: React.FC<CompoundInfoProps> = ({ compound }) => {
  return (
    <Card className="animate-slide-up">
      <h3 className="text-lg font-semibold text-slate-200 mb-4">Compound Identity</h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Name</label>
          <p className="text-sm text-slate-200 mt-1">{compound.ingredient_name}</p>
        </div>

        {compound.pubchem_cid && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">PubChem CID</label>
            <p className="text-sm mt-1">
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.pubchem_cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 hover:text-primary-300 transition-colors"
              >
                {compound.pubchem_cid}
              </a>
            </p>
          </div>
        )}

        {compound.molecular_formula && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Formula</label>
            <p className="text-sm text-slate-200 mt-1 font-mono">{compound.molecular_formula}</p>
          </div>
        )}

        {compound.molecular_weight && (
          <div>
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Weight</label>
            <p className="text-sm text-slate-200 mt-1">{compound.molecular_weight.toFixed(2)} g/mol</p>
          </div>
        )}

        {compound.canonical_smiles && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">SMILES</label>
            <p className="text-xs text-slate-300 mt-1 font-mono break-all bg-white/5 p-2.5 rounded-xl border border-white/5">
              {compound.canonical_smiles}
            </p>
          </div>
        )}

        {compound.inchikey && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">InChIKey</label>
            <p className="text-xs text-slate-300 mt-1 font-mono break-all bg-white/5 p-2.5 rounded-xl border border-white/5">
              {compound.inchikey}
            </p>
          </div>
        )}

        {compound.iupac_name && (
          <div className="sm:col-span-2">
            <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">IUPAC Name</label>
            <p className="text-sm text-slate-300 mt-1">{compound.iupac_name}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
