import axios from 'axios';
import { API_BASE_URL } from '../constants/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error Response:', error.response.data);
      console.error('API Error Status:', error.response.status);
      console.error('API Error Headers:', error.response.headers);

      // Attach a user-friendly message to the error object
      error.userMessage = error.response.data.message || 'Une erreur est survenue.';
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API Error Request:', error.request);
      error.userMessage = 'Impossible de se connecter au serveur. Veuillez vérifier votre connexion.';
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Error Message:', error.message);
      error.userMessage = 'Une erreur inattendue est survenue.';
    }
    return Promise.reject(error);
  }
);

// Generic service factory for CRUD operations
// This ensures each function is defined correctly.
const createService = (endpoint) => ({
  getAll: () => api.get(`/${endpoint}`),
  getById: (id) => api.get(`/${endpoint}/${id}`),
  create: (data) => api.post(`/${endpoint}`, data),
  update: (id, data) => api.put(`/${endpoint}/${id}`, data),
  delete: (id) => api.delete(`/${endpoint}/${id}`),
});

// Specific services using the generic factory
export const agentService = {
  ...createService('agents'),
  getFormateurs: () => api.get('/agents/formateurs'),
};

export const catalogueService = {
  ...createService('catalogues'),
  getCompetences: (id) => api.get(`/catalogues/${id}/competences`),
};

export const sessionService = {
  ...createService('sessions'),
  getParticipants: (id) => api.get(`/sessions/${id}/participants`),
  addParticipant: (sessionId, matricule) => api.post(`/sessions/${sessionId}/participants`, { matricule }),
  removeParticipant: (sessionId, matricule) => api.delete(`/sessions/${sessionId}/participants/${matricule}`),
};

export const presenceService = {
  ...createService('presences'),
  getSessionDates: (sessionId) => api.get(`/presences/session/${sessionId}/dates`),
  getPresencesByDate: (sessionId, date) => api.get(`/presences/session/${sessionId}/date?date=${date}`),
  recordPresences: (presences) => api.post('/presences', { presences }),
  getParticipantPresenceSummary: (sessionId, matricule) => api.get(`/presences/session/${sessionId}/participant/${matricule}`),
};

export const evaluationService = {
  ...createService('evaluations'),
  getSessionEvaluations: (sessionId) => api.get(`/evaluations/session/${sessionId}`),
  getSessionCompetences: (sessionId) => api.get(`/evaluations/session/${sessionId}/competences`),
  getSessionEvaluationMatrix: (sessionId) => api.get(`/evaluations/session/${sessionId}/matrix`),
  getParticipantEvaluationSummary: (sessionId, matricule) => api.get(`/evaluations/session/${sessionId}/participant/${matricule}`),
  saveEvaluations: (evaluations) => api.post('/evaluations', { evaluations }),
};

export const cabinetService = {
  ...createService('cabinets'),
  getSessions: (id) => api.get(`/cabinets/${id}/sessions`),
};

export const competenceService = {
  ...createService('competences'),
  search: (query) => api.get(`/competences/search?q=${query}`),
};

export default api;
