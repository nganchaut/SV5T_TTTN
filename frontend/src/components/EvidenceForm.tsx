
import React, { useState, useMemo, useEffect } from 'react';
import { CriterionType, EvidenceLevel, EvidenceType, Evidence } from '../types';
import { SUB_CRITERIA, POINT_MATRIX } from '../constants';

interface EvidenceFormProps {
  criterionType: CriterionType;
  isHard: boolean;
  subCriterionName: string; 
  subCriterionId?: string; // Bổ sung ID để binding chính xác
  initialData?: Evidence;
  criteriaGroups: any[];
  onAdd: (evidence: Evidence) => void;
  onCancel: () => void;
}

const EvidenceForm: React.FC<EvidenceFormProps> = ({ criterionType, isHard, subCriterionName, subCriterionId: propsSubId, initialData, criteriaGroups, onAdd, onCancel }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [subCriterionId, setSubCriterionId] = useState(initialData?.subCriterionId || propsSubId || '');
  const [level, setLevel] = useState<EvidenceLevel>(initialData?.level || EvidenceLevel.KHOA);
  const [type, setType] = useState<EvidenceType>(initialData?.type || EvidenceType.NO_DECISION);
  const [decisionNumber, setDecisionNumber] = useState(initialData?.decisionNumber || '');
  const [qty, setQty] = useState<number | ''>(initialData?.qty || '');
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState('');
  const [evidenceDate, setEvidenceDate] = useState(initialData?.date || '');

  const availableSubCriteria = useMemo(() => {
    const profileBasedSlugs = [
      'eth_hard_2', 'eth_point_5', 
      'aca_point_7'
    ];

    const group = criteriaGroups.find(g => {
      const catMap: Record<string, CriterionType> = {
        'Đạo đức tốt': CriterionType.ETHICS,
        'Học tập tốt': CriterionType.ACADEMIC,
        'Thể lực tốt': CriterionType.PHYSICAL,
        'Tình nguyện tốt': CriterionType.VOLUNTEER,
        'Hội nhập tốt': CriterionType.INTEGRATION
      };
      return catMap[g.TenNhom] === criterionType;
    });

    if (!group) return [];

    return group.tieu_chi
      .filter((tc: any) => {
        // Luôn hiển thị nếu là tiêu chí đang được chọn rõ ràng bằng propsSubId
        if (propsSubId && tc.MaTieuChi === propsSubId) return true;
        
        // Nếu không, lọc theo loại cứng/cộng và loại trừ các tiêu chí profile mặc định
        return (tc.LoaiTieuChi === 'Cung') === isHard && !profileBasedSlugs.includes(tc.MaTieuChi);
      })
      .map((tc: any) => ({
        id: tc.MaTieuChi,
        description: tc.MoTa,
        isHard: tc.LoaiTieuChi === 'Cung',
        minQty: tc.SoLuongToiThieu,
        requireDecision: tc.CoSoQuyetDinh
      }));
  }, [criterionType, isHard, criteriaGroups, propsSubId, subCriterionName]);

  // Tắt hẳn logic tìm ID theo tên (subCriterionName) vì dễ sinh lỗi lệch chuỗi
  // Giữ nguyên subCriterionId được truyền từ component cha (propsSubId)
  useEffect(() => {
    if (initialData) return;
    if (propsSubId) {
      setSubCriterionId(propsSubId);
      const sub = availableSubCriteria.find(sc => sc.id === propsSubId);
      if (sub?.requireDecision) {
        setType(EvidenceType.WITH_DECISION);
      }
    } else if (availableSubCriteria.length > 0 && !subCriterionId) {
      const firstSub = availableSubCriteria[0];
      setSubCriterionId(firstSub.id);
      if (firstSub.requireDecision) {
        setType(EvidenceType.WITH_DECISION);
      }
    }
  }, [propsSubId, availableSubCriteria, initialData]);

  const selectedSubCriterion = useMemo(() => availableSubCriteria.find(sc => sc.id === subCriterionId), [availableSubCriteria, subCriterionId]);
  const showQtyInput = selectedSubCriterion?.minQty !== undefined;

  const isSimpleEvidence = (subCriterionId || propsSubId) === 'eth_hard_1' || (subCriterionId || propsSubId) === 'aca_hard_1' || (subCriterionId || propsSubId) === 'int_hard_1' || (subCriterionId || propsSubId) === 'eth_point_1' || (subCriterionId || propsSubId) === 'phy_hard_1' || (subCriterionId || propsSubId) === 'aca_point_2' || (subCriterionId || propsSubId) === 'int_hard_2';
  const showDecisionInput = !isSimpleEvidence && (type !== EvidenceType.NO_DECISION);
  const actualShowQtyInput = (subCriterionId || propsSubId) === 'vol_hard_2';


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!subCriterionId && !propsSubId) { setError('Vui lòng chọn tiêu chí cụ thể.'); return; }
    if (!name.trim()) { setError('Vui lòng nhập tên hoạt động hoặc tên chứng chỉ.'); return; }
    if (showDecisionInput && !decisionNumber.trim()) { setError('Vui lòng nhập số hiệu quyết định hoặc mã số chứng chỉ.'); return; }
    if (actualShowQtyInput && (qty === '' || isNaN(Number(qty)) || Number(qty) <= 0)) { 
      setError('Vui lòng nhập số lượng (số ngày/mức độ) hợp lệ (số nguyên dương).'); 
      return; 
    }
    
    // Require files if new
    if (files.length === 0 && !initialData) {
      setError('Vui lòng đính kèm ít nhất một tập tin minh chứng.');
      return;
    }

    const finalQty = showQtyInput ? Number(qty) : undefined;

    // Tính toán điểm số
    let calculatedPoints = initialData?.points || 0;
    if (!initialData) {
      const sub = SUB_CRITERIA[criterionType].find(s => s.id === (subCriterionId || propsSubId));
      if (sub && sub.points !== undefined) {
        calculatedPoints = sub.points;
      } else {
        calculatedPoints = POINT_MATRIX[level][type];
      }
    }

    const newEvidence: Evidence = {
      id: initialData?.id || Math.random().toString(36).substr(2, 9),
      subCriterionId: subCriterionId || propsSubId || '',
      name: name.trim(),
      level,
      type,
      decisionNumber: showDecisionInput ? decisionNumber.trim() : undefined,
      qty: finalQty,
      fileUrl: files.length > 0 ? URL.createObjectURL(files[0]) : (initialData?.fileUrl || ''),
      files: files,
      fileName: files.length > 0 ? files[0].name : (initialData?.fileName || ''),
      danh_sach_file: initialData?.danh_sach_file,
      date: evidenceDate || new Date().toISOString().split('T')[0],
      points: calculatedPoints,
      isHardCriterion: isHard,
      status: initialData?.status || 'Pending'
    };

    onAdd(newEvidence);
  };

  return (
    <div className="bg-white p-12 animate-scale-in max-h-[90vh] overflow-y-auto w-full max-w-xl font-sans border border-gray-200 rounded-3xl">
      <div className="mb-8 border-b border-gray-100 pb-5">
        <p className="text-[10px] font-black text-blue-900/40 uppercase tracking-[0.2em] mb-2">Cập nhật minh chứng cho:</p>
        <h3 className="text-xl font-bold text-blue-900 uppercase tracking-tight leading-tight">
          {subCriterionName}
        </h3>
      </div>
      
      {error && (
        <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 flex items-center gap-4 animate-fade-in">
          <i className="fas fa-exclamation-triangle text-red-600"></i>
          <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="hidden">
           {/* Giữ nguyên logic chọn nhưng ẩn đi vì đã truyền từ ngoài vào */}
          <select value={subCriterionId} onChange={(e) => setSubCriterionId(e.target.value)}>
            {availableSubCriteria.map(sc => <option key={sc.id} value={sc.id}>{sc.description}</option>)}
          </select>
        </div>
        
        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Tên hoạt động / Chứng chỉ</label>
          <div className="flex gap-2">
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              className="flex-1 px-5 py-4 border border-gray-200 font-bold outline-none focus:border-blue-600 text-xs bg-white text-gray-900 rounded-xl transition-all" 
              placeholder="VD: GCN Hiến máu lần 2..." 
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">
            Ngày cấp / Ngày thực hiện <span className="text-orange-400 normal-case font-normal">(tùy chọn)</span>
          </label>
          <input
            type="date"
            value={evidenceDate}
            onChange={(e) => setEvidenceDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-5 py-4 border border-gray-200 font-bold outline-none focus:border-blue-600 text-xs bg-white text-gray-900 rounded-xl transition-all"
          />
        </div>
        
        {!isSimpleEvidence && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Cấp ban hành</label>
              <select 
                value={level} 
                onChange={(e) => setLevel(e.target.value as EvidenceLevel)} 
                className="w-full px-5 py-4 border border-gray-200 font-bold bg-white text-xs outline-none text-gray-900 rounded-xl transition-all"
              >
                {Object.values(EvidenceLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Hình thức</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value as EvidenceType)} 
                className="w-full px-5 py-4 border border-gray-200 font-bold bg-white text-xs outline-none text-gray-900 rounded-xl transition-all"
              >
                {Object.values(EvidenceType).map(t => (
                  <option 
                    key={t} 
                    value={t}
                  >
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {showDecisionInput && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Số hiệu quyết định / Mã chứng chỉ</label>
            <input 
              type="text" 
              value={decisionNumber} 
              onChange={(e) => setDecisionNumber(e.target.value)} 
              className="w-full px-5 py-4 border border-gray-200 font-bold outline-none focus:border-blue-600 bg-white text-xs text-gray-900 rounded-xl transition-all" 
              placeholder="VD: 123/QĐ-ĐHKT" 
            />
          </div>
        )}

        {actualShowQtyInput && (
          <div className="animate-fade-in">
            <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">
              Số lượng (VD: Số ngày tình nguyện, số lần hiến máu) <span className="text-red-500">*</span>
            </label>
            <input 
              type="number" 
              min="1"
              value={qty} 
              onChange={(e) => setQty(e.target.value ? parseInt(e.target.value, 10) : '')} 
              className="w-full px-5 py-4 border border-gray-200 font-bold outline-none focus:border-blue-600 bg-white text-xs text-gray-900 rounded-xl transition-all" 
              placeholder={`Yêu cầu tối thiểu: ${selectedSubCriterion?.minQty}`} 
            />
          </div>
        )}

        <div>
          <label className="block text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-widest">Đính kèm tập tin (PDF/Ảnh)</label>
          <div className="border border-dashed border-gray-300 p-10 text-center hover:border-blue-900 hover:bg-blue-50/30 transition-all relative bg-gray-50/50 group rounded-2xl">
            <i className="fas fa-cloud-upload-alt text-gray-300 group-hover:text-blue-900 text-2xl mb-4"></i>
            <div className="block">
              {files.length > 0 ? (
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-tight">Đã chọn {files.length} tệp</span>
              ) : (
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Chọn tệp tin từ thiết bị (có thể chọn nhiều)</span>
              )}
            </div>
            <input 
              type="file" 
              multiple
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || []);
                setFiles(prev => [...prev, ...newFiles]);
              }} 
              className="absolute inset-0 opacity-0 cursor-pointer" 
            />
          </div>
          
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              {files.map((f, index) => (
                <div key={index} className="flex justify-between items-center bg-gray-50 p-2 rounded">
                  <span className="text-[10px] text-gray-600 truncate max-w-[80%]">{f.name}</span>
                  <button 
                    type="button" 
                    onClick={() => setFiles(prev => prev.filter((_, i) => i !== index))}
                    className="text-red-500 hover:text-red-700 text-xs px-2"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {initialData?.danh_sach_file && initialData.danh_sach_file.length > 0 && files.length === 0 && (
            <div className="mt-4 p-3 bg-blue-50/50 rounded-lg">
              <p className="text-[9px] font-black text-blue-900 uppercase mb-2 tracking-tighter">Tệp hiện có:</p>
              <div className="space-y-1">
                {initialData.danh_sach_file.map((f, idx) => (
                  <div key={idx} className="text-[10px] flex items-center gap-2">
                    <i className="fas fa-file-alt text-blue-400"></i>
                    <a href={f.FileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline truncate">{f.TenFile}</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end space-x-8 pt-10 border-t border-gray-100">
          <button 
            type="button" 
            onClick={onCancel} 
            className="font-bold text-[10px] uppercase text-gray-400 hover:text-red-500 transition-all tracking-widest"
          >
            Hủy bỏ
          </button>
          <button 
            type="submit" 
            className="px-12 py-5 bg-blue-900 text-white font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-orange-600 transition-all rounded-xl active:scale-95 border border-blue-950"
          >
            Lưu minh chứng
          </button>
        </div>
      </form>
    </div>
  );
};

export default EvidenceForm;
