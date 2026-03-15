
import { CriterionType, SubCriterion, EvidenceLevel, EvidenceType } from './types';

export const POINT_MATRIX: Record<EvidenceLevel, Record<EvidenceType, number>> = {
  [EvidenceLevel.KHOA]: { [EvidenceType.NO_DECISION]: 0.1, [EvidenceType.WITH_DECISION]: 0.1, [EvidenceType.GK]: 0.1 },
  [EvidenceLevel.TRUONG]: { [EvidenceType.NO_DECISION]: 0.2, [EvidenceType.WITH_DECISION]: 0.3, [EvidenceType.GK]: 0.4 },
  [EvidenceLevel.DHDN]: { [EvidenceType.NO_DECISION]: 0.3, [EvidenceType.WITH_DECISION]: 0.4, [EvidenceType.GK]: 0.5 },
  [EvidenceLevel.TINH_TP]: { [EvidenceType.NO_DECISION]: 0.4, [EvidenceType.WITH_DECISION]: 0.5, [EvidenceType.GK]: 0.6 },
  [EvidenceLevel.TW]: { [EvidenceType.NO_DECISION]: 0.5, [EvidenceType.WITH_DECISION]: 0.6, [EvidenceType.GK]: 0.7 },
};

export const SUB_CRITERIA: Record<CriterionType, SubCriterion[]> = {
  [CriterionType.ETHICS]: [
    { id: 'eth_hard_1', description: 'Điểm rèn luyện trung bình trong năm học đạt từ 80 điểm trở lên', isHard: true },
    { id: 'eth_hard_2', description: 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, địa phương', isHard: true },
    { id: 'eth_point_1', description: 'Là Đảng viên Cộng sản Việt Nam', isHard: false, points: 0.4 },
    { id: 'eth_point_2', description: 'Đội thi tìm hiểu Mác-Lênin, tư tưởng HCM từ cấp Liên chi trở lên', isHard: false },
    { id: 'eth_point_3', description: 'Tham luận, bài viết diễn đàn học thuật Mác-Lênin', isHard: false },
    { id: 'eth_point_4', description: 'Thanh niên tiêu biểu, gương người tốt việc tốt, dũng cảm cứu người', isHard: false },
    { id: 'eth_point_5', description: 'Điểm rèn luyện đạt mức Xuất sắc (>= 90 điểm)', isHard: false, points: 0.1 }
  ],
  [CriterionType.ACADEMIC]: [
    { id: 'aca_hard_1', description: 'Điểm trung bình học tập trong năm học đạt từ 3.2/4.0 trở lên', isHard: true },
    { id: 'aca_point_1', description: 'Có tham gia đề tài nghiên cứu khoa học sinh viên từ cấp Khoa trở lên', isHard: false },
    { id: 'aca_point_2', description: 'Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8.0 trở lên', isHard: false, points: 0.1 },
    { id: 'aca_point_3', description: 'Có bài viết đăng trên tạp chí chuyên ngành', isHard: false, points: 0.4 },
    { id: 'aca_point_4', description: 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên', isHard: false },
    { id: 'aca_point_5', description: 'Sản phẩm sáng tạo được cấp bằng sáng chế, giấy phép xuất bản hoặc giải thưởng cấp Trường trở lên', isHard: false, points: 0.4 },
    { id: 'aca_point_6', description: 'Đạt giải thưởng cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp Trường trở lên', isHard: false },
    { id: 'aca_point_7', description: 'Điểm trung bình học tập trong năm học đạt từ 3.4/4.0 trở lên', isHard: false, points: 0.1 }
  ],
  [CriterionType.PHYSICAL]: [
    { id: 'phy_hard_1', description: 'Điểm trung bình môn thể dục đạt từ loại Khá trở lên (7.0/10.0)', isHard: true },
    { id: 'phy_hard_2', description: 'Đạt danh hiệu "Sinh viên khỏe", "Thanh niên khỏe" cấp Trường trở lên', isHard: true },
    { id: 'phy_hard_3', description: 'Tham gia và đạt GCN tại các hoạt động, phong trào thể thao từ cấp Liên chi Hội trở lên', isHard: true },
    { id: 'phy_hard_4', description: 'Là thành viên đội tuyển thi đấu nội dung thể thao cấp ĐHĐN trở lên', isHard: true },
    { id: 'phy_hard_5', description: 'Tham gia và đạt giải tại các hoạt động thể thao phong trào từ cấp Trường trở lên', isHard: true }
  ],
  [CriterionType.VOLUNTEER]: [
    { id: 'vol_hard_1', description: 'Tham gia và đạt GCN 01 trong các chiến dịch: Mùa hè xanh, Tiếp sức mùa thi, Đông - Xuân', isHard: true },
    { id: 'vol_hard_2', description: 'Tham gia ít nhất 03 ngày tình nguyện/năm (Cần ít nhất 03 GCN cộng dồn)', isHard: true, minQty: 3 },
    { id: 'vol_hard_3', description: 'Đạt Giấy khen cấp Trường trở lên về hoạt động tình nguyện', isHard: true },
    { id: 'vol_hard_4', description: 'Đạt ít nhất 2 GCN Hiến máu tại DUE (hoặc 3 GCN tại đơn vị ngoài trường)', isHard: true, minQty: 2 },
  ],
  [CriterionType.INTEGRATION]: [
    { id: 'int_hard_1', description: 'Chứng chỉ Tiếng Anh trình độ B1 hoặc tương đương trở lên', isHard: true },
    { id: 'int_hard_2', description: 'Điểm các học phần ngoại ngữ tích lũy đạt từ 3.0/4.0 trở lên', isHard: true },
    { id: 'int_hard_3', description: 'Tham gia và đạt ít nhất 01 GCN hoạt động giao lưu quốc tế từ cấp Trường trở lên', isHard: true },
    { id: 'int_hard_4', description: 'Tham gia và đạt giải tại các cuộc thi có sử dụng ngoại ngữ từ cấp Liên chi Hội trở lên', isHard: true },
    { id: 'int_hard_5', description: 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội', isHard: true },
    { id: 'int_hard_6', description: 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp Khoa trở lên tổ chức', isHard: true }
  ]
};

export const FACES_OF_THE_YEAR: any[] = [];

