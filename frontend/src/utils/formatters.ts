/**
 * Format a number to fixed decimal places
 */
export const formatNumber = (value: number | undefined, decimals: number = 2): string => {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(decimals);
};

/**
 * Format a pChEMBL value (0-10 scale)
 */
export const formatPChEMBL = (value: number | undefined): string => {
  if (value === undefined || value === null) return 'N/A';
  return value.toFixed(1);
};

/**
 * Format impact score as percentage
 */
export const formatImpactScore = (score: number | undefined): string => {
  if (score === undefined || score === null) return 'N/A';
  return `${(score * 100).toFixed(0)}%`;
};

/**
 * Format timestamp to readable date
 */
export const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    return date.toLocaleString();
  } catch {
    return timestamp;
  }
};

/**
 * Truncate long text with ellipsis
 */
export const truncate = (text: string, maxLength: number = 50): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Format duration in milliseconds to human readable
 */
export const formatDuration = (ms: number | undefined): string => {
  if (ms === undefined || ms === null) return 'N/A';
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
};

/**
 * Get potency description based on pChEMBL value
 */
export const getPotencyDescription = (pchembl: number | undefined): string => {
  if (pchembl === undefined || pchembl === null) return 'Unknown';
  if (pchembl >= 8) return 'Very High';
  if (pchembl >= 6) return 'High';
  if (pchembl >= 4) return 'Moderate';
  return 'Low';
};
