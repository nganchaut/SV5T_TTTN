import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification } from '../types';

export const studentService = {
  getProfile: async (studentId?: string): Promise<StudentProfile> => {
    // We pass studentId as a query param just for mocking ease in the MSW setup right now
    const url = studentId ? `/api/profiles/me/?studentId=${studentId}` : '/api/profiles/me/';
    const response = await apiClient.get(url);
    return response.data;
  },

  updateProfile: async (data: Partial<StudentProfile>, studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/profiles/me/?studentId=${studentId}` : '/api/profiles/me/';
    const response = await apiClient.put(url, data);
    return response.data;
  },

  addEvidence: async (type: CriterionType, evidence: any, studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/profiles/me/evidences/?studentId=${studentId}` : '/api/profiles/me/evidences/';
    const response = await apiClient.post(url, { type, evidence });
    return response.data;
  },

  removeEvidence: async (type: CriterionType, guid: string, studentId?: string): Promise<StudentProfile> => {
    const url = studentId 
      ? `/api/profiles/me/evidences/${guid}?studentId=${studentId}&type=${type}` 
      : `/api/profiles/me/evidences/${guid}?type=${type}`;
    const response = await apiClient.delete(url);
    return response.data;
  },

  explainEvidence: async (type: CriterionType, guid: string, explanation: string, studentId?: string): Promise<StudentProfile> => {
    const url = studentId 
      ? `/api/profiles/me/evidences/${guid}/explain?studentId=${studentId}` 
      : `/api/profiles/me/evidences/${guid}/explain`;
    const response = await apiClient.put(url, { type, explanation });
    return response.data;
  },

  explainField: async (key: string, explanation: string, studentId?: string): Promise<StudentProfile> => {
    const url = studentId 
      ? `/api/profiles/me/fields/${key}/explain?studentId=${studentId}` 
      : `/api/profiles/me/fields/${key}/explain`;
    const response = await apiClient.put(url, { explanation });
    return response.data;
  },

  submitProfile: async (studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/profiles/me/submit/?studentId=${studentId}` : '/api/profiles/me/submit/';
    const response = await apiClient.post(url);
    return response.data;
  }
};
