import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification } from '../types';
import { mapBackendStudentToFrontend } from '../utils/mapper';

export const studentService = {
  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get('/api/students/me/');
    return mapBackendStudentToFrontend(response.data);
  },

  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    const response = await apiClient.put('/api/students/me/', data);
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
    formData.append('SoLuong', evidence.qty?.toString() || '1');
    const fileToUpload = evidence.files && evidence.files.length > 0 ? evidence.files[0] : null;
    if (fileToUpload) {
      formData.append('DuongDanFile', fileToUpload);
    }
    formData.append('TenFile', evidence.fileName || (fileToUpload ? fileToUpload.name : ''));
    formData.append('category', type);

    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  removeEvidence: async (type: CriterionType, guid: string): Promise<StudentProfile> => {
    // Backend now returns updated profile in response body (200 OK)
    const response = await apiClient.delete(`/api/evidences/${guid}/`);
    return mapBackendStudentToFrontend(response.data);
  },

  updateEvidence: async (type: CriterionType, guid: string, evidence: Evidence): Promise<StudentProfile> => {
    const url = `/api/evidences/${guid}/`;
    const formData = new FormData();
    formData.append('TieuChi', evidence.subCriterionId);
    formData.append('TenMinhChung', evidence.name);
    formData.append('CapDo', evidence.level);
    formData.append('LoaiMinhChung', evidence.type);
    if (evidence.decisionNumber) formData.append('SoQuyetDinh', evidence.decisionNumber);
    formData.append('SoLuong', evidence.qty?.toString() || '1');
    const fileToUpload = evidence.files && evidence.files.length > 0 ? evidence.files[0] : null;
    if (fileToUpload) {
      formData.append('DuongDanFile', fileToUpload);
      formData.append('TenFile', evidence.fileName || fileToUpload.name);
    }
    formData.append('category', type);

    // Some backends have trouble with PUT + MultiPart. If it fails, consider using POST with a method override.
    // However, we'll try to keep PUT first and fix the backend if needed.
    const response = await apiClient.put(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  explainEvidence: async (type: CriterionType, guid: string, explanation: string, file?: File): Promise<StudentProfile> => {
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

  explainField: async (key: string, explanation: string, file?: File): Promise<StudentProfile> => {
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

  submitProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.post('/api/students/me/submit/');
    return mapBackendStudentToFrontend(response.data);
  },

  unsubmitProfile: async (): Promise<StudentProfile> => {
    // Backend returns {detail, TrangThai}, so we refetch the full profile
    await apiClient.post('/api/students/me/unsubmit/');
    const response = await apiClient.get('/api/students/me/');
    return mapBackendStudentToFrontend(response.data);
  }
};
