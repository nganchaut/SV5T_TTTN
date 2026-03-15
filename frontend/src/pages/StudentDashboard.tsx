import React, { useState } from 'react';
import { CriterionType, Evidence, StudentProfile, EvidenceLevel, EvidenceType, FieldVerification } from '../types';
import { SUB_CRITERIA, FACES_OF_THE_YEAR as INITIAL_FACES } from '../constants';
import EvidenceForm from '../components/EvidenceForm';

const POINT_MATRIX: Record<EvidenceLevel, Record<EvidenceType, number>> = {
  [EvidenceLevel.KHOA]: { [EvidenceType.NO_DECISION]: 0.1, [EvidenceType.WITH_DECISION]: 0.1, [EvidenceType.GK]: 0.1 },
  [EvidenceLevel.TRUONG]: { [EvidenceType.NO_DECISION]: 0.2, [EvidenceType.WITH_DECISION]: 0.3, [EvidenceType.GK]: 0.4 },
  [EvidenceLevel.DHDN]: { [EvidenceType.NO_DECISION]: 0.3, [EvidenceType.WITH_DECISION]: 0.4, [EvidenceType.GK]: 0.5 },
  [EvidenceLevel.TINH_TP]: { [EvidenceType.NO_DECISION]: 0.4, [EvidenceType.WITH_DECISION]: 0.5, [EvidenceType.GK]: 0.6 },
  [EvidenceLevel.TW]: { [EvidenceType.NO_DECISION]: 0.5, [EvidenceType.WITH_DECISION]: 0.6, [EvidenceType.GK]: 0.7 },
};

const STEPS = [
  CriterionType.ETHICS,
  CriterionType.ACADEMIC,
  CriterionType.PHYSICAL,
  CriterionType.VOLUNTEER,
  CriterionType.INTEGRATION,
  'SUBMIT' as const
];

const STEP_LABELS: Record<string, string> = {
  [CriterionType.ETHICS]: 'Đạo đức tốt',
  [CriterionType.ACADEMIC]: 'Học tập tốt',
  [CriterionType.PHYSICAL]: 'Thể lực tốt',
  [CriterionType.VOLUNTEER]: 'Tình nguyện tốt',
  [CriterionType.INTEGRATION]: 'Hội nhập tốt',
  'SUBMIT': 'Gửi hồ sơ',
};

export const checkHardMet = (cat: CriterionType, student: StudentProfile, criteriaGroups: any[]) => {
  const group = criteriaGroups.find(g => {
    const catMap: Record<string, CriterionType> = {
      'Đạo đức tốt': CriterionType.ETHICS,
      'Học tập tốt': CriterionType.ACADEMIC,
      'Thể lực tốt': CriterionType.PHYSICAL,
      'Tình nguyện tốt': CriterionType.VOLUNTEER,
      'Hội nhập tốt': CriterionType.INTEGRATION
    };
    return catMap[g.TenNhom] === cat;
  });

  if (!group) return false;

  const evs = student.evidences[cat] || [];
  const approvedEvs = evs.filter(e => e.status === 'Approved' || e.status === 'Pending');

  // All hard criteria from backend must be met
  const hardCriteria = group.tieu_chi.filter((tc: any) => tc.LoaiTieuChi === 'Cung');
  
  if (hardCriteria.length === 0) {
    // Fallback logic for basic requirements if no criteria are defined in backend
    // but usually there should be.
    if (cat === CriterionType.ETHICS) return student.trainingPoints >= 80 && student.noViolation;
    if (cat === CriterionType.ACADEMIC) return student.gpa >= 3.2 && student.gpa <= 4.0;
    return true;
  }

  const isVolunteer = cat === CriterionType.VOLUNTEER;
  const results = hardCriteria.map((tc: any) => {
    const slug = tc.MaTieuChi;
    
    // Profile-based checks
    if (slug === 'eth_hard_1') return student.trainingPoints >= 80;
    if (slug === 'eth_hard_2') return student.noViolation;
    if (slug === 'aca_hard_1') return student.gpa >= 3.2;
    if (slug === 'phy_hard_1') return student.peScore >= 7.0;
    
    // Education Level/English (Integration)
    if (slug === 'int_hard_1' || slug === 'int_hard_2') {
       return (['B1', 'B2'].includes(student.englishLevel) || student.englishGpa >= 3.0);
    }

    // Special logic for slug-based evidence (if any)
    if (slug === 'phy_hard_2') {
       return student.peScore >= 7.0 || approvedEvs.some(e => e.subCriterionId === tc.MaTieuChi);
    }
    
    // Quantity rules for Volunteer
    if (isVolunteer) {
      const matchingEvs = approvedEvs.filter(e => e.subCriterionId === slug);
      const count = matchingEvs.length;
      const gkCount = matchingEvs.filter(e => e.type === EvidenceType.GK).length;

      if (slug === 'vol_hard_1') return count >= 1; // Chiến dịch: 1 GCN
      if (slug === 'vol_hard_2') return count >= 3; // 3 ngày: 3 GCN
      if (slug === 'vol_hard_3') {
        const validGK = matchingEvs.filter(e => 
          e.type === EvidenceType.GK && 
          e.level !== EvidenceLevel.KHOA // Cấp trường trở lên
        ).length;
        return validGK >= 1;
      }
      if (slug === 'vol_hard_4') {
        // Hiến máu: 2 GCN tại DUE (TRUONG) hoặc 3 GCN tổng cộng
        const atDue = matchingEvs.filter(e => e.level === EvidenceLevel.TRUONG).length;
        return atDue >= 2 || count >= 3;
      }
      return count >= 1;
    }

    // Default: Check if any approved evidence exists for this specific TC ID
    return approvedEvs.some(e => e.subCriterionId === tc.MaTieuChi);
  });

  return isVolunteer ? results.some(r => !!r) : results.every(r => !!r);
};

const StudentDashboard: React.FC<{
  student: StudentProfile;
  addEvidence: (type: CriterionType, ev: Evidence) => void;
  removeEvidence: (type: CriterionType, id: string) => void;
  updateEvidence: (type: CriterionType, id: string, ev: Evidence) => void;
  updateProfile: (data: Partial<StudentProfile>) => void;
  updateEvidenceExplanation: (cat: CriterionType, id: string, explanation: string) => void;
  updateFieldExplanation: (field: keyof StudentProfile['verifications'], explanation: string) => void;
  onSubmit: () => void;
  onResubmit: () => void;
  onUnsubmit: () => void;
  criteriaGroups: any[];
}> = ({ student, addEvidence, removeEvidence, updateEvidence, updateProfile, updateEvidenceExplanation, updateFieldExplanation, onSubmit, onResubmit, onUnsubmit, criteriaGroups }) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [addingTo, setAddingTo] = useState<{ type: CriterionType, isHard: boolean, subName: string, editingEvidence?: Evidence } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const handleFinalSubmitExplanation = async () => {
    try {
      setIsResubmitting(true);
      
      // 1. Gửi giải trình cho các trường dữ liệu chung (CHỈ gửi khi có thay đổi)
      for (const [key, exp] of Object.entries(localFieldExplanations)) {
        const file = localFieldFiles[key];
        const originalExp = (student.verifications[key] as FieldVerification)?.explanation || '';
        if (exp !== originalExp || file) {
          await updateFieldExplanation(key as any, exp, file);
        }
      }

      // 2. Gửi giải trình cho các minh chứng (CHỈ gửi khi có thay đổi)
      for (const [id, exp] of Object.entries(localEvidenceExplanations)) {
        const file = localEvidenceFiles[id];
        
        // Tìm minh chứng gốc để so sánh
        let originalEv: Evidence | undefined;
        let category: CriterionType | null = null;
        for (const [cat, evs] of Object.entries(student.evidences)) {
          const found = (evs as Evidence[]).find(e => e.id === id);
          if (found) {
            originalEv = found;
            category = cat as CriterionType;
            break;
          }
        }

        const originalExp = originalEv?.studentExplanation || '';
        if (category && (exp !== originalExp || file)) {
          await updateEvidenceExplanation(category, id, exp, file);
        }
      }

      // 3. Cuối cùng mới thực hiện submit profile để chuyển trạng thái sang Submitted
      await onResubmit();
      
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (e) {
      console.error("Submit Error:", e);
      alert("Có lỗi xảy ra khi gửi giải trình. Vui lòng thử lại.");
    } finally {
      setIsResubmitting(false);
    }
  };

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

  // Local state for explanations to prevent lag
  const [localFieldExplanations, setLocalFieldExplanations] = useState<Record<string, string>>({});
  const [localEvidenceExplanations, setLocalEvidenceExplanations] = useState<Record<string, string>>({});
  const [localFieldFiles, setLocalFieldFiles] = useState<Record<string, File>>({});
  const [localEvidenceFiles, setLocalEvidenceFiles] = useState<Record<string, File>>({});

  // Initialize local explanations from current student data
  React.useEffect(() => {
    const fieldExps: Record<string, string> = {};
    Object.entries(student.verifications).forEach(([k, v]) => {
      const fieldVer = v as FieldVerification;
      if (fieldVer.explanation) fieldExps[k] = fieldVer.explanation;
    });
    setLocalFieldExplanations(fieldExps);

    const evExps: Record<string, string> = {};
    Object.values(student.evidences).flat().forEach(val => {
      const ev = val as Evidence;
      if (ev.studentExplanation) evExps[ev.id] = ev.studentExplanation;
    });
    setLocalEvidenceExplanations(evExps);
  }, [student.id]);

  // Remove the aggressive useEffect that overwrites localData on every keystroke/save 
  // Sync localData ONLY when student ID changes (e.g., initial load or user switch)
  React.useEffect(() => {
    setLocalData({
      trainingPoints: student.trainingPoints || 0,
      gpa: student.gpa || 0,
      peScore: student.peScore || 0,
      englishGpa: student.englishGpa || 0,
      englishLevel: student.englishLevel || 'None',
      noViolation: student.noViolation || false,
      isPartyMember: student.isPartyMember || false,
    });
  }, [student.id]);

  const handleLocalChange = (field: keyof typeof localData, value: any) => {
    // For booleans, the value comes straight from the onChange event 
    const finalValue = field === 'noViolation' && typeof value === 'string' ? value === 'true' : value;
    
    setLocalData(prev => ({ ...prev, [field]: finalValue }));
    if (typeof finalValue === 'boolean' || field === 'englishLevel') {
      // For booleans/selects, update immediately
      updateProfile({ [field]: finalValue });
    }
  };

  const handleBlur = (field: keyof typeof localData, isFloat = false, maxVal = 100) => {
    const valStr = String(localData[field]);
    if (valStr.trim() === '') {
       // Allow empty fields (represented as 0 or null depending on backend)
       setLocalData(prev => ({ ...prev, [field]: 0 }));
       updateProfile({ [field]: 0 });
       return;
    }

    let num = isFloat ? parseFloat(valStr) : parseInt(valStr, 10);
    if (isNaN(num)) num = 0;
    num = Math.min(maxVal, Math.max(0, num));
    
    // update local to formatted/capped value
    setLocalData(prev => ({ ...prev, [field]: num }));
    // trigger actual update
    updateProfile({ [field]: num });
  };

  const handleSaveEvidence = (ev: Evidence) => {
    if (addingTo?.editingEvidence) {
      updateEvidence(addingTo.type, addingTo.editingEvidence.id, ev);
    } else {
      addEvidence(addingTo!.type, ev);
    }
    setAddingTo(null);
  };

  const handleEditClick = (type: CriterionType, isHard: boolean, ev: Evidence) => {
    // Find sub-criterion name
    const group = criteriaGroups.find(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      return catMap[g.TenNhom] === type;
    });
    const sub = group?.tieu_chi.find((tc: any) => String(tc.id) === ev.subCriterionId);
    
    setAddingTo({
      type,
      isHard,
      subName: sub?.MoTa || '',
      editingEvidence: ev
    });
  };

  const isLocked = ['Submitted', 'Approved', 'Rejected'].includes(student.status);
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
            { label: 'Tiêu chí đạt', val: Object.values(CriterionType).filter(c => checkHardMet(c as CriterionType, student, criteriaGroups)).length + '/5', icon: 'fa-check-circle', color: 'text-green-500' },
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
                  value={localFieldExplanations[field.key] || ''}
                  onChange={(e) => setLocalFieldExplanations(prev => ({ ...prev, [field.key]: e.target.value }))}
                />

                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`field-file-upload-${field.key}`}
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLocalFieldFiles(prev => ({ ...prev, [field.key]: file }));
                          alert("Đã chọn file: " + file.name + ". File sẽ được gửi khi bạn bấm nút Gửi Phản Hồi Giải Trình.");
                        }
                      }}
                    />
                    <label htmlFor={`field-file-upload-${field.key}`} className={`px-4 py-2 border-2 border-dashed rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${localFieldFiles[field.key] ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}>
                      <i className={localFieldFiles[field.key] ? "fas fa-check-circle" : "fas fa-paperclip"}></i>
                      {localFieldFiles[field.key] ? `Đã chọn: ${localFieldFiles[field.key].name}` : "Tải lên file Hình ảnh/PDF mới"}
                    </label>
                    <span className="text-[10px] text-gray-400 italic">Chọn file minh chứng bổ sung cho {field.label.toLowerCase()}.</span>
                  </div>
                </div>
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
                <button 
                  onClick={() => {
                     if (!ev.fileUrl) {
                        alert('Không tìm thấy file đính kèm hợp lệ!');
                        return;
                     }
                     const url = ev.fileUrl.startsWith('http') ? ev.fileUrl : `http://localhost:8000${ev.fileUrl.startsWith('/') ? '' : '/'}${ev.fileUrl}`;
                     window.open(url, '_blank');
                  }} 
                  className="px-5 py-2.5 bg-blue-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-orange-600 transition-all shadow-md"
                >
                   Mở Minh chứng
                </button>
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
                  value={localEvidenceExplanations[ev.id] || ''}
                  onChange={(e) => setLocalEvidenceExplanations(prev => ({ ...prev, [ev.id]: e.target.value }))}
                />
                
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      id={`file-upload-${ev.id}`}
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLocalEvidenceFiles(prev => ({ ...prev, [ev.id]: file }));
                          alert("Đã chọn file: " + file.name + ". File sẽ được gửi khi bạn bấm nút Gửi Phản Hồi Giải Trình.");
                        }
                      }}
                    />
                    <label htmlFor={`file-upload-${ev.id}`} className={`px-4 py-2 border-2 border-dashed rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${localEvidenceFiles[ev.id] ? 'border-green-500 text-green-600 bg-green-50' : 'border-gray-300 text-gray-500 hover:border-blue-500 hover:text-blue-600'}`}>
                      <i className={localEvidenceFiles[ev.id] ? "fas fa-check-circle" : "fas fa-paperclip"}></i>
                      {localEvidenceFiles[ev.id] ? `Đã chọn: ${localEvidenceFiles[ev.id].name}` : "Tải lên file Hình ảnh/PDF mới"}
                    </label>
                    <span className="text-[10px] text-gray-400 italic">Chọn file để thay thế hoặc bổ sung minh chứng.</span>
                  </div>
                </div>
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
            onClick={handleFinalSubmitExplanation}
            disabled={isResubmitting}
            className={`px-20 py-6 font-black text-xs uppercase tracking-[0.5em] transition-all shadow-2xl active:scale-95 flex items-center gap-4 mx-auto
              ${isResubmitting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 text-white hover:bg-[#f26522]'}`}
          >
            {isResubmitting && <i className="fas fa-spinner fa-spin"></i>}
            GỬI PHẢN HỒI GIẢI TRÌNH
          </button>
        </div>
      </div>
    );
  }

  // GIAO DIỆN NỘP MỚI (CHỈ HIỆN KHI LÀ DRAFT)
  const currentStep = STEPS[currentStepIdx];
  const isReviewStep = currentStep === 'SUBMIT';
  const isEvidenceStep = !isReviewStep;
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
    [CriterionType.ETHICS]: checkHardMet(CriterionType.ETHICS, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.ACADEMIC]: checkHardMet(CriterionType.ACADEMIC, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.PHYSICAL]: checkHardMet(CriterionType.PHYSICAL, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.VOLUNTEER]: checkHardMet(CriterionType.VOLUNTEER, currentStudentDataForCheck, criteriaGroups),
    [CriterionType.INTEGRATION]: checkHardMet(CriterionType.INTEGRATION, currentStudentDataForCheck, criteriaGroups),
  };

  const allHardMet = Object.values(catStatus).filter(v => v).length === 5;
  const metCount = Object.values(catStatus).filter(v => v).length;

  // ====== PHASE 1: TRANG TIÊU CHÍ CỨNG ======

  // ====== PHASE 2: TRANG MINH CHỨNG BỔ SUNG ======
  const renderEvidencePage = (cat: CriterionType) => {
    const isHardMet = catStatus[cat];

    const catIcons: Record<string, string> = {
      [CriterionType.ETHICS]: 'fa-heart',
      [CriterionType.ACADEMIC]: 'fa-book-open',
      [CriterionType.PHYSICAL]: 'fa-running',
      [CriterionType.VOLUNTEER]: 'fa-hands-helping',
      [CriterionType.INTEGRATION]: 'fa-globe-asia',
    };

    const groups: Record<string, any> = {};
    criteriaGroups.forEach(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      groups[catMap[g.TenNhom]] = g;
    });

    const currentGroup = groups[cat];
    const hardSubsRaw = currentGroup?.tieu_chi?.filter((tc: any) => tc.LoaiTieuChi === 'Cung') || [];
    const softSubsRaw = currentGroup?.tieu_chi?.filter((tc: any) => tc.LoaiTieuChi === 'Cong') || [];

    const profileBasedSlugs = ['eth_hard_1', 'eth_hard_2', 'eth_point_1', 'eth_point_5', 'aca_hard_1', 'aca_point_7', 'phy_hard_1', 'int_hard_1', 'int_hard_2'];
    
    // Separate hard into Profile vs Uploads
    const hardProfileSlugs = hardSubsRaw.filter((tc: any) => profileBasedSlugs.includes(tc.MaTieuChi));
    const hardUploads = hardSubsRaw.filter((tc: any) => !profileBasedSlugs.includes(tc.MaTieuChi));

    return (
      <div className="animate-fade-in space-y-8">
        {/* Category Header */}
        <div className="bg-white border-2 border-gray-100 rounded-lg p-6 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <i className={`fas ${catIcons[cat]} text-blue-600 text-lg`}></i>
            </div>
            <div>
              <h2 className="text-lg font-black text-blue-900 uppercase tracking-tight">{cat}</h2>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tiêu chí {currentStepIdx + 1}/{STEPS.length - 1}</p>
            </div>
          </div>
          <span className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-full ${isHardMet ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
            {isHardMet ? '✓ Đạt tiêu chí cứng' : '✗ Chưa đạt tiêu chí cứng'}
          </span>
        </div>

        {/* Section 1: MANDATORY CRITERIA (Hard) */}
        <div className="space-y-6">
          <h3 className="text-[10px] font-black text-blue-900 uppercase tracking-[0.2em] border-b-2 border-blue-900 pb-2 inline-block">
            <i className="fas fa-exclamation-circle mr-2"></i>Tiêu chí bắt buộc (Phải đạt)
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Hard Profile Fields */}
            {hardProfileSlugs.length > 0 && (
              <div className="bg-gray-50/50 p-6 rounded-lg border border-gray-100 space-y-4">
                {cat === CriterionType.ETHICS && (
                  <>
                    {hardProfileSlugs.some((tc: any) => tc.MaTieuChi === 'eth_hard_1') && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Điểm rèn luyện <span className="text-red-400">*</span></label>
                        <input disabled={isLocked} type="number" max="100" value={localData.trainingPoints === 0 ? '' : localData.trainingPoints} onChange={(e) => handleLocalChange('trainingPoints', e.target.value)} onBlur={() => handleBlur('trainingPoints', false, 100)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                      </div>
                    )}
                    {hardProfileSlugs.some((tc: any) => tc.MaTieuChi === 'eth_hard_2') && (
                      <label className="flex items-center gap-3 cursor-pointer p-3 rounded-lg border border-gray-100 bg-white hover:bg-gray-50 transition-all">
                        <input disabled={isLocked} type="checkbox" checked={!!localData.noViolation} onChange={(e) => handleLocalChange('noViolation', e.target.checked)} className="w-4 h-4 accent-blue-600 rounded" />
                        <span className="text-[11px] font-bold text-gray-700">Cam kết không vi phạm nội quy</span>
                      </label>
                    )}
                  </>
                )}
                {cat === CriterionType.ACADEMIC && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">GPA Hệ 4.0 <span className="text-red-400">*</span></label>
                    <input disabled={isLocked} type="number" step="0.01" max="4.0" value={localData.gpa === 0 ? '' : localData.gpa} onChange={(e) => handleLocalChange('gpa', e.target.value)} onBlur={() => handleBlur('gpa', true, 4.0)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                  </div>
                )}
                {cat === CriterionType.PHYSICAL && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Điểm Thể dục <span className="text-red-400">*</span></label>
                    <input disabled={isLocked} type="number" step="0.1" max="10" value={localData.peScore === 0 ? '' : localData.peScore} onChange={(e) => handleLocalChange('peScore', e.target.value)} onBlur={() => handleBlur('peScore', true, 10.0)} className="w-full px-4 py-3 border-2 border-gray-100 rounded-lg focus:border-blue-600 outline-none font-bold text-sm transition-all" />
                  </div>
                )}
                {cat === CriterionType.INTEGRATION && (
                   <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Ngoại ngữ <span className="text-red-400">*</span></label>
                       <select disabled={isLocked} value={localData.englishLevel} onChange={(e) => handleLocalChange('englishLevel', e.target.value)} className="w-full px-3 py-3 border-2 border-gray-100 rounded-lg font-bold text-[11px] transition-all focus:border-blue-600 outline-none">
                         <option value="None">Chưa có</option>
                         <option value="B1">B1</option>
                         <option value="B2">B2+</option>
                       </select>
                     </div>
                     <div className="space-y-2">
                       <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">GPA NN <span className="text-red-400">*</span></label>
                       <input disabled={isLocked} type="number" step="0.01" max="4" value={localData.englishGpa === 0 ? '' : localData.englishGpa} onChange={(e) => handleLocalChange('englishGpa', e.target.value)} onBlur={() => handleBlur('englishGpa', true, 4.0)} className="w-full px-3 py-3 border-2 border-gray-100 rounded-lg font-bold text-sm transition-all focus:border-blue-600 outline-none" />
                     </div>
                   </div>
                )}
              </div>
            )}

            {/* Hard Evidence (Uploads) */}
            <div className={`space-y-4 ${hardProfileSlugs.length === 0 ? 'md:col-span-2' : ''}`}>
               {hardUploads.length === 0 && hardProfileSlugs.length === 0 && (
                 <div className="p-4 bg-gray-50 border border-dashed text-center rounded-lg">
                   <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Không có tiêu chí cứng bổ sung</p>
                 </div>
               )}
               {hardUploads.map((sub: any) => {
                  const subEvs = student.evidences[cat].filter(e => e.subCriterionId === sub.MaTieuChi);
                  return (
                    <div key={sub.MaTieuChi} className={`p-4 bg-white border-2 rounded-lg shadow-sm transition-all ${subEvs.length > 0 ? 'border-blue-100' : 'border-gray-100'}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-blue-600 rounded inline-block mb-1">Bắt buộc</span>
                          <p className="text-xs font-bold text-gray-800 leading-tight">{sub.MoTa}</p>
                        </div>
                        {!isLocked && (
                          <button 
                            onClick={() => setAddingTo({ type: cat, isHard: true, subName: sub.MoTa, subId: sub.MaTieuChi })} 
                            className={`px-4 py-2 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${subEvs.length > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                          >
                            {subEvs.length > 0 ? <><i className="fas fa-check-circle mr-1"></i>Đã nộp</> : <><i className="fas fa-upload mr-1"></i>Tải lên</>}
                          </button>
                        )}
                      </div>
                      {subEvs.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {subEvs.map(ev => (
                            <div key={ev.id} className="p-2.5 bg-gray-50 border rounded-lg flex items-center justify-between">
                              <span className="text-[10px] font-bold text-gray-900 truncate max-w-[200px]">{ev.name}</span>
                              <div className="flex items-center gap-2">
                                {!isLocked && (
                                  <>
                                    <button onClick={() => setAddingTo({ type: cat, isHard: true, subName: sub.MoTa, subId: sub.MaTieuChi, editingEvidence: ev })} className="text-gray-400 hover:text-blue-500"><i className="fas fa-edit text-[10px]"></i></button>
                                    <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-400 hover:text-red-500"><i className="fas fa-trash-alt text-[10px]"></i></button>
                                  </>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
               })}
            </div>
          </div>
        </div>

        {/* Section 2: OPTIONAL CRITERIA (Soft/Points) */}
        <div className="space-y-4">
          <h3 className="text-[10px] font-black text-orange-600 uppercase tracking-[0.2em] border-b-2 border-orange-400 pb-2 inline-block">
            <i className="fas fa-plus-circle mr-2"></i>Tiêu chí cộng điểm (Tùy chọn)
          </h3>
          
          {!isHardMet && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <i className="fas fa-exclamation-triangle text-amber-500 mt-0.5"></i>
              <p className="text-xs text-amber-700 font-medium italic">Bạn cần đạt các <span className="text-blue-600 font-black uppercase">Tiêu chí cứng</span> bên trên trước khi có thể nộp minh chứng cộng điểm cho mục này.</p>
            </div>
          )}

          <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isHardMet ? 'opacity-40 pointer-events-none' : ''}`}>
            {softSubsRaw.length === 0 ? (
               <div className="md:col-span-2 text-center py-6 bg-gray-50 border-2 border-dashed border-gray-100 rounded-lg">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Không có tiêu chí cộng điểm nào</p>
               </div>
            ) : (
              softSubsRaw.map((sub: any) => {
                const subEvs = student.evidences[cat].filter(e => e.subCriterionId === sub.MaTieuChi);
                return (
                  <div key={sub.MaTieuChi} className={`p-4 border-2 transition-all bg-white rounded-lg shadow-sm ${subEvs.length > 0 ? 'border-orange-100' : 'border-gray-100'}`}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <span className="text-[8px] font-black uppercase px-2 py-0.5 text-white bg-orange-500 rounded inline-block mb-1">Cộng</span>
                        <p className="text-[11px] font-bold text-gray-800 leading-snug">{sub.MoTa}</p>
                      </div>
                      {!isLocked && (
                        <button 
                          onClick={() => setAddingTo({ type: cat, isHard: false, subName: sub.MoTa, subId: sub.MaTieuChi })} 
                          className={`px-3 py-1.5 font-black text-[9px] uppercase tracking-widest rounded-lg transition-all whitespace-nowrap ${subEvs.length > 0 ? 'bg-green-50 text-green-700 hover:bg-green-100' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'}`}
                        >
                          {subEvs.length > 0 ? <><i className="fas fa-check-circle mr-1"></i>Đã nộp</> : <><i className="fas fa-upload mr-1"></i>Tải lên</>}
                        </button>
                      )}
                    </div>
                    {subEvs.length > 0 && (
                      <div className="mt-3 space-y-2">
                        {subEvs.map(ev => (
                          <div key={ev.id} className="p-2.5 bg-gray-50 border rounded-lg flex items-center justify-between">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-gray-900">{ev.name} {ev.qty ? <span className="text-orange-600 font-black">({ev.qty})</span> : ''}</span>
                              <span className="text-[9px] font-black text-orange-600 mt-0.5">+{ev.points}đ</span>
                            </div>
                            <div className="flex items-center gap-2">
                              {!isLocked && (
                                <>
                                  <button onClick={() => setAddingTo({ type: cat, isHard: false, subName: sub.MoTa, subId: sub.MaTieuChi, editingEvidence: ev })} className="text-gray-300 hover:text-blue-500"><i className="fas fa-edit text-[10px]"></i></button>
                                  <button onClick={() => removeEvidence(cat, ev.id)} className="text-gray-300 hover:text-red-500"><i className="fas fa-trash-alt text-[10px]"></i></button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
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
    if (isReviewStep) return renderSubmitStep();
    return renderEvidencePage(currentStep as CriterionType);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-fade-in space-y-10 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-6 border-b pb-8">
        <div className="flex-1">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-[#0054a6] uppercase font-formal tracking-tighter">{student.fullName}</h1>
              <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] mt-1 italic">Mã sinh viên: {student.studentId} • {student.faculty}</p>
            </div>
            <div className={`text-right hidden sm:block px-5 py-3 rounded-xl shadow-sm border ${allHardMet ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-100'}`}>
              <p className={`text-[8px] font-black uppercase tracking-[0.2em] mb-0.5 ${allHardMet ? 'text-green-800' : 'text-blue-900'}`}>Tiêu chí Đạt</p>
              <p className={`text-2xl font-black font-formal ${allHardMet ? 'text-green-700' : 'text-blue-900'}`}>{metCount}<span className={`text-sm ${allHardMet ? 'text-green-500' : 'text-blue-400/80'}`}> / 5</span></p>
            </div>
          </div>
          {/* Step progress */}
          <div className="flex items-center gap-1.5 mt-6 overflow-x-auto pb-2 scrollbar-none">
            {STEPS.map((s, idx) => {
              const isCat = s !== 'SUBMIT';
              const isMet = isCat ? catStatus[s as CriterionType] : allHardMet;
              const isActive = idx === currentStepIdx;

              return (
                <div key={idx} className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentStepIdx(idx)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[8px] font-black uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap
                      ${isActive
                        ? (isMet ? 'bg-green-600 text-white shadow-lg scale-105' : 'bg-red-600 text-white shadow-lg scale-105')
                        : (isMet ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100')
                      }`}
                  >
                    {isMet ? <i className="fas fa-check-circle text-[8px]"></i> : <i className="fas fa-exclamation-circle text-[8px]"></i>}
                    <span className="hidden sm:inline">{STEP_LABELS[s] || s}</span>
                    <span className="sm:hidden">{idx + 1}</span>
                  </button>
                  {idx < STEPS.length - 1 && (
                    <div className={`w-3 h-0.5 ${isMet ? 'bg-green-300' : 'bg-gray-200'}`}></div>
                  )}
                </div>
              );
            })}
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
            subCriterionId={addingTo.subId}
            initialData={addingTo.editingEvidence}
            criteriaGroups={criteriaGroups}
            onAdd={handleSaveEvidence} 
            onCancel={() => setAddingTo(null)} 
          />
        </div>
      )}
      {/* Success Modal Overlay */}
      {showSuccess && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-blue-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white p-12 rounded-3xl shadow-2xl border-2 border-green-500 scale-110 animate-scale-up text-center space-y-6">
            <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
              <i className="fas fa-check"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-blue-900 uppercase tracking-tight">GỬI THÀNH CÔNG!</h2>
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-2">Phản hồi của bạn đã được gửi đến Admin xử lý.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
