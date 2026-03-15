
export enum CriterionType {
  ETHICS = 'Đạo đức tốt',
  ACADEMIC = 'Học tập tốt',
  PHYSICAL = 'Thể lực tốt',
  VOLUNTEER = 'Tình nguyện tốt',
  INTEGRATION = 'Hội nhập tốt'
}

export enum EvidenceLevel {
  KHOA = 'Cấp Khoa/CLB',
  TRUONG = 'Cấp Trường/Phường/Xã',
  DHDN = 'Cấp ĐHĐN',
  TINH_TP = 'Cấp Tỉnh/Thành phố',
  TW = 'Cấp Trung ương'
}

export enum EvidenceType {
  NO_DECISION = 'Không Sqđ/GCN thường',
  WITH_DECISION = 'Có Sqđ/GCN có mã số',
  GK = 'Giấy khen/Bằng khen'
}

export interface SubCriterion {
  id: string;
  description: string;
  isHard: boolean;
  points?: number; 
  note?: string;
  minQty?: number;
}

export interface Evidence {
  id: string;
  subCriterionId: string;
  name: string;
  level: EvidenceLevel;
  type: EvidenceType;
  decisionNumber?: string; 
  qty?: number; // Số lượng (ví dụ: số ngày tình nguyện, số lần hiến máu)
  fileUrl: string; // File chính (compatibility)
  file?: File; // File đơn (legacy)
  files?: File[]; // Danh sách file mới chọn
  fileName: string;
  danh_sach_file?: Array<{
    id: number;
    DuongDanFile: string;
    TenFile: string;
    FileUrl: string;
  }>;
  date: string;
  points: number; 
  isHardCriterion: boolean;
  status?: 'Pending' | 'Approved' | 'Rejected' | 'NeedsExplanation';
  adminFeedback?: string;
  studentExplanation?: string;
}

export interface FieldVerification {
  status: 'Pending' | 'Approved' | 'Rejected' | 'NeedsExplanation';
  feedback?: string; // Legacy
  adminFeedback?: string;
  explanation?: string;
  fileUrl?: string;
  fileName?: string;
}

export interface StudentProfile {
  id: string;
  fullName: string;
  studentId: string;
  class: string;
  faculty: string;
  gpa: number;
  peScore: number;
  trainingPoints: number;
  englishLevel: string;
  englishGpa: number;
  isPartyMember: boolean;
  noViolation: boolean; 
  status: 'Draft' | 'Submitted' | 'Processing' | 'Approved' | 'Rejected';
  evidences: Record<CriterionType, Evidence[]>;
  totalScore: number;
  feedback?: string;
  verifications: {
    gpa: FieldVerification;
    trainingPoints: FieldVerification;
    peScore: FieldVerification;
    english: FieldVerification;
    partyMember: FieldVerification;
  };
}

export interface FeaturedFace {
  id: string;
  name: string;
  achievement: string;
  content: string;
  image: string;
  imageFile?: File;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  date: string;
  status: string;
  image: string;
  imageFile?: File;
}
