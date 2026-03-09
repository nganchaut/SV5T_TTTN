
import { CriterionType, SubCriterion } from './types';

export const SUB_CRITERIA: Record<CriterionType, SubCriterion[]> = {
  [CriterionType.ETHICS]: [
    { id: 'eth_hard_1', description: 'Điểm rèn luyện đạt từ 80 điểm trở lên', isHard: true },
    { id: 'eth_hard_2', description: 'Không vi phạm pháp luật và nội quy', isHard: true },
    { id: 'eth_point_1', description: 'Là Đảng viên Cộng sản Việt Nam', isHard: false, points: 0.4 },
    { id: 'eth_point_2', description: 'Đội thi tìm hiểu Mác-Lênin, tư tưởng HCM', isHard: false },
    { id: 'eth_point_3', description: 'Tham luận, bài viết diễn đàn học thuật Mác-Lênin', isHard: false },
    { id: 'eth_point_4', description: 'Thanh niên tiêu biểu, gương người tốt việc tốt', isHard: false },
    { id: 'eth_point_5', description: 'Điểm rèn luyện đạt mức Xuất sắc (>= 90 điểm)', isHard: false, points: 0.1 }
  ],
  [CriterionType.ACADEMIC]: [
    { id: 'aca_hard_1', description: 'Điểm trung bình học tập đạt từ 3.2/4.0 trở lên', isHard: true },
    { id: 'aca_point_1', description: 'Đề tài nghiên cứu khoa học sinh viên', isHard: false },
    { id: 'aca_point_2', description: 'Luận văn, đồ án tốt nghiệp đạt từ 8.0 trở lên', isHard: false },
    { id: 'aca_point_3', description: 'Bài viết đăng trên tạp chí chuyên ngành', isHard: false },
    { id: 'aca_point_4', description: 'Tham luận kỷ yếu hội thảo khoa học', isHard: false },
    { id: 'aca_point_5', description: 'Sản phẩm sáng tạo (Bằng sáng chế/Giấy phép XB)', isHard: false },
    { id: 'aca_point_6', description: 'Đạt giải thưởng NCKH, khởi nghiệp, sáng tạo', isHard: false },
    { id: 'aca_point_7', description: 'Điểm trung bình học tập xuất sắc (>= 3.4/4.0)', isHard: false, points: 0.1 }
  ],
  [CriterionType.PHYSICAL]: [
    { id: 'phy_hard_1', description: 'Điểm trung bình môn thể dục đạt từ 7.0/10.0', isHard: true },
    { id: 'phy_hard_2', description: 'Danh hiệu "Sinh viên khỏe" cấp Trường trở lên', isHard: true },
    { id: 'phy_point_1', description: 'Đạt GCN hoạt động thể thao', isHard: false },
    { id: 'phy_point_2', description: 'Đội tuyển/Cá nhân thi đấu Hội thao các cấp', isHard: false }
  ],
  [CriterionType.VOLUNTEER]: [
    { id: 'vol_hard_1', description: 'Chiến dịch Mùa hè xanh/Tiếp sức mùa thi/Đông-Xuân', isHard: true },
    { id: 'vol_hard_2', description: 'Tham gia ít nhất 03 ngày tình nguyện/năm', isHard: true, minQty: 3 },
    { id: 'vol_hard_3', description: 'Giấy khen cấp Trường trở lên về tình nguyện', isHard: true },
    { id: 'vol_hard_4', description: 'GCN Hiến máu nhân đạo (2 lần tại DUE hoặc 3 lần ngoài)', isHard: true, minQty: 2 },
    { id: 'vol_point_2', description: 'Tham gia hoạt động tình nguyện tiêu biểu khác', isHard: false }
  ],
  [CriterionType.INTEGRATION]: [
    { id: 'int_hard_1', description: 'Chứng chỉ ngoại ngữ trình độ B1 hoặc tương đương', isHard: true },
    { id: 'int_hard_2', description: 'GPA ngoại ngữ tích lũy đạt từ 3.0/4.0 trở lên', isHard: true },
    { id: 'int_hard_3', description: 'GCN hoạt động giao lưu quốc tế cấp Trường trở lên', isHard: true },
    { id: 'int_hard_4', description: 'Giải thưởng cuộc thi ngoại ngữ', isHard: true },
    { id: 'int_hard_5', description: 'Hoàn thành khóa kỹ năng thực hành xã hội', isHard: true },
    { id: 'int_point_1', description: 'Tham gia tích cực hoạt động hội nhập', isHard: false }
  ]
};

export const FACES_OF_THE_YEAR = [
  { name: 'Nguyễn Văn A', achievement: 'Giải Nhất NCKH Cấp Quốc gia', image: 'https://picsum.photos/seed/a/400/400' },
  { name: 'Trần Thị B', achievement: 'Đại sứ Tình nguyện 2024', image: 'https://picsum.photos/seed/b/400/400' },
  { name: 'Lê Văn C', achievement: 'Gương mặt trẻ tiêu biểu ĐHĐN', image: 'https://picsum.photos/seed/c/400/400' },
];
