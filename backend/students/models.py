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
        
        # Lấy điểm từ minh chứng (Duyệt hoặc đang chờ - để khớp 'dự kiến' của SV)
        # Nếu hồ sơ đã Approved/Rejected thì chỉ tính Approved
        allowed_statuses = ['Approved']
        if self.TrangThaiHoSo in ['Draft', 'Submitted', 'Processing']:
            allowed_statuses.append('Pending')
            allowed_statuses.append('NeedsExplanation')

        total = MinhChung.objects.filter(
            SinhVien=self, TrangThai__in=allowed_statuses
        ).aggregate(total=models.Sum('Diem'))['total'] or 0
        
        # Cộng điểm thưởng
        if self.LaDangVien:
            total += 0.4
        if self.DiemTBC >= 3.4:
            total += 0.1
        if self.DiemRenLuyen >= 90:
            total += 0.1
            
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
