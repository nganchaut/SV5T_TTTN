
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from criteria.models import NhomTieuChi, TieuChi

SUB_CRITERIA_MAP = {
    'Đạo đức tốt': [
        {'id': 'eth_hard_1', 'description': 'Điểm rèn luyện đạt từ 80 điểm trở lên', 'isHard': True},
        {'id': 'eth_hard_2', 'description': 'Không vi phạm pháp luật và nội quy', 'isHard': True},
        {'id': 'eth_point_1', 'description': 'Là Đảng viên Cộng sản Việt Nam', 'isHard': False},
        {'id': 'eth_point_2', 'description': 'Đội thi tìm hiểu Mác-Lênin, tư tưởng HCM', 'isHard': False},
        {'id': 'eth_point_3', 'description': 'Tham luận, bài viết diễn đàn học thuật Mác-Lênin', 'isHard': False},
        {'id': 'eth_point_4', 'description': 'Thanh niên tiêu biểu, gương người tốt việc tốt', 'isHard': False},
        {'id': 'eth_point_5', 'description': 'Điểm rèn luyện đạt mức Xuất sắc (>= 90 điểm)', 'isHard': False},
    ],
    'Học tập tốt': [
        {'id': 'aca_hard_1', 'description': 'Điểm trung bình học tập đạt từ 3.2/4.0 trở lên', 'isHard': True},
        {'id': 'aca_point_1', 'description': 'Đề tài nghiên cứu khoa học sinh viên', 'isHard': False},
        {'id': 'aca_point_2', 'description': 'Luận văn, đồ án tốt nghiệp đạt từ 8.0 trở lên', 'isHard': False},
        {'id': 'aca_point_3', 'description': 'Bài viết đăng trên tạp chí chuyên ngành', 'isHard': False},
        {'id': 'aca_point_4', 'description': 'Tham luận kỷ yếu hội thảo khoa học', 'isHard': False},
        {'id': 'aca_point_5', 'description': 'Sản phẩm sáng tạo (Bằng sáng chế/Giấy phép XB)', 'isHard': False},
        {'id': 'aca_point_6', 'description': 'Đạt giải thưởng NCKH, khởi nghiệp, sáng tạo', 'isHard': False},
        {'id': 'aca_point_7', 'description': 'Điểm trung bình học tập xuất sắc (>= 3.4/4.0)', 'isHard': False},
    ],
    'Thể lực tốt': [
        {'id': 'phy_hard_1', 'description': 'Điểm trung bình môn thể dục đạt từ 7.0/10.0', 'isHard': True},
        {'id': 'phy_hard_2', 'description': 'Danh hiệu "Sinh viên khỏe" cấp Trường trở lên', 'isHard': True},
        {'id': 'phy_point_1', 'description': 'Đạt GCN hoạt động thể thao', 'isHard': False},
        {'id': 'phy_point_2', 'description': 'Đội tuyển/Cá nhân thi đấu Hội thao các cấp', 'isHard': False},
    ],
    'Tình nguyện tốt': [
        {'id': 'vol_hard_1', 'description': 'Tham gia và đạt GCN 01 trong các chiến dịch: Mùa hè xanh, Tiếp sức mùa thi, Đông - Xuân', 'isHard': True},
        {'id': 'vol_hard_2', 'description': 'Tham gia ít nhất 03 ngày tình nguyện/năm (Cần ít nhất 03 GCN cộng dồn)', 'isHard': True},
        {'id': 'vol_hard_3', 'description': 'Đạt Giấy khen cấp Trường trở lên về hoạt động tình nguyện', 'isHard': True},
        {'id': 'vol_hard_4', 'description': 'Đạt ít nhất 2 GCN Hiến máu tại DUE (hoặc 3 GCN tại đơn vị ngoài trường)', 'isHard': True},
        {'id': 'vol_point_1', 'description': 'Được khen thưởng từ cấp Khoa trở lên về hoạt động tình nguyện (GKhen)', 'isHard': False},
        {'id': 'vol_point_2', 'description': 'Tham gia ít nhất 05 ngày tình nguyện/năm (Cần GCN khác với tiêu chí cứng)', 'isHard': False},
        {'id': 'vol_point_3', 'description': 'Được khen thưởng từ cấp Tỉnh hoặc UBND cấp Huyện trở lên (GKhen)', 'isHard': False},
        {'id': 'vol_point_5', 'description': 'Tham gia hoạt động tình nguyện tiêu biểu khác', 'isHard': False},
    ],
    'Hội nhập tốt': [
        {'id': 'int_hard_1', 'description': 'Chứng chỉ ngoại ngữ trình độ B1 hoặc tương đương', 'isHard': True},
        {'id': 'int_hard_2', 'description': 'GPA ngoại ngữ tích lũy đạt từ 3.0/4.0 trở lên', 'isHard': True},
        {'id': 'int_hard_3', 'description': 'GCN hoạt động giao lưu quốc tế cấp Trường trở lên', 'isHard': True},
        {'id': 'int_hard_4', 'description': 'Giải thưởng cuộc thi ngoại ngữ', 'isHard': True},
        {'id': 'int_hard_5', 'description': 'Hoàn thành khóa kỹ năng thực hành xã hội', 'isHard': True},
        {'id': 'int_point_1', 'description': 'Tham gia tích cực hoạt động hội nhập', 'isHard': False},
    ]
}

def seed_criteria():
    for group_name, criteria in SUB_CRITERIA_MAP.items():
        nhom, created = NhomTieuChi.objects.get_or_create(TenNhom=group_name)
        if created:
            print(f"Created group: {group_name}")
        
        for idx, item in enumerate(criteria):
            tc, created = TieuChi.objects.update_or_create(
                MaTieuChi=item['id'],
                defaults={
                    'NhomTieuChi': nhom,
                    'MoTa': item['description'],
                    'LoaiTieuChi': 'Cung' if item['isHard'] else 'Cong',
                    'ThuTu': idx
                }
            )
            if created:
                print(f"Created criteria: {item['id']}")
            else:
                print(f"Updated criteria: {item['id']}")

if __name__ == '__main__':
    seed_criteria()
    print("Seeding complete.")
