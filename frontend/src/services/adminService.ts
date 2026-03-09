import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification, FeaturedFace } from '../types';

export const adminService = {
  getProfiles: async (): Promise<StudentProfile[]> => {
    const response = await apiClient.get('/api/admin/profiles/');
    return response.data;
  },

  updateProfileStatus: async (studentId: string, status: StudentProfile['status'], feedback?: string): Promise<StudentProfile> => {
    const response = await apiClient.put(`/api/admin/profiles/${studentId}/status/`, { status, feedback });
    return response.data;
  },

  updateEvidenceStatus: async (studentId: string, evidenceId: string, type: CriterionType, status: Evidence['status'], feedback?: string): Promise<StudentProfile> => {
    const response = await apiClient.put(`/api/admin/profiles/${studentId}/evidences/${evidenceId}/status/`, { type, status, feedback });
    return response.data;
  },

  updateFieldStatus: async (studentId: string, fieldId: keyof StudentProfile['verifications'], status: FieldVerification['status'], feedback?: string): Promise<StudentProfile> => {
    const response = await apiClient.put(`/api/admin/profiles/${studentId}/fields/${fieldId}/status/`, { status, feedback });
    return response.data;
  },

  updateFaces: async (faces: FeaturedFace[]): Promise<FeaturedFace[]> => {
    const response = await apiClient.put('/api/admin/faces/', faces);
    return response.data;
  }
};

export const publicService = {
  getFaces: async (): Promise<FeaturedFace[]> => {
    const response = await apiClient.get('/api/public/faces/');
    return response.data;
  }
};
