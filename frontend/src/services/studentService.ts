import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification } from '../types';
import { mapBackendStudentToFrontend } from '../utils/mapper';

export const studentService = {
  getProfile: async (studentId?: string): Promise<StudentProfile> => {
    // We pass studentId as a query param just for mocking ease in the MSW setup right now
    const url = studentId ? `/api/students/me/?studentId=${studentId}` : '/api/students/me/';
    const response = await apiClient.get(url);
    return mapBackendStudentToFrontend(response.data);
  },

  updateProfile: async (data: Partial<StudentProfile>, studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/students/me/?studentId=${studentId}` : '/api/students/me/';
    const response = await apiClient.put(url, data);
    return mapBackendStudentToFrontend(response.data);
  },

  addEvidence: async (type: CriterionType, evidence: Evidence, studentId?: string): Promise<StudentProfile> => {
    // Correct URL for evidences is /api/evidences/ based on backend routing
    const url = '/api/evidences/';
    
    // Multipart/form-data payload
    const formData = new FormData();
    formData.append('TieuChi', evidence.subCriterionId); // Backend expects integer ID or string if it handles conversion
    formData.append('TenMinhChung', evidence.name);
    formData.append('CapDo', evidence.level);
    formData.append('LoaiMinhChung', evidence.type);
    if (evidence.decisionNumber) formData.append('SoQuyetDinh', evidence.decisionNumber);
    if (evidence.file) formData.append('DuongDanFile', evidence.file);
    formData.append('TenFile', evidence.fileName);
    formData.append('category', type);

    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  removeEvidence: async (type: CriterionType, guid: string, studentId?: string): Promise<StudentProfile> => {
    const url = `/api/evidences/${guid}/`;
    const response = await apiClient.delete(url);
    return mapBackendStudentToFrontend(response.data);
  },

  updateEvidence: async (type: CriterionType, guid: string, evidence: Evidence, studentId?: string): Promise<StudentProfile> => {
    const url = `/api/evidences/${guid}/`;
    const formData = new FormData();
    formData.append('TieuChi', evidence.subCriterionId);
    formData.append('TenMinhChung', evidence.name);
    formData.append('CapDo', evidence.level);
    formData.append('LoaiMinhChung', evidence.type);
    if (evidence.decisionNumber) formData.append('SoQuyetDinh', evidence.decisionNumber);
    if (evidence.file) formData.append('DuongDanFile', evidence.file);
    formData.append('TenFile', evidence.fileName);
    formData.append('category', type);

    const response = await apiClient.put(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  explainEvidence: async (type: CriterionType, guid: string, explanation: string, file?: File, studentId?: string): Promise<StudentProfile> => {
    const url = `/api/evidences/${guid}/explain/`;
    const formData = new FormData();
    formData.append('GiaiTrinhSV', explanation);
    if (file) {
      formData.append('DuongDanFile', file);
    }
    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  explainField: async (key: string, explanation: string, file?: File, studentId?: string): Promise<StudentProfile> => {
    const url = `/api/students/me/fields/${key}/explain/`;
    const formData = new FormData();
    formData.append('GiaiTrinhSV', explanation);
    if (file) {
      formData.append('DuongDanFile', file);
    }
    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  submitProfile: async (studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/students/me/submit/?studentId=${studentId}` : '/api/students/me/submit/';
    const response = await apiClient.post(url);
    return mapBackendStudentToFrontend(response.data);
  },

  unsubmitProfile: async (studentId?: string): Promise<StudentProfile> => {
    const url = studentId ? `/api/students/me/unsubmit/?studentId=${studentId}` : '/api/students/me/unsubmit/';
    const response = await apiClient.post(url);
    return mapBackendStudentToFrontend(response.data);
  }
};
