import { apiClient } from './apiClient';
import { StudentProfile, CriterionType, Evidence, FieldVerification } from '../types';
import { mapBackendStudentToFrontend } from '../utils/mapper';

export const studentService = {
  getProfile: async (): Promise<StudentProfile> => {
    const response = await apiClient.get('/api/students/me/');
    return mapBackendStudentToFrontend(response.data);
  },

  updateProfile: async (data: Partial<StudentProfile>): Promise<StudentProfile> => {
    // Map frontend fields to backend names
    const payload: any = {};
    if (data.fullName !== undefined) payload.HoTen = data.fullName;
    if (data.class !== undefined) payload.Lop = data.class;
    if (data.faculty !== undefined) payload.Khoa = data.faculty;
    if (data.gpa !== undefined) payload.DiemTBC = data.gpa;
    if (data.trainingPoints !== undefined) payload.DiemRenLuyen = data.trainingPoints;
    if (data.peScore !== undefined) payload.DiemTheDuc = data.peScore;
    if (data.englishLevel !== undefined) payload.TrinhDoNgoaiNgu = data.englishLevel;
    if (data.englishGpa !== undefined) payload.GPANgoaiNgu = data.englishGpa;
    if (data.isPartyMember !== undefined) payload.LaDangVien = data.isPartyMember;
    if (data.noViolation !== undefined) payload.KhongViPham = data.noViolation;

    const response = await apiClient.put('/api/students/me/', payload);
    return mapBackendStudentToFrontend(response.data);
  },

  addEvidence: async (type: CriterionType, evidence: Evidence): Promise<StudentProfile> => {
    // Multipart/form-data payload
    const formData = new FormData();
    formData.append('TieuChi', evidence.subCriterionId);
    formData.append('TenMinhChung', evidence.name);
    formData.append('CapDo', evidence.level);
    formData.append('LoaiMinhChung', evidence.type);
    if (evidence.decisionNumber) formData.append('SoQuyetDinh', evidence.decisionNumber);
    if (evidence.qty !== undefined) formData.append('SoLuong', String(evidence.qty));
    if (evidence.file) formData.append('DuongDanFile', evidence.file);
    formData.append('TenFile', evidence.fileName);

    try {
      await apiClient.post('/api/evidences/', formData);
    } catch (error: any) {
      console.error('addEvidence detailed error:', error.response?.data || error.message);
      throw error;
    }
    // Sau khi thêm minh chứng, lấy lại hồ sơ đầy đủ
    return studentService.getProfile();
  },

  removeEvidence: async (type: CriterionType, guid: string): Promise<StudentProfile> => {
    await apiClient.delete(`/api/evidences/${guid}/`);
    return studentService.getProfile();
  },

  explainEvidence: async (type: CriterionType, guid: string, explanation: string): Promise<StudentProfile> => {
    await apiClient.post(`/api/evidences/${guid}/explain/`, { GiaiTrinhSV: explanation });
    return studentService.getProfile();
  },

  explainField: async (key: string, explanation: string): Promise<StudentProfile> => {
    await apiClient.post(`/api/students/me/fields/${key}/explain/`, { GiaiTrinhSV: explanation });
    return studentService.getProfile();
  },

  submitProfile: async (): Promise<StudentProfile> => {
    await apiClient.post('/api/students/me/submit/');
    return studentService.getProfile();
  },

  unsubmitProfile: async (): Promise<StudentProfile> => {
    await apiClient.post('/api/students/me/unsubmit/');
    return studentService.getProfile();
  }
};
