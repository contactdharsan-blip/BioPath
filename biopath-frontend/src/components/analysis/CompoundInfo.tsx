import React from 'react';
import { Card } from '../common/Card';
import type { CompoundIdentity } from '../../api/types';

interface CompoundInfoProps {
  compound: CompoundIdentity;
}

export const CompoundInfo: React.FC<CompoundInfoProps> = ({ compound }) => {
  return (
    <Card className="animate-slide-up">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Compound Identity</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-500">Name</label>
          <p className="text-base text-gray-900 mt-1">{compound.ingredient_name}</p>
        </div>

        {compound.pubchem_cid && (
          <div>
            <label className="text-sm font-medium text-gray-500">PubChem CID</label>
            <p className="text-base text-gray-900 mt-1">
              <a
                href={`https://pubchem.ncbi.nlm.nih.gov/compound/${compound.pubchem_cid}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline"
              >
                {compound.pubchem_cid}
              </a>
            </p>
          </div>
        )}

        {compound.molecular_formula && (
          <div>
            <label className="text-sm font-medium text-gray-500">Molecular Formula</label>
            <p className="text-base text-gray-900 mt-1 font-mono">{compound.molecular_formula}</p>
          </div>
        )}

        {compound.molecular_weight && (
          <div>
            <label className="text-sm font-medium text-gray-500">Molecular Weight</label>
            <p className="text-base text-gray-900 mt-1">{compound.molecular_weight.toFixed(2)} g/mol</p>
          </div>
        )}

        {compound.canonical_smiles && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">SMILES</label>
            <p className="text-sm text-gray-900 mt-1 font-mono break-all bg-gray-50 p-2 rounded">
              {compound.canonical_smiles}
            </p>
          </div>
        )}

        {compound.inchikey && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">InChIKey</label>
            <p className="text-sm text-gray-900 mt-1 font-mono break-all bg-gray-50 p-2 rounded">
              {compound.inchikey}
            </p>
          </div>
        )}

        {compound.iupac_name && (
          <div className="md:col-span-2">
            <label className="text-sm font-medium text-gray-500">IUPAC Name</label>
            <p className="text-sm text-gray-900 mt-1">{compound.iupac_name}</p>
          </div>
        )}
      </div>
    </Card>
  );
};
