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
    formData.append('TieuChi', evidence.subCriterionId);
    formData.append('TenMinhChung', evidence.name);
    formData.append('CapDo', evidence.level);
    formData.append('LoaiMinhChung', evidence.type);
    if (evidence.decisionNumber) formData.append('SoQuyetDinh', evidence.decisionNumber);
    if (evidence.qty) formData.append('SoLuong', String(evidence.qty));
    
    // Append multiple files with the same key
    if (evidence.files && evidence.files.length > 0) {
      evidence.files.forEach(f => {
        formData.append('DuongDanFile', f);
      });
    } else if (evidence.file) {
      formData.append('DuongDanFile', evidence.file);
    }

    formData.append('TenFile', evidence.fileName);
    formData.append('category', type);

    const response = await apiClient.post(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return mapBackendStudentToFrontend(response.data);
  },

  removeEvidence: async (type: CriterionType, guid: string): Promise<StudentProfile> => {
    // Backend returns 204 No Content on delete, so we refetch the full profile
    await apiClient.delete(`/api/evidences/${guid}/`);
    const response = await apiClient.get('/api/students/me/');
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
    if (evidence.qty) formData.append('SoLuong', String(evidence.qty));
    
    // Append multiple files
    if (evidence.files && evidence.files.length > 0) {
      evidence.files.forEach(f => {
        formData.append('DuongDanFile', f);
      });
    } else if (evidence.file) {
      formData.append('DuongDanFile', evidence.file);
    }

    formData.append('TenFile', evidence.fileName);
    formData.append('category', type);

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
