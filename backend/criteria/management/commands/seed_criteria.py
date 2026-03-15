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
                'MoTa': 'Điểm rèn luyện đạt từ 80 điểm trở lên (loại Tốt)',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Không vi phạm pháp luật, nội quy nhà trường trong năm học',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Là Đảng viên Đảng Cộng sản Việt Nam',
                'LoaiTieuChi': 'Cong', 'Diem': 0.4,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Tham gia các hoạt động chính trị, xã hội trong và ngoài trường',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 4,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
            },
        ]
    },
    {
        'TenNhom': 'Học tập tốt',
        'MoTa': 'Tiêu chí đánh giá về kết quả học tập, rèn luyện kiến thức chuyên môn',
        'ThuTu': 2,
        'tieu_chi': [
            {
                'MoTa': 'Điểm trung bình tích lũy (GPA) đạt từ 2.5/4.0 trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Đạt giải thưởng trong các cuộc thi học thuật, nghiên cứu khoa học',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
            },
            {
                'MoTa': 'Được công nhận đề tài nghiên cứu khoa học cấp Khoa trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
            },
        ]
    },
    {
        'TenNhom': 'Thể lực tốt',
        'MoTa': 'Tiêu chí đánh giá về sức khỏe, thể dục thể thao',
        'ThuTu': 3,
        'tieu_chi': [
            {
                'MoTa': 'Điểm trung bình môn Thể dục đạt từ 5.0/10 trở lên',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Đạt giải trong các cuộc thi thể dục thể thao',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
            },
            {
                'MoTa': 'Tham gia hiến máu tình nguyện',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': 1, 'ThuTu': 3,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                ]
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
        'MoTa': 'Tiêu chí đánh giá về kỹ năng hội nhập, ngoại ngữ, hội đoàn',
        'ThuTu': 5,
        'tieu_chi': [
            {
                'MoTa': 'Có chứng chỉ ngoại ngữ từ B1 trở lên hoặc GPA ngoại ngữ ≥ 2.0/4.0',
                'LoaiTieuChi': 'Cung', 'Diem': None,
                'CoSoQuyetDinh': False, 'SoLuongToiThieu': None, 'ThuTu': 1,
                'diem_cap_do': []
            },
            {
                'MoTa': 'Đạt giải thưởng trong các cuộc thi về kỹ năng, ngoại ngữ, hội nhập',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 2,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
            },
            {
                'MoTa': 'Tham gia Ban chấp hành Đoàn/Hội cấp Khoa trở lên',
                'LoaiTieuChi': 'Cong', 'Diem': None,
                'CoSoQuyetDinh': True, 'SoLuongToiThieu': None, 'ThuTu': 3,
                'diem_cap_do': [
                    ('Cấp Khoa/CLB', 0.1),
                    ('Cấp Trường/Phường/Xã', 0.2),
                    ('Cấp ĐHĐN', 0.3),
                    ('Cấp Tỉnh/Thành phố', 0.4),
                    ('Cấp Trung ương', 0.5),
                ]
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
                diem_cap_do_data = tc_data.pop('diem_cap_do')
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
