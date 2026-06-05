import api from './axios';

export const uploadInvoice = (formData) =>
  api.post('/invoices/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const getInvoice = (id) => api.get(`/invoices/${id}`);

export const listInvoices = (params) => api.get('/invoices', { params });

export const updateInvoice = (id, data) => api.put(`/invoices/${id}`, data);

export const updateInvoiceStatus = (id, newStatus) =>
  api.put(`/invoices/${id}/status`, null, { params: { newStatus } });

export const retryInvoice = (id) => api.post(`/invoices/${id}/retry`);

export const deleteInvoice = (id) => api.delete(`/invoices/${id}`);

export const getDashboardStats = () => api.get('/invoices/stats/dashboard');
