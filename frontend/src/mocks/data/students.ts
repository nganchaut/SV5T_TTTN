import { StudentProfile, CriterionType } from '../../types';

export let mockStudents: StudentProfile[] = [
  {
    id: 'SVNEW', fullName: '', studentId: '', class: '', faculty: '',
    gpa: 0, peScore: 0, trainingPoints: 0, englishLevel: 'None', englishGpa: 0, isPartyMember: false, noViolation: false, status: 'Draft',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'Pending' }, trainingPoints: { status: 'Pending' }, peScore: { status: 'Pending' }, english: { status: 'Pending' }, partyMember: { status: 'Pending' } }
  },
  {
    id: 'SV001', fullName: 'Lê Thanh Bình', studentId: '20123456', class: 'K20.CNTT', faculty: 'Khoa Công nghệ thông tin',
    gpa: 3.8, peScore: 9.0, trainingPoints: 95, englishLevel: 'B2', englishGpa: 3.5, isPartyMember: true, noViolation: true, status: 'Approved',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0.7,
    verifications: { gpa: { status: 'Approved' }, trainingPoints: { status: 'Approved' }, peScore: { status: 'Approved' }, english: { status: 'Approved' }, partyMember: { status: 'Approved' } }
  },
  {
    id: 'SV002', fullName: 'Nguyễn Diệu Linh', studentId: '21123457', class: 'K21.KToan', faculty: 'Khoa Kế toán',
    gpa: 3.6, peScore: 8.5, trainingPoints: 88, englishLevel: 'B1', englishGpa: 3.2, isPartyMember: false, noViolation: true, status: 'Submitted',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'Pending' }, trainingPoints: { status: 'Pending' }, peScore: { status: 'Pending' }, english: { status: 'Pending' }, partyMember: { status: 'Pending' } }
  },
  {
    id: 'SV003', fullName: 'Trần Minh Quân', studentId: '20123458', class: 'K20.QTKD', faculty: 'Khoa Quản trị kinh doanh',
    gpa: 3.2, peScore: 7.5, trainingPoints: 82, englishLevel: 'None', englishGpa: 0, isPartyMember: false, noViolation: true, status: 'Processing',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'NeedsExplanation' }, trainingPoints: { status: 'Approved' }, peScore: { status: 'Pending' }, english: { status: 'Pending' }, partyMember: { status: 'Pending' } }
  },
  {
    id: 'SV004', fullName: 'Phạm Hải Yến', studentId: '22123459', class: 'K22.NganHang', faculty: 'Khoa Ngân hàng',
    gpa: 3.9, peScore: 9.5, trainingPoints: 98, englishLevel: 'B2', englishGpa: 3.8, isPartyMember: true, noViolation: true, status: 'Approved',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0.8,
    verifications: { gpa: { status: 'Approved' }, trainingPoints: { status: 'Approved' }, peScore: { status: 'Approved' }, english: { status: 'Approved' }, partyMember: { status: 'Approved' } }
  },
  {
    id: 'SV005', fullName: 'Hoàng Quốc Việt', studentId: '21123460', class: 'K21.TMDDT', faculty: 'Khoa TMĐT',
    gpa: 3.5, peScore: 8.0, trainingPoints: 91, englishLevel: 'B1', englishGpa: 3.1, isPartyMember: false, noViolation: true, status: 'Rejected',
    evidences: { [CriterionType.ETHICS]: [], [CriterionType.ACADEMIC]: [], [CriterionType.PHYSICAL]: [], [CriterionType.VOLUNTEER]: [], [CriterionType.INTEGRATION]: [] },
    totalScore: 0,
    verifications: { gpa: { status: 'Rejected' }, trainingPoints: { status: 'Approved' }, peScore: { status: 'Approved' }, english: { status: 'Approved' }, partyMember: { status: 'Pending' } }
  }
];

// Helper to update the mock database during runtime
export const updateMockStudent = (updatedStudent: StudentProfile) => {
  mockStudents = mockStudents.map(s => s.id === updatedStudent.id ? updatedStudent : s);
};
