import api from './axios';

/**
 * @param {Object} params  - { format: 'pdf'|'excel'|'csv', fromDate, toDate, status }
 * @returns Blob
 */
export const generateReport = (params) =>
  api.get('/reports', { params, responseType: 'blob' });
