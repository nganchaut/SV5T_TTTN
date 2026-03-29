import { StudentProfile, CriterionType, Evidence, FieldVerification } from '../types';

export const formatUrl = (url?: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('data:')) return url;
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const cleanBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const cleanUrl = url.startsWith('/') ? url : `/${url}`;
  return `${cleanBase}${cleanUrl}`;
};

export const mapBackendStudentToFrontend = (d: any): StudentProfile => {
  // Map verifications
  const verifications: StudentProfile['verifications'] = {
    gpa: { status: 'Pending' },
    trainingPoints: { status: 'Pending' },
    peScore: { status: 'Pending' },
    english: { status: 'Pending' },
    partyMember: { status: 'Pending' }
  };

  if (d.xac_minh && Array.isArray(d.xac_minh)) {
    d.xac_minh.forEach((xm: any) => {
      if (xm.TruongDuLieu && verifications[xm.TruongDuLieu as keyof StudentProfile['verifications']]) {
        verifications[xm.TruongDuLieu as keyof StudentProfile['verifications']] = {
          status: xm.TrangThai,
          feedback: xm.PhanHoiAdmin || xm.PhanHoi || '', 
          adminFeedback: xm.PhanHoiAdmin || '',
          explanation: xm.GiaiTrinhSV || '',
          fileUrl: formatUrl(xm.FileUrl || ''),
          fileName: xm.TenFile || '',
          explanationDate: xm.NgayGiaiTrinh || xm.NgayCapNhat || ''
        };
      }
    });
  }

  // Map evidences
  const evidences: Record<CriterionType, Evidence[]> = {
    [CriterionType.ETHICS]: [],
    [CriterionType.ACADEMIC]: [],
    [CriterionType.PHYSICAL]: [],
    [CriterionType.VOLUNTEER]: [],
    [CriterionType.INTEGRATION]: []
  };

  if (d.minh_chung && Array.isArray(d.minh_chung)) {
    d.minh_chung.forEach((mc: any) => {
      const catName = mc.NhomTieuChiTen;
      let mappedCat: CriterionType | null = null;
      
      if (catName === 'Đạo đức tốt') mappedCat = CriterionType.ETHICS;
      else if (catName === 'Học tập tốt') mappedCat = CriterionType.ACADEMIC;
      else if (catName === 'Thể lực tốt') mappedCat = CriterionType.PHYSICAL;
      else if (catName === 'Tình nguyện tốt') mappedCat = CriterionType.VOLUNTEER;
      else if (catName === 'Hội nhập tốt') mappedCat = CriterionType.INTEGRATION;

      if (mappedCat) {
        evidences[mappedCat].push({
          id: String(mc.id),
          subCriterionId: String(mc.TieuChi),
          subCriterionName: mc.TieuChiMoTa || '',
          name: mc.TenMinhChung,
          level: mc.CapDo,
          type: mc.LoaiMinhChung,
          decisionNumber: mc.SoQuyetDinh || '',
          qty: mc.SoLuong || 1,
          fileUrl: formatUrl(mc.FileUrl || mc.DuongDanFile || ''),
          fileName: mc.TenFile || '',
          danh_sach_file: (mc.danh_sach_file || []).map((f: any) => ({
            ...f,
            FileUrl: formatUrl(f.FileUrl || f.DuongDanFile)
          })),
          date: mc.NgayNop || mc.NgayTao || '',
          points: Number(mc.Diem || 0),
          isHardCriterion: Boolean(mc.is_tieu_chi_cung),
          status: mc.TrangThai,
          adminFeedback: mc.PhanHoiAdmin || '',
          studentExplanation: mc.GiaiTrinhSV || '',
          explanationDate: mc.NgayGiaiTrinh || mc.NgayCapNhat || ''
        });
      }
    });
  }

  return {
    id: String(d.id),
    fullName: d.HoTen || '',
    studentId: d.MaSV || '',
    class: d.Lop || '',
    faculty: d.Khoa || '',
    gpa: Number(d.DiemTBC || 0),
    peScore: Number(d.DiemTheDuc || 0),
    trainingPoints: Number(d.DiemRenLuyen || 0),
    englishLevel: d.TrinhDoNgoaiNgu || 'None',
    englishGpa: Number(d.GPANgoaiNgu || 0),
    isPartyMember: Boolean(d.LaDangVien),
    noViolation: Boolean(d.KhongViPham),
    status: d.TrangThaiHoSo || 'Draft',
    evidences,
    totalScore: Number(d.TongDiem || 0),
    feedback: d.PhanHoiChung || '',
    verifications
  };
};
