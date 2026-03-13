import React, { useState } from 'react';
import { CriterionType, Evidence, StudentProfile, EvidenceLevel, EvidenceType, FieldVerification } from '../types';
import { FACES_OF_THE_YEAR as INITIAL_FACES } from '../constants';
import EvidenceForm from '../components/EvidenceForm';

const POINT_MATRIX: Record<EvidenceLevel, Record<EvidenceType, number>> = {
  [EvidenceLevel.KHOA]: { [EvidenceType.NO_DECISION]: 0.1, [EvidenceType.WITH_DECISION]: 0.1, [EvidenceType.GK]: 0.1 },
  [EvidenceLevel.TRUONG]: { [EvidenceType.NO_DECISION]: 0.2, [EvidenceType.WITH_DECISION]: 0.3, [EvidenceType.GK]: 0.4 },
  [EvidenceLevel.DHDN]: { [EvidenceType.NO_DECISION]: 0.3, [EvidenceType.WITH_DECISION]: 0.4, [EvidenceType.GK]: 0.5 },
  [EvidenceLevel.TINH_TP]: { [EvidenceType.NO_DECISION]: 0.4, [EvidenceType.WITH_DECISION]: 0.5, [EvidenceType.GK]: 0.6 },
  [EvidenceLevel.TW]: { [EvidenceType.NO_DECISION]: 0.5, [EvidenceType.WITH_DECISION]: 0.6, [EvidenceType.GK]: 0.7 },
};

const STEPS = [
  'HARD_CRITERIA' as const,
  CriterionType.ETHICS,
  CriterionType.ACADEMIC,
  CriterionType.PHYSICAL,
  CriterionType.VOLUNTEER,
  CriterionType.INTEGRATION,
  'SUBMIT' as const
];

const STEP_LABELS: Record<string, string> = {
  'HARD_CRITERIA': 'Tiêu chí cứng',
  [CriterionType.ETHICS]: 'MC Đạo đức',
  [CriterionType.ACADEMIC]: 'MC Học tập',
  [CriterionType.PHYSICAL]: 'MC Thể lực',
  [CriterionType.VOLUNTEER]: 'MC Tình nguyện',
  [CriterionType.INTEGRATION]: 'MC Hội nhập',
};

export const checkHardMet = (cat: CriterionType, student: StudentProfile, allCriteria: any[] = []) => {
  const evs = student.evidences[cat] || [];
  const approvedEvs = evs.filter(e => e.status === 'Approved' || e.status === 'Pending');

  const nhom = allCriteria?.find(n => n.TenNhom === cat);
  const backendSubs = (nhom?.tieu_chi || []).map((s: any) => ({
    id: String(s.id),
    code: s.MaTieuChi,
    isHard: s.is_tieu_chi_cung,
  }));
  
  const currentSubs = backendSubs.length > 0 ? backendSubs : [];
  const profileBasedCodes = ['eth_hard_1', 'eth_hard_2', 'eth_point_1', 'eth_point_5', 'aca_hard_1', 'aca_point_7', 'phy_hard_1', 'int_hard_1', 'int_hard_2'];
  const validHardSubIds = currentSubs.filter(sub => sub.isHard && !profileBasedCodes.includes((sub as any).code || sub.id)).map(s => s.id);

  const uploadedValidHardEvs = approvedEvs.filter(e => validHardSubIds.includes(e.subCriterionId));
  const matchedHardSubIds = new Set(uploadedValidHardEvs.map(e => e.subCriterionId));
  
  // Yêu cầu nộp TẤT CẢ các minh chứng cứng ĐƯỢC ADMIN CẤU HÌNH. 
  // Nếu Admin KHÔNG cấu hình tiêu chí cứng tự nộp nào (length === 0), thì mặc định là True (để pass qua dựa vào điểm).
  // Nếu Admin CÓ cấu hình, thì phải nộp ĐỦ mới được True.
  const hasAllRequiredHardEvs = validHardSubIds.length === 0 || validHardSubIds.every(id => matchedHardSubIds.has(id));

  // Biến mở rộng: Có nộp ít nhất 1 MC Cứng mở rộng nào không (dùng cho Thể lực, Hội nhập: Hoặc điểm, Hoặc MC)
  const hasUploadedSomeHardEvs = validHardSubIds.length > 0 && validHardSubIds.every(id => matchedHardSubIds.has(id));

  switch (cat) {
    case CriterionType.ETHICS:
      return student.trainingPoints >= 70 && student.noViolation && hasAllRequiredHardEvs;
    case CriterionType.ACADEMIC:
      return student.gpa >= 2.5 && student.gpa <= 4.0 && hasAllRequiredHardEvs;
    case CriterionType.PHYSICAL:
      return (student.peScore >= 7.0 || student.peScore === 10) && hasAllRequiredHardEvs;
    case CriterionType.VOLUNTEER:
      return validHardSubIds.length > 0 ? hasUploadedSomeHardEvs : false;
    case CriterionType.INTEGRATION:
      const profileMet = (['B1', 'B2', 'B3', 'C1', 'C2'].includes(student.englishLevel) || student.englishGpa >= 2.0);
      return profileMet && hasAllRequiredHardEvs;
    default:
      return false;
  }
};

const StudentDashboard: React.FC<{
  student: StudentProfile;
  addEvidence: (type: CriterionType, ev: Evidence) => void;
  removeEvidence: (type: CriterionType, id: string) => void;
  updateProfile: (data: Partial<StudentProfile>) => void;
  updateEvidenceExplanation: (cat: CriterionType, id: string, explanation: string) => void;
  updateFieldExplanation: (field: keyof StudentProfile['verifications'], explanation: string) => void;
  onSubmit: () => void;
  onResubmit: () => void;
  onUnsubmit: () => void;
  allCriteria?: any[];
}> = ({ student, addEvidence, removeEvidence, updateProfile, updateEvidenceExplanation, updateFieldExplanation, onSubmit, onResubmit, onUnsubmit, allCriteria }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [addingTo, setAddingTo] = useState<{ 
    type: CriterionType, 
    isHard: boolean, 
    subName: string, 
    subId: string,
    hasDecisionNumber?: boolean,
    minQty?: number
  } | null>(null);

  // Local state for form inputs to prevent typing glitches
  const [localData, setLocalData] = useState({
    trainingPoints: student.trainingPoints || 0,
    gpa: student.gpa || 0,
    peScore: student.peScore || 0,
    englishGpa: student.englishGpa || 0,
    englishLevel: student.englishLevel || 'None',
    noViolation: student.noViolation || false,
    isPartyMember: student.isPartyMember || false,
  });

  // Sync localData when student prop changes from outside (e.g., initial load or save complete)
  React.useEffect(() => {
    // Check if we are focusing an input to avoid jumping
    const focusedEl = document.activeElement;
    const isEditing = focusedEl instanceof HTMLInputElement && (focusedEl.type === 'number' || focusedEl.type === 'text');
    
    setLocalData(prev => {
      const newData = {
        trainingPoints: student.trainingPoints || 0,
        gpa: student.gpa || 0,
        peScore: student.peScore || 0,
        englishGpa: student.englishGpa || 0,
        englishLevel: student.englishLevel || 'None',
        noViolation: student.noViolation || false,
        isPartyMember: student.isPartyMember || false,
      };
      
      if (JSON.stringify(prev) === JSON.stringify(newData)) return prev;
      
      // If editing, merge carefully: keep the field being edited
      if (isEditing) {
        return { ...newData, ...prev }; 
      }

      return newData;
    });
  }, [student.trainingPoints, student.gpa, student.peScore, student.englishGpa, student.englishLevel, student.noViolation, student.isPartyMember]);

  const handleLocalChange = (field: keyof typeof localData, value: any) => {
    setLocalData(prev => ({ ...prev, [field]: value }));
    if (typeof value === 'boolean' || field === 'englishLevel') {
      // For booleans/selects, update immediately
      updateProfile({ [field]: value });
    }
  };

  const handleBlur = (field: keyof typeof localData, isFloat = false, maxVal = 100) => {
    const valStr = String(localData[field]);
    let num = isFloat ? parseFloat(valStr) : parseInt(valStr, 10);
    if (isNaN(num)) num = 0;
    num = Math.min(maxVal, Math.max(0, num));
    
    // update local to formatted/capped value
    setLocalData(prev => ({ ...prev, [field]: num }));
    // trigger actual update
    updateProfile({ [field]: num });
  };

  const isLocked = student.status === 'Approved' || student.status === 'Submitted' || student.status === 'Rejected';
  const isProcessing = student.status === 'Processing';
  const isApproved = student.status === 'Approved';
  const isRejected = student.status === 'Rejected';

  // Lấy danh sách các mục bị Admin bắt lỗi
  const flaggedEvidences: { cat: CriterionType, ev: Evidence }[] = [];
  Object.entries(student.evidences).forEach(([cat, list]) => {
    (list as Evidence[]).forEach(ev => {
      if (ev.status === 'NeedsExplanation') flaggedEvidences.push({ cat: cat as CriterionType, ev });
    });
  });

  const flaggedFields: { key: keyof StudentProfile['verifications'], label: string, val: any }[] = [];
  if (student.verifications.trainingPoints?.status === 'NeedsExplanation') flaggedFields.push({ key: 'trainingPoints', label: 'Điểm rèn luyện', val: student.trainingPoints });
  if (student.verifications.gpa?.status === 'NeedsExplanation') flaggedFields.push({ key: 'gpa', label: 'GPA Học tập', val: student.gpa });
  if (student.verifications.peScore?.status === 'NeedsExplanation') flaggedFields.push({ key: 'peScore', label: 'Điểm Thể dục', val: student.peScore });
  if (student.verifications.english?.status === 'NeedsExplanation') flaggedFields.push({ key: 'english', label: 'Ngoại ngữ', val: `${student.englishLevel}` });

  // GIAO DIỆN KHI HỒ SƠ ĐANG CHỜ DUYỆT (LOCK)
  if (student.status === 'Submitted') {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-10 text-white shadow-2xl rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-3xl">
              <i className="fas fa-paper-plane animate-pulse"></i>
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight font-formal">Hồ sơ đã được nộp</h2>
              <p className="text-blue-100 font-bold uppercase text-[10px] tracking-widest mt-1">Trạng thái: Đang chờ thẩm định</p>
            </div>
          </div>
          <p className="text-sm font-medium leading-relaxed opacity-90 max-w-2xl">
            Hồ sơ của bạn đã được gửi lên hệ thống và đang chờ Ban thư ký Hội Sinh viên thẩm định. Trong thời gian này, các tính năng chỉnh sửa sẽ tạm khóa để đảm bảo tính toàn vẹn của dữ liệu.
          </p>
          <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap gap-4">
            <button 
              onClick={onUnsubmit} 
              className="px-8 py-3 bg-white text-blue-600 font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-orange-500 hover:text-white transition-all shadow-lg active:scale-95"
            >
              Hủy nộp để chỉnh sửa
            </button>
            <button 
              onClick={() => window.print()}
              className="px-8 py-3 bg-blue-700/50 text-white font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-blue-700 transition-all border border-white/20"
            >
              Xem & In hồ sơ (PDF)
            </button>
          </div>
        </div>

        {/* Thông tin thống kê nhanh */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Tổng điểm tích lũy', val: student.totalScore, icon: 'fa-star', color: 'text-orange-500' },
            { label: 'Tiêu chí đạt', val: Object.values(CriterionType).filter(c => checkHardMet(c as CriterionType, student, allCriteria)).length + '/5', icon: 'fa-check-circle', color: 'text-green-500' },
            { label: 'Minh chứng đính kèm', val: Object.values(student.evidences).flat().length, icon: 'fa-file-alt', color: 'text-blue-500' },
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-lg ${item.color}`}><i className={`fas ${item.icon}`}></i></div>
              <div>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                <p className="text-xl font-black text-gray-900 font-formal">{item.val}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // GIAO DIỆN KHI HỒ SƠ ĐÃ ĐƯỢC DUYỆT
  if (isApproved) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-10 text-white shadow-2xl rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-award"></i></div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Chúc mừng! Hồ sơ đã được duyệt</h2>
              <p className="text-green-100 text-sm font-medium mt-1">Bạn đã được công nhận danh hiệu "Sinh viên 5 Tốt"</p>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center">
            <i className="fas fa-check-circle text-green-600 text-4xl"></i>
          </div>
          <h3 className="text-xl font-black text-blue-900 uppercase">{student.fullName}</h3>
          <p className="text-gray-400 text-sm">Mã SV: {student.studentId} • {student.faculty}</p>
          <div className="bg-blue-50 rounded-lg p-6 inline-block">
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Tổng điểm tích lũy</p>
            <p className="text-5xl font-black text-blue-900 font-formal">{student.totalScore}</p>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN KHI HỒ SƠ BỊ TỪ CHỐI
  if (isRejected) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-gradient-to-r from-red-600 to-rose-600 p-10 text-white shadow-2xl rounded-lg">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-3xl"><i className="fas fa-times-circle"></i></div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tight">Hồ sơ không được duyệt</h2>
              <p className="text-red-100 text-sm font-medium mt-1">Rất tiếc, hồ sơ của bạn chưa đạt yêu cầu xét duyệt</p>
            </div>
          </div>
          {student.feedback && (
            <p className="text-sm font-medium border-l-4 border-white/40 pl-6 py-2 italic opacity-90 mt-4">
              Lý do: "{student.feedback}"
            </p>
          )}
        </div>
        <div className="bg-white border rounded-lg p-8 text-center space-y-6">
          <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center">
            <i className="fas fa-file-excel text-red-500 text-4xl"></i>
          </div>
          <h3 className="text-xl font-black text-blue-900 uppercase">{student.fullName}</h3>
          <p className="text-gray-400 text-sm">Mã SV: {student.studentId} • {student.faculty}</p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-5 max-w-md mx-auto">
            <p className="text-xs text-amber-700 font-medium"><i className="fas fa-info-circle mr-2"></i>Vui lòng liên hệ Ban cán sự lớp hoặc Đoàn - Hội Sinh viên để được hướng dẫn thêm.</p>
          </div>
        </div>
      </div>
    );
  }

  // GIAO DIỆN CHỈ HIỂN THỊ KHI ĐANG GIẢI TRÌNH
  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
        <div className="bg-[#f26522] p-10 text-white shadow-2xl rounded-sm">
          <div className="flex items-center gap-6 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl"><i className="fas fa-exclamation-circle"></i></div>
            <h2 className="text-2xl font-black uppercase tracking-tight">Chế độ Giải trình Hồ sơ</h2>
          </div>
          <p className="text-sm font-medium border-l-4 border-white/40 pl-6 py-2 italic opacity-90">
            " {student.feedback || "Vui lòng phản hồi các nội dung sau để Hội đồng tiếp tục xét duyệt."} "
          </p>
        </div>

        <div className="space-y-8">
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.4em] border-b-2 border-blue-900 pb-2 inline-block">Danh sách mục cần phản hồi</h3>

          {/* Loop qua các trường thông tin chung bị lỗi */}
          {flaggedFields.map(field => (
            <div key={field.key} className="bg-white border-2 border-orange-200 p-8 shadow-lg rounded-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <h4 className="text-base font-black text-blue-900 uppercase">{field.label}: <span className="text-orange-600 font-formal text-xl">{field.val}</span></h4>
                <span className="bg-orange-100 text-orange-700 text-[9px] font-black px-3 py-1 uppercase tracking-widest">Dữ liệu chung</span>
              </div>
              <div className="bg-orange-50/50 p-5 rounded border-l-4 border-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Lý do từ Admin:</p>
                <p className="text-xs text-gray-700 font-medium italic">"{student.verifications[field.key]?.feedback}"</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Nội dung giải trình của bạn:</label>
                <textarea
                  className="w-full p-4 border-2 border-gray-100 focus:border-orange-500 outline-none text-sm min-h-[120px] transition-all bg-gray-50/30"
                  placeholder="Nhập giải trình tại đây..."
                  value={student.verifications[field.key]?.feedback || ''}
                  onChange={(e) => updateFieldExplanation(field.key, e.target.value)}
                />
              </div>
            </div>
          ))}

          {/* Loop qua các minh chứng bị lỗi */}
          {flaggedEvidences.map(({ cat, ev }) => (
            <div key={ev.id} className="bg-white border-2 border-orange-200 p-8 shadow-lg rounded-sm space-y-6">
              <div className="flex justify-between items-center border-b border-gray-100 pb-4">
                <div>
                  <span className="text-[9px] font-black text-orange-600 uppercase tracking-[0.2em] mb-1 block">{cat}</span>
                  <h4 className="text-base font-black text-blue-900 uppercase">{ev.name}</h4>
                </div>
                <button onClick={() => window.open(ev.fileUrl, '_blank')} className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md">Mở Minh chứng</button>
              </div>
              <div className="bg-orange-50/50 p-5 rounded border-l-4 border-orange-400">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Lý do từ Admin:</p>
                <p className="text-xs text-gray-700 font-medium italic">"{ev.adminFeedback}"</p>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-blue-900 uppercase tracking-widest">Nội dung giải trình của bạn:</label>
                <textarea
                  className="w-full p-4 border-2 border-gray-100 focus:border-orange-500 outline-none text-sm min-h-[120px] transition-all bg-gray-50/30"
                  placeholder="Giải trình lý do hoặc bổ sung thông tin..."
                  value={ev.studentExplanation || ''}
                  onChange={(e) => updateEvidenceExplanation(cat, ev.id, e.target.value)}
                />
              </div>
            </div>
          ))}

          {flaggedFields.length === 0 && flaggedEvidences.length === 0 && (
            <div className="text-center py-24 bg-gray-100 border-2 border-dashed border-gray-200">
              <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Mọi yêu cầu đã được phản hồi. Bạn có thể gửi đi!</p>
            </div>
          )}
        </div>

        <div className="py-16 text-center border-t border-gray-100">
          <button
            onClick={onResubmit}
            className="px-20 py-6 bg-blue-900 text-white font-black text-xs uppercase tracking-[0.5em] hover:bg-[#f26522] transition-all shadow-2xl active:scale-95"
          >
            GỬI PHẢN HỒI GIẢI TRÌNH
          </button>
        </div>
      </div>
    );
  }

  // GIAO DIỆN NỘP MỚI (CHỈ HIỆN KHI LÀ DRAFT)
  const currentStep = STEPS[currentStepIdx];
  const isHardCriteriaStep = currentStep === 'HARD_CRITERIA';
  const isReviewStep = currentStep === 'SUBMIT';
  const isEvidenceStep = !isHardCriteriaStep && !isReviewStep;
  // Use currently typed data for instant Achieved UI feedback
  const currentStudentDataForCheck = {
    ...student,
    trainingPoints: localData.trainingPoints,
    gpa: localData.gpa,
    peScore: localData.peScore,
    englishGpa: localData.englishGpa,
    englishLevel: localData.englishLevel,
    noViolation: localData.noViolation,
    isPartyMember: localData.isPartyMember,
  };

  const catStatus = {
    [CriterionType.ETHICS]: checkHardMet(CriterionType.ETHICS, currentStudentDataForCheck, allCriteria || []),
    [CriterionType.ACADEMIC]: checkHardMet(CriterionType.ACADEMIC, currentStudentDataForCheck, allCriteria || []),
    [CriterionType.PHYSICAL]: checkHardMet(CriterionType.PHYSICAL, currentStudentDataForCheck, allCriteria || []),
    [CriterionType.VOLUNTEER]: checkHardMet(CriterionType.VOLUNTEER, currentStudentDataForCheck, allCriteria || []),
    [CriterionType.INTEGRATION]: checkHardMet(CriterionType.INTEGRATION, currentStudentDataForCheck, allCriteria || []),
  };

  const allHardMet = Object.values(catStatus).filter(v => v).length === 5;
  const metCount = Object.values(catStatus).filter(v => v).length;

  // ====== PHASE 1: TRANG TIÊU CHÍ CỨNG ======
  const renderHardCriteriaPage = () => {
    const criteriaCards: { cat: CriterionType; icon: string; label: string; color: string }[] = [
      { cat: CriterionType.ETHICS, icon: 'fa-heart', label: 'Đạo đức tốt', color: 'rose' },
      { cat: CriterionType.ACADEMIC, icon: 'fa-book-open', label: 'Học tập tốt', color: 'blue' },
      { cat: CriterionType.PHYSICAL, icon: 'fa-running', label: 'Thể lực tốt', color: 'emerald' },
      { cat: CriterionType.INTEGRATION, icon: 'fa-globe-asia', label: 'Hội nhập tốt', color: 'violet' },
    ];

    return (
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#002b5c] to-[#003d7a] p-8 text-white rounded-lg shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
                <i className="fas fa-clipboard-check text-2xl text-orange-400"></i>
              </div>
              <div>
                <h2 className="text-xl font-black uppercase tracking-tight">Bước 1 — Thông tin tiêu chí cứng</h2>
                <p className="text-blue-200/70 text-sm font-medium mt-1">Nhập đầy đủ thông tin các tiêu chí bắt buộc để đủ điều kiện xét duyệt</p>
              </div>
            </div>
            <div className="text-right hidden md:block">
              <p className="text-[9px] font-black uppercase tracking-widest text-orange-400 mb-1">Tiêu chí đạt</p>
              <p className="text-3xl font-black font-formal">{metCount}<span className="text-lg text-white/40">/5</span></p>
            </div>
          </div>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Đạo đức */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all ${catStatus[CriterionType.ETHICS] ? 'border-green-200' : 'border-gray-100'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${catStatus[CriterionType.ETHICS] ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStatus[CriterionType.ETHICS] ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-heart text-sm"></i>
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Đạo đức tốt</h3>
              </div>
              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${catStatus[CriterionType.ETHICS] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {catStatus[CriterionType.ETHICS] ? '✓ Đạt' : '✗ Chưa đạt'}
              </span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Điểm rèn luyện học kỳ (0-100) <span className="text-red-400">*</span></label>
                <input 
                  disabled={isLocked} 
                  type="number" max="100" 
                  value={localData.trainingPoints === 0 ? '' : localData.trainingPoints} 
                  onChange={(e) => handleLocalChange('trainingPoints', e.target.value)} 
                  onBlur={() => handleBlur('trainingPoints', false, 100)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" 
                  placeholder="Nhập từ 80 trở lên" 
                />
              </div>
              <div className="flex flex-col gap-3">
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all">
                  <input disabled={isLocked} type="checkbox" checked={localData.noViolation} onChange={(e) => handleLocalChange('noViolation', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-xs font-bold text-gray-700">Cam kết không vi phạm nội quy</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all">
                  <input disabled={isLocked} type="checkbox" checked={localData.isPartyMember} onChange={(e) => handleLocalChange('isPartyMember', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                  <span className="text-xs font-bold text-gray-700">Là Đảng viên Cộng sản Việt Nam <span className="text-orange-500 font-black">(+0.4đ)</span></span>
                </label>
              </div>
            </div>
          </div>

          {/* Học tập */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all ${catStatus[CriterionType.ACADEMIC] ? 'border-green-200' : 'border-gray-100'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${catStatus[CriterionType.ACADEMIC] ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStatus[CriterionType.ACADEMIC] ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-book-open text-sm"></i>
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Học tập tốt</h3>
              </div>
              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${catStatus[CriterionType.ACADEMIC] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {catStatus[CriterionType.ACADEMIC] ? '✓ Đạt' : '✗ Chưa đạt'}
              </span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GPA Học tập tích lũy (Hệ 4.0) <span className="text-red-400">*</span></label>
                <input 
                  disabled={isLocked} 
                  type="number" step="0.01" max="4.0" 
                  value={localData.gpa === 0 ? '' : localData.gpa} 
                  onChange={(e) => handleLocalChange('gpa', e.target.value)} 
                  onBlur={() => handleBlur('gpa', true, 4.0)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" 
                  placeholder="Nhập từ 3.2 trở lên" 
                />
              </div>
            </div>
          </div>

          {/* Thể lực */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all ${catStatus[CriterionType.PHYSICAL] ? 'border-green-200' : 'border-gray-100'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${catStatus[CriterionType.PHYSICAL] ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStatus[CriterionType.PHYSICAL] ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-running text-sm"></i>
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Thể lực tốt</h3>
              </div>
              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${catStatus[CriterionType.PHYSICAL] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {catStatus[CriterionType.PHYSICAL] ? '✓ Đạt' : '✗ Chưa đạt'}
              </span>
            </div>
            <div className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Điểm TB môn Thể dục (Thang 10) <span className="text-red-400">*</span></label>
                <input 
                  disabled={isLocked} 
                  type="number" step="0.1" max="10" 
                  value={localData.peScore === 0 ? '' : localData.peScore} 
                  onChange={(e) => handleLocalChange('peScore', e.target.value)} 
                  onBlur={() => handleBlur('peScore', true, 10.0)}
                  className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" 
                  placeholder="Nhập từ 7.0 trở lên" 
                />
              </div>
            </div>
          </div>

          {/* Hội nhập */}
          <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all ${catStatus[CriterionType.INTEGRATION] ? 'border-green-200' : 'border-gray-100'}`}>
            <div className={`px-6 py-4 flex items-center justify-between ${catStatus[CriterionType.INTEGRATION] ? 'bg-green-50' : 'bg-gray-50'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStatus[CriterionType.INTEGRATION] ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                  <i className="fas fa-globe-asia text-sm"></i>
                </div>
                <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Hội nhập tốt</h3>
              </div>
              <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${catStatus[CriterionType.INTEGRATION] ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {catStatus[CriterionType.INTEGRATION] ? '✓ Đạt' : '✗ Chưa đạt'}
              </span>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Chứng chỉ ngoại ngữ <span className="text-red-400">*</span></label>
                  <select disabled={isLocked} value={localData.englishLevel} onChange={(e) => handleLocalChange('englishLevel', e.target.value)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-bold text-xs transition-all focus:border-blue-600 outline-none">
                    <option value="None">Chưa có</option>
                    <option value="B1">B1</option>
                    <option value="B2">B2 trở lên</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GPA ngoại ngữ <span className="text-red-400">*</span></label>
                  <input 
                    disabled={isLocked} 
                    type="number" step="0.01" max="4" 
                    value={localData.englishGpa === 0 ? '' : localData.englishGpa} 
                    onChange={(e) => handleLocalChange('englishGpa', e.target.value)} 
                    onBlur={() => handleBlur('englishGpa', true, 4.0)}
                    className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg font-bold text-sm transition-all focus:border-blue-600 outline-none" 
                    placeholder="≥ 3.0" 
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tình nguyện note */}
        <div className={`bg-white border-2 rounded-lg shadow-sm overflow-hidden transition-all ${catStatus[CriterionType.VOLUNTEER] ? 'border-green-200' : 'border-gray-100'}`}>
          <div className={`px-6 py-4 flex items-center justify-between ${catStatus[CriterionType.VOLUNTEER] ? 'bg-green-50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${catStatus[CriterionType.VOLUNTEER] ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                <i className="fas fa-hands-helping text-sm"></i>
              </div>
              <h3 className="text-sm font-black text-blue-900 uppercase tracking-tight">Tình nguyện tốt</h3>
            </div>
            <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-widest rounded-full ${catStatus[CriterionType.VOLUNTEER] ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-600'}`}>
              {catStatus[CriterionType.VOLUNTEER] ? '✓ Đạt' : '➡ Đợi nộp minh chứng'}
            </span>
          </div>
          <div className="p-6">
            <div className={`flex items-start gap-3 p-4 rounded-lg border ${catStatus[CriterionType.VOLUNTEER] ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
              <i className={`fas ${catStatus[CriterionType.VOLUNTEER] ? 'fa-check text-green-500' : 'fa-info-circle text-blue-500'} mt-0.5`}></i>
              <p className={`text-xs font-medium leading-relaxed ${catStatus[CriterionType.VOLUNTEER] ? 'text-green-700' : 'text-blue-700'}`}>
                {catStatus[CriterionType.VOLUNTEER] 
                  ? 'Tuyệt vời! Bạn đã nộp đủ minh chứng cho tiêu chí Tình nguyện.'
                  : 'Đừng lo! Tiêu chí Tình nguyện cần được xác nhận bằng hồ sơ thật. Bạn vui lòng nhấn nút "Tiếp theo", tìm mục "Minh chứng tiêu chí CỨNG" và tải lên để được dán nhãn Đạt.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ====== PHASE 2: TRANG MINH CHỨNG BỔ SUNG ======
  const renderEvidencePage = (cat: CriterionType) => {
    const isHardMet = catStatus[cat];
    const profileBasedCodes = ['eth_hard_1', 'eth_hard_2', 'eth_point_1', 'eth_point_5', 'aca_hard_1', 'aca_point_7', 'phy_hard_1', 'int_hard_1', 'int_hard_2'];
    
    // Get criteria for this category from backend props
    const nhom = allCriteria?.find(n => n.TenNhom === cat);
    const backendSubs = (nhom?.tieu_chi || []).map((s: any) => ({
      id: String(s.id),
      code: s.MaTieuChi,
      description: s.MoTa || s.TenTieuChi || '',
      isHard: s.is_tieu_chi_cung,
      hasDecisionNumber: s.CoSoQuyetDinh,
      minQty: s.SoLuongToiThieu
    }));

    const currentSubs = backendSubs.length > 0 ? backendSubs : [];
    const hardSubs = currentSubs.filter(sub => sub.isHard && !profileBasedCodes.includes((sub as any).code || sub.id));
    const softSubs = currentSubs.filter(sub => !sub.isHard && !profileBasedCodes.includes((sub as any).code || sub.id));

    const catIcons: Record<string, string> = {
      [CriterionType.ETHICS]: 'fa-heart',
      [CriterionType.ACADEMIC]: 'fa-book-open',
      [CriterionType.PHYSICAL]: 'fa-running',
      [CriterionType.VOLUNTEER]: 'fa-hands-helping',
      [CriterionType.INTEGRATION]: 'fa-globe-asia',
    };

    return (
      <div className="animate-fade-in space-y-8">
        {/* Header */}
        <div className="bg-white border-2 border-gray-100 rounded-lg p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className={`fas ${catIcons[cat]} text-blue-600 text-lg`}></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">{cat}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Bước {currentStepIdx + 1}/{STEPS.length} — Minh chứng bổ sung</p>
            </div>
          </div>
          <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-full ${isHardMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {isHardMet ? '✓ Đạt tiêu chí cứng' : '✗ Chưa đạt tiêu chí cứng'}
          </span>
        </div>

        {/* Hard evidence subs (cần upload minh chứng) */}
        {hardSubs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] border-b-2 border-blue-900 pb-2 inline-block">
              <i className="fas fa-shield-alt mr-2"></i>Minh chứng tiêu chí cứng
            </h3>
            {hardSubs.map(sub => {
              const subEvs = student.evidences[cat].filter(e => e.subCriterionId === sub.id);
              return (
                <div key={sub.id} className={`p-5 border-l-4 transition-all bg-white rounded-lg shadow-sm ${subEvs.length > 0 ? 'border-blue-600' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-blue-600 rounded inline-block mb-1">Cứng</span>
                      <p className="text-xs font-bold text-gray-800 leading-snug">{sub.description}</p>
                    </div>
                    {!isLocked && (
                      <button 
                        onClick={() => setAddingTo({ 
                          type: cat, 
                          isHard: true, 
                          subName: sub.description, 
                          subId: sub.id, 
                          hasDecisionNumber: sub.hasDecisionNumber,
                          minQty: sub.minQty
                        })} 
                        className="px-4 py-2 bg-blue-50 text-blue-700 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-blue-100 transition-all whitespace-nowrap"
                      >
                        <i className="fas fa-upload mr-1.5"></i>Tải lên
                      </button>
                    )}
                  </div>
                  {subEvs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {subEvs.map(ev => (
                        <div key={ev.id} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-900">{ev.name} {ev.qty ? <span className="text-orange-600 font-black">({ev.qty})</span> : ''}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{ev.level} • {ev.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-blue-700 bg-blue-50 px-2 py-1 rounded">+{ev.points}đ</span>
                            {!isLocked && <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Soft evidence subs (điểm cộng) */}
        {softSubs.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] border-b-2 border-orange-400 pb-2 inline-block">
              <i className="fas fa-plus-circle mr-2"></i>Minh chứng tiêu chí cộng điểm
            </h3>
            {!isHardMet && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
                <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
                <p className="text-xs text-amber-700 font-medium">Bạn phải ưu tiên chọn <strong>Tải lên</strong> các <span className="text-orange-600 font-black">MINH CHỨNG TIÊU CHÍ CỨNG</span> ở khung phía trên trước. Sau khi tiêu chí cứng báo <span className="text-green-600">✓ Đạt</span>, bạn mới được nộp thêm minh chứng cộng điểm.</p>
              </div>
            )}
            {isHardMet && softSubs.map(sub => {
              const subEvs = student.evidences[cat].filter(e => e.subCriterionId === sub.id);
              return (
                <div key={sub.id} className={`p-5 border-l-4 transition-all bg-white rounded-lg shadow-sm ${subEvs.length > 0 ? 'border-orange-500' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-orange-500 rounded inline-block mb-1">Cộng</span>
                      <p className="text-xs font-bold text-gray-800 leading-snug">{sub.description}</p>
                    </div>
                    {!isLocked && (
                      <button onClick={() => setAddingTo({ type: cat, isHard: false, subName: sub.description, subId: sub.id })} className="px-4 py-2 bg-orange-50 text-orange-700 font-black text-[9px] uppercase tracking-widest rounded-lg hover:bg-orange-100 transition-all whitespace-nowrap">
                        <i className="fas fa-upload mr-1.5"></i>Tải lên
                      </button>
                    )}
                  </div>
                  {subEvs.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {subEvs.map(ev => (
                        <div key={ev.id} className="p-3 bg-gray-50 border rounded-lg flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-gray-900">{ev.name} {ev.qty ? <span className="text-orange-600 font-black">({ev.qty})</span> : ''}</span>
                            <span className="text-[8px] font-bold text-gray-400 uppercase">{ev.level} • {ev.status}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded">+{ev.points}đ</span>
                            {!isLocked && <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-300 hover:text-red-500 transition-colors"><i className="fas fa-trash-alt text-[10px]"></i></button>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {hardSubs.length === 0 && softSubs.length === 0 && (
          <div className="text-center py-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
            <i className="fas fa-check-circle text-green-400 text-3xl mb-4"></i>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Tiêu chí này được xác nhận qua dữ liệu đã nhập ở Bước 1</p>
          </div>
        )}
      </div>
    );
  };

  // ====== PHASE 3: SUBMIT ======
  const renderSubmitStep = () => {
    return (
      <div className="animate-fade-in space-y-10 text-center py-6">
        <div className="max-w-md mx-auto space-y-6">
          <div className={`w-20 h-20 mx-auto flex items-center justify-center rounded-full ring-4 transition-all ${allHardMet ? 'bg-green-100 ring-green-50' : 'bg-red-100 ring-red-50'}`}>
            <i className={`fas ${allHardMet ? 'fa-check text-green-600' : 'fa-times text-red-600'} text-3xl`}></i>
          </div>
          <h2 className="text-2xl font-black text-[#0054a6] uppercase font-formal">{allHardMet ? 'Sẵn sàng nộp hồ sơ' : 'Chưa đủ điều kiện'}</h2>
        </div>
        <div className="bg-[#002b5c] p-12 text-white border-4 border-white shadow-xl rounded-lg">
          <p className="text-[9px] font-black uppercase tracking-[0.4em] mb-2 text-orange-400">Tổng điểm tích lũy dự kiến</p>
          <h3 className="text-6xl font-bold mb-10 font-formal">{student.totalScore}</h3>

          <button disabled={isLocked || !allHardMet} onClick={onSubmit} className={`px-16 py-5 font-bold text-[10px] uppercase tracking-[0.3em] transition-all border-2 rounded-lg ${isLocked || !allHardMet ? 'border-gray-600 text-gray-600 cursor-not-allowed bg-transparent' : 'bg-orange-600 text-white hover:bg-white hover:text-blue-900 border-transparent active:scale-95'}`}>
            {isLocked ? 'HỒ SƠ ĐANG CHỜ DUYỆT' : 'GỬI XÉT DUYỆT CHÍNH THỨC'}
          </button>
        </div>
      </div>
    );
  };

  // ====== RENDER CHÍNH ======
  const renderCurrentStep = () => {
    if (isHardCriteriaStep) return renderHardCriteriaPage();
    if (isReviewStep) return renderSubmitStep();
    return renderEvidencePage(currentStep as CriterionType);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8">
        <div className="flex-1">
          <h1 className="text-3xl font-black text-[#0054a6] uppercase font-formal tracking-tighter">{student.fullName}</h1>
          <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Mã sinh viên: {student.studentId} • {student.faculty}</p>
          {/* Step progress */}
          <div className="flex items-center gap-1.5 mt-6">
            {STEPS.map((s, idx) => (
              <div key={idx} className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentStepIdx(idx)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer
                    ${idx === currentStepIdx
                      ? 'bg-blue-900 text-white shadow-md'
                      : idx < currentStepIdx
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                    }`}
                >
                  {idx < currentStepIdx && <i className="fas fa-check text-[7px]"></i>}
                  <span className="hidden sm:inline">{STEP_LABELS[s] || s}</span>
                  <span className="sm:hidden">{idx + 1}</span>
                </button>
                {idx < STEPS.length - 1 && <div className={`w-3 h-0.5 ${idx < currentStepIdx ? 'bg-blue-300' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { if (currentStepIdx > 0) setCurrentStepIdx(currentStepIdx - 1); }}
            disabled={currentStepIdx === 0}
            className={`px-6 py-3 font-black text-[9px] uppercase tracking-widest border rounded-lg transition-all flex items-center gap-2 ${currentStepIdx === 0 ? 'border-gray-100 text-gray-200' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}
          >
            <i className="fas fa-arrow-left text-[8px]"></i> Quay lại
          </button>
          <button
            onClick={() => { if (currentStepIdx < STEPS.length - 1) setCurrentStepIdx(currentStepIdx + 1); }}
            disabled={currentStepIdx === STEPS.length - 1}
            className={`px-6 py-3 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${currentStepIdx === STEPS.length - 1 ? 'bg-gray-100 text-gray-300' : 'bg-blue-900 text-white hover:bg-orange-600 shadow-md'}`}
          >
            Tiếp theo <i className="fas fa-arrow-right text-[8px]"></i>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">{renderCurrentStep()}</div>

      {/* Evidence Upload Modal */}
      {addingTo && !isLocked && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center bg-blue-950/90 backdrop-blur-sm p-4 animate-fade-in">
          <EvidenceForm 
            criterionType={addingTo.type} 
            isHard={addingTo.isHard} 
            subCriterionName={addingTo.subName} 
            selectedSubId={addingTo.subId}
            hasDecisionNumber={addingTo.hasDecisionNumber}
            minQty={addingTo.minQty}
            onAdd={(ev) => { 
              addEvidence(addingTo.type, { ...ev, subCriterionId: addingTo.subId, points: POINT_MATRIX[ev.level][ev.type] }); 
              setAddingTo(null); 
            }} 
            onCancel={() => setAddingTo(null)} 
          />
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
