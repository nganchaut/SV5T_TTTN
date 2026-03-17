from django.db import models
from accounts.models import TaiKhoan


class SinhVien(models.Model):
    TRINH_DO_CHOICES = [
        ('None', 'Chưa có'),
        ('B1', 'B1'),
        ('B2', 'B2'),
        ('IELTS', 'IELTS'),
        ('TOEIC', 'TOEIC'),
        ('Other', 'Khác'),
    ]
    TRANG_THAI_CHOICES = [
        ('Draft', 'Chưa nộp'),
        ('Submitted', 'Đã nộp'),
        ('Processing', 'Đang xét'),
        ('Approved', 'Đã duyệt'),
        ('Rejected', 'Từ chối'),
    ]

    TaiKhoan = models.OneToOneField(
        TaiKhoan, on_delete=models.CASCADE, related_name='sinh_vien'
    )
    HoTen = models.CharField(max_length=100)
    MaSV = models.CharField(max_length=20, unique=True)
    Lop = models.CharField(max_length=50)
    Khoa = models.CharField(max_length=100)
    DiemTBC = models.FloatField(default=0)
    DiemRenLuyen = models.IntegerField(default=0)
    DiemTheDuc = models.FloatField(default=0)
    TrinhDoNgoaiNgu = models.CharField(max_length=20, choices=TRINH_DO_CHOICES, default='None')
    GPANgoaiNgu = models.FloatField(default=0)
    LaDangVien = models.BooleanField(default=False)
    KhongViPham = models.BooleanField(default=True)
    TrangThaiHoSo = models.CharField(max_length=20, choices=TRANG_THAI_CHOICES, default='Draft')
    TongDiem = models.FloatField(default=0)
    PhanHoiChung = models.CharField(max_length=500, blank=True, null=True)
    NgayTao = models.DateTimeField(auto_now_add=True)
    NgayCapNhat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'SinhVien'
        verbose_name = 'Sinh viên'

    def __str__(self):
        return f"{self.MaSV} - {self.HoTen}"

    def tinh_tong_diem(self):
        """Tính lại TongDiem từ các MinhChung (Approved + Pending cho hồ sơ chưa chốt) + Điểm thưởng"""
        from evidences.models import MinhChung
        from criteria.models import TieuChi, DiemTheoCapDo
        
        # Trạng thái minh chứng được tính điểm
        allowed_statuses = ['Approved']
        if self.TrangThaiHoSo in ['Draft', 'Submitted', 'Processing']:
            allowed_statuses.append('Pending')
            allowed_statuses.append('NeedsExplanation')

        qs = MinhChung.objects.filter(
            SinhVien=self, TrangThai__in=allowed_statuses
        )
        
        total = 0
        for mc in qs:
            # Lấy điểm từ DB thay vì hardcode trong code
            try:
                score_obj = DiemTheoCapDo.objects.get(TieuChi=mc.TieuChi, CapDo=mc.CapDo)
                mc_diem = score_obj.Diem
            except DiemTheoCapDo.DoesNotExist:
                mc_diem = mc.Diem or mc.TieuChi.Diem or 0
            
            total += mc_diem
        
        # Cộng điểm thưởng dựa trên tiêu chí mềm đặc thù
        # VD: Đảng viên, GPA cao, Điểm rèn luyện cao
        # Tìm các tiêu chí có MaTieuChi tương ứng để lấy điểm động từ DB
        bonus_config = {
            'dang_vien': {'MaTieuChi': 'eth_point_1', 'active': self.LaDangVien},
            'gpa_cao': {'MaTieuChi': 'aca_point_7', 'active': self.DiemTBC >= 3.4},
            'drl_cao': {'MaTieuChi': 'eth_point_5', 'active': self.DiemRenLuyen >= 90},
        }
        
        for key, cfg in bonus_config.items():
            if cfg['active']:
                try:
                    tc_bonus = TieuChi.objects.get(MaTieuChi=cfg['MaTieuChi'])
                    total += tc_bonus.Diem or 0
                except TieuChi.DoesNotExist:
                    # Fallback values if seeds are missing
                    fallback = {'dang_vien': 0.4, 'gpa_cao': 0.1, 'drl_cao': 0.1}
                    total += fallback[key]
            
        self.TongDiem = round(total, 1)
        self.save(update_fields=['TongDiem'])
        return self.TongDiem


class XacMinh(models.Model):
    """Admin xác minh từng trường dữ liệu của sinh viên"""
    TRUONG_CHOICES = [
        ('gpa', 'Điểm trung bình (GPA)'),
        ('trainingPoints', 'Điểm rèn luyện'),
        ('peScore', 'Điểm thể dục'),
        ('english', 'Trình độ ngoại ngữ'),
        ('partyMember', 'Đảng viên'),
    ]
    TRANG_THAI_CHOICES = [
        ('Pending', 'Chờ xác minh'),
        ('Approved', 'Đã xác minh'),
        ('Rejected', 'Từ chối'),
        ('NeedsExplanation', 'Cần giải trình'),
    ]

    SinhVien = models.ForeignKey(
        SinhVien, on_delete=models.CASCADE, related_name='xac_minh'
    )
    TruongDuLieu = models.CharField(max_length=50, choices=TRUONG_CHOICES)
    TrangThai = models.CharField(max_length=30, choices=TRANG_THAI_CHOICES, default='Pending')
    PhanHoiAdmin = models.CharField(max_length=500, blank=True, null=True)
    GiaiTrinhSV = models.CharField(max_length=1000, blank=True, null=True)
    NgayCapNhat = models.DateTimeField(auto_now=True)
    DuongDanFile = models.FileField(upload_to='xac_minh/', blank=True, null=True)
    TenFile = models.CharField(max_length=255, blank=True, null=True)

    class Meta:
        db_table = 'XacMinh'
        verbose_name = 'Xác minh'
        unique_together = ('SinhVien', 'TruongDuLieu')

    def __str__(self):
        return f"XacMinh({self.SinhVien.MaSV}, {self.TruongDuLieu}) - {self.TrangThai}"


class LichSuHoSo(models.Model):
    """Lưu vết thay đổi trạng thái hồ sơ (Audit Trail)"""
    SinhVien = models.ForeignKey(SinhVien, on_delete=models.CASCADE, related_name='lich_su')
    TrangThaiTruoc = models.CharField(max_length=20)
    TrangThaiSau = models.CharField(max_length=20)
    NguoiThucHien = models.ForeignKey(TaiKhoan, on_delete=models.SET_NULL, null=True)
    NoiDung = models.CharField(max_length=500, blank=True)
    NgayTao = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'LichSuHoSo'
        verbose_name = 'Lịch sử hồ sơ'
        ordering = ['-NgayTao']

    def __str__(self):
        return f"{self.SinhVien.MaSV}: {self.TrangThaiTruoc} -> {self.TrangThaiSau}"
