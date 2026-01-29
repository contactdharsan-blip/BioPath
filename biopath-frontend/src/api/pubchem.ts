import axios from 'axios';
import type { PubChemSuggestion } from './types';

const PUBCHEM_BASE_URL = 'https://pubchem.ncbi.nlm.nih.gov/rest';

/**
 * Search PubChem for compound suggestions based on partial input
 * @param query - Partial compound name (e.g., "ibu" for ibuprofen)
 * @param limit - Maximum number of suggestions to return
 * @returns Array of compound suggestions
 */
export const searchCompounds = async (
  query: string,
  limit: number = 10
): Promise<PubChemSuggestion[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    const { data } = await axios.get(
      `${PUBCHEM_BASE_URL}/autocomplete/compound/${encodeURIComponent(query)}/json`,
      {
        params: { limit },
        timeout: 5000,
      }
    );

    // PubChem returns an object with dictionary_terms.compound array
    const suggestions = data.dictionary_terms?.compound || [];

    return suggestions.map((name: string) => ({
      name,
    }));
  } catch (error) {
    console.error('PubChem search error:', error);
    return [];
  }
};

/**
 * Get compound details by CID
 * @param cid - PubChem Compound ID
 * @returns Compound details
 */
export const getCompoundByCID = async (cid: number) => {
  try {
    const { data } = await axios.get(
      `${PUBCHEM_BASE_URL}/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName/JSON`,
      { timeout: 5000 }
    );
    return data;
  } catch (error) {
    console.error('Error fetching compound details:', error);
    return null;
  }
};
