from django.core.management.base import BaseCommand
from criteria.models import NhomTieuChi, TieuChi, DiemTheoCapDo


CAP_DO_ALL = [
    'Cấp Khoa/CLB',
    'Cấp Trường/Phường/Xã',
    'Cấp ĐHĐN',
    'Cấp Tỉnh/Thành phố',
    'Cấp Trung ương',
]

DATA = [
    {
        'TenNhom': 'Đạo đức tốt',
        'MoTa': 'Tiêu chí đánh giá về đạo đức, tư tưởng, lối sống của sinh viên',
        'ThuTu': 1,
        'tieu_chi': [
            {
                'MaTieuChi': 'eth_hard_1',
                'MoTa': 'Điểm rèn luyện trung bình trong năm học đạt từ 80 điểm trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'eth_hard_2',
                'MoTa': 'Không vi phạm pháp luật và các quy chế, nội quy của nhà trường, địa phương',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'eth_point_1',
                'MoTa': 'Là Đảng viên Đảng Cộng sản Việt Nam',
                'LoaiTieuChi': 'Cong', 'Diem': 0.4,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'eth_point_2',
                'MoTa': 'Thành viên chính thức đội thi tìm hiểu Mác-Lênin, tư tưởng Hồ Chí Minh từ cấp Liên chi trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 4,
                'diem_cap_do': [('Cấp Khoa/CLB', 0.1), ('Cấp Trường/Phường/Xã', 0.2), ('Cấp ĐHĐN', 0.3), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'eth_point_3',
                'MoTa': 'Tham luận, bài viết trình bày tại các diễn đàn học thuật về các môn khoa học Mác-Lênin, tư tưởng HCM',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 5,
                'diem_cap_do': [('Cấp Trường/Phường/Xã', 0.2), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'eth_point_4',
                'MoTa': 'Là thanh niên tiêu biểu, gương người tốt việc tốt, có hành động dũng cảm cứu người',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 6,
                'diem_cap_do': [('Cấp Trường/Phường/Xã', 0.2), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'eth_point_5',
                'MoTa': 'Điểm rèn luyện đạt từ 90 điểm trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': 0.1,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 7,
                'diem_cap_do': []
            },
        ]
    },
    {
        'TenNhom': 'Học tập tốt',
        'MoTa': 'Tiêu chí đánh giá về kết quả học tập, rèn luyện kiến thức chuyên môn',
        'ThuTu': 2,
        'tieu_chi': [
            {
                'MaTieuChi': 'aca_hard_1',
                'MoTa': 'Điểm trung bình học tập trong năm học đạt từ 3.2/4.0 trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'aca_point_1',
                'MoTa': 'Có tham gia đề tài nghiên cứu khoa học sinh viên từ cấp Khoa trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': [('Cấp Khoa/CLB', 0.1), ('Cấp Trường/Phường/Xã', 0.2), ('Cấp ĐHĐN', 0.3), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'aca_point_2',
                'MoTa': 'Có luận văn, đồ án tốt nghiệp đạt điểm đánh giá từ 8.0 trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': 0.1,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'aca_point_3',
                'MoTa': 'Có bài viết đăng trên tạp chí chuyên ngành',
                'LoaiTieuChi': 'Cong', 'Diem': 0.4,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 4,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'aca_point_4',
                'MoTa': 'Có bài tham luận in trong kỷ yếu hội thảo khoa học chuyên ngành từ cấp khoa trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 5,
                'diem_cap_do': [('Cấp Khoa/CLB', 0.1), ('Cấp Trường/Phường/Xã', 0.2), ('Cấp ĐHĐN', 0.3), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'aca_point_5',
                'MoTa': 'Có sản phẩm sáng tạo được cấp bằng sáng chế, giấy phép xuất bản hoặc giải thưởng cấp Trường trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': 0.4,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 6,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'aca_point_6',
                'MoTa': 'Đạt giải thưởng trong các cuộc thi nghiên cứu khoa học, khởi nghiệp, ý tưởng sáng tạo từ cấp Trường trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 7,
                'diem_cap_do': [('Cấp Trường/Phường/Xã', 0.2), ('Cấp ĐHĐN', 0.3), ('Cấp Tỉnh/Thành phố', 0.4)]
            },
            {
                'MaTieuChi': 'aca_point_7',
                'MoTa': 'Điểm trung bình học tập trong năm học đạt từ 3.4/4.0 trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': 0.1,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 8,
                'diem_cap_do': []
            },
        ]
    },
    {
        'TenNhom': 'Thể lực tốt',
        'MoTa': 'Tiêu chí đánh giá về sức khỏe, thể dục thể thao (Đạt ít nhất 1 yêu cầu)',
        'ThuTu': 3,
        'tieu_chi': [
            {
                'MaTieuChi': 'phy_hard_1',
                'MoTa': 'Điểm trung bình môn thể dục đạt từ loại Khá trở lên (7.0/10.0)',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'phy_hard_2',
                'MoTa': 'Đạt danh hiệu "Sinh viên khỏe", "Thanh niên khỏe" cấp Trường trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'phy_hard_3',
                'MoTa': 'Tham gia và đạt GCN tại các hoạt động, phong trào thể thao từ cấp Liên chi Hội trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'phy_hard_4',
                'MoTa': 'Là thành viên đội tuyển thi đấu nội dung thể thao cấp ĐHĐN trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 4,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'phy_hard_5',
                'MoTa': 'Tham gia và đạt giải tại các hoạt động thể thao phong trào từ cấp Trường trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 5,
                'diem_cap_do': []
            },
        ]
    },
    {
        'TenNhom': 'Tình nguyện tốt',
        'MoTa': 'Tiêu chí đánh giá về hoạt động tình nguyện, phục vụ cộng đồng',
        'ThuTu': 4,
        'tieu_chi': [
            {
                'MaTieuChi': 'vol_hard_1',
                'MoTa': 'Tham gia và đạt GCN 01 trong các chiến dịch: Mùa hè xanh, Tiếp sức mùa thi, Đông - Xuân',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'vol_hard_2',
                'MoTa': 'Tham gia ít nhất 03 ngày tình nguyện/năm (Cần ít nhất 03 GCN cộng dồn)',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': 3, 'ThuTu': 2,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'vol_hard_3',
                'MoTa': 'Đạt Giấy khen cấp Trường trở lên về hoạt động tình nguyện',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'vol_hard_4',
                'MoTa': 'Đạt ít nhất 2 GCN Hiến máu tại DUE (hoặc 3 GCN tại đơn vị ngoài trường)',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': 2, 'ThuTu': 4,
                'diem_cap_do': []
            },
        ]
    },
    {
        'TenNhom': 'Hội nhập tốt',
        'MoTa': 'Tiêu chí đánh giá về kỹ năng hội nhập, ngoại ngữ (Đạt ít nhất 1 yêu cầu)',
        'ThuTu': 5,
        'tieu_chi': [
            {
                'MaTieuChi': 'int_hard_1',
                'MoTa': 'Chứng chỉ Tiếng Anh trình độ B1 hoặc tương đương trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'int_hard_2',
                'MoTa': 'Điểm các học phần ngoại ngữ đạt từ 3.0/4.0 trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'int_hard_3',
                'MoTa': 'Tham gia và đạt ít nhất 01 GCN hoạt động giao lưu quốc tế từ cấp Trường trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'int_hard_4',
                'MoTa': 'Tham gia và đạt giải tại các cuộc thi có sử dụng ngoại ngữ từ cấp Liên chi Hội trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 4,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'int_hard_5',
                'MoTa': 'Hoàn thành ít nhất 01 khóa trang bị kỹ năng thực hành xã hội',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 5,
                'diem_cap_do': []
            },
            {
                'MaTieuChi': 'int_hard_6',
                'MoTa': 'Tham gia tích cực ít nhất 01 hoạt động về hội nhập do cấp Khoa trở lên tổ chức',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 6,
                'diem_cap_do': []
            },
        ]
    },
]


class Command(BaseCommand):
    help = 'Seed dữ liệu 5 nhóm tiêu chí SV5T và các tiêu chí con'

    def handle(self, *args, **options):
        created_groups = 0
        created_criteria = 0
        created_scores = 0

        # Chuẩn bị danh sách MaTieuChi hợp lệ để xóa các tiêu chí cũ/trùng
        valid_ma_tieu_chi = []
        for group_data in DATA:
            for tc in group_data['tieu_chi']:
                valid_ma_tieu_chi.append(tc['MaTieuChi'])

        # Xóa các tiêu chí cũ không có MaTieuChi hoặc MaTieuChi không nằm trong danh sách chuẩn
        # Chỉ xóa trong các nhóm mà chúng ta đang seed
        group_names = [g['TenNhom'] for g in DATA]
        deleted_count, _ = TieuChi.objects.filter(
            NhomTieuChi__TenNhom__in=group_names
        ).exclude(
            MaTieuChi__in=valid_ma_tieu_chi
        ).delete()
        
        if deleted_count > 0:
            self.stdout.write(self.style.WARNING(f'  ! Đã xóa {deleted_count} tiêu chí cũ/trùng lặp'))

        for group_data in DATA:
            tieu_chi_data = group_data.pop('tieu_chi')
            nhom, created = NhomTieuChi.objects.get_or_create(
                TenNhom=group_data['TenNhom'],
                defaults=group_data
            )
            if created:
                created_groups += 1
                self.stdout.write(f'  ✓ Nhóm: {nhom.TenNhom}')

            for tc_data in tieu_chi_data:
                diem_cap_do_data = tc_data.pop('diem_cap_do', [])
                tc, tc_created = TieuChi.objects.update_or_create(
                    MaTieuChi=tc_data.get('MaTieuChi'),
                    defaults={
                        'NhomTieuChi': nhom,
                        'MoTa': tc_data['MoTa'],
                        'LoaiTieuChi': tc_data.get('LoaiTieuChi', 'Cong'),
                        'Diem': tc_data.get('Diem'),
                        'CoSoQuyetDinh': tc_data.get('CoSoQuyetDinh', False),
                        'SoLuongToiThieu': tc_data.get('SoLuongToiThieu'),
                        'ThuTu': tc_data.get('ThuTu', 0),
                    }
                )
                if tc_created:
                    created_criteria += 1

                for cap_do, diem in diem_cap_do_data:
                    _, score_created = DiemTheoCapDo.objects.get_or_create(
                        TieuChi=tc, CapDo=cap_do,
                        defaults={'Diem': diem}
                    )
                    if score_created:
                        created_scores += 1

        self.stdout.write(self.style.SUCCESS(
            f'\n✅ Seed hoàn tất: '
            f'{created_groups} nhóm, {created_criteria} tiêu chí, {created_scores} mức điểm.'
        ))
