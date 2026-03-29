from django.db import models


class BaiViet(models.Model):
    TRANG_THAI_CHOICES = [
        ('draft', 'Nháp'),
        ('published', 'Đã đăng'),
    ]

    TieuDe = models.CharField(max_length=300)
    NoiDung = models.TextField()
    HinhAnh = models.ImageField(upload_to='bai_viet/', blank=True, null=True)
    NgayDang = models.DateField(auto_now_add=True)
    TrangThai = models.CharField(max_length=20, choices=TRANG_THAI_CHOICES, default='draft')
    NgayTao = models.DateTimeField(auto_now_add=True)
    NgayCapNhat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'BaiViet'
        verbose_name = 'Bài viết'
        ordering = ['-NgayDang']

    def __str__(self):
        return self.TieuDe


class VinhDanh(models.Model):
    TenSinhVien = models.CharField(max_length=100)
    ThanhTich = models.CharField(max_length=200)
    NoiDung = models.TextField(blank=True, null=True)
    HinhAnh = models.ImageField(upload_to='vinh_danh/', blank=True, null=True)
    NgayTao = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'VinhDanh'
        verbose_name = 'Vinh danh'
        ordering = ['-NgayTao']

    def __str__(self):
        return f"{self.TenSinhVien} - {self.ThanhTich}"

class CauHinhHeThong(models.Model):
    ThoiGianBatDau = models.DateTimeField(null=True, blank=True, verbose_name="Thời gian bắt đầu nộp")
    ThoiGianKetThuc = models.DateTimeField(null=True, blank=True, verbose_name="Thời gian kết thúc nộp")
    TrangThaiMo = models.BooleanField(default=True, verbose_name="Cổng đang mở")
    ThongBaoHieuLuc = models.CharField(max_length=500, default="Hiện tại đang trong thời gian nộp hồ sơ xét duyệt Sinh viên 5 tốt.", verbose_name="Thông báo khi đang mở")
    ThongBaoHetHan = models.CharField(max_length=500, default="Cổng nộp hồ sơ hiện đang đóng. Vui lòng quay lại sau.", verbose_name="Thông báo khi hết hạn")
    HanChotGiaiTrinh = models.DateTimeField(null=True, blank=True, verbose_name="Hạn chót giải trình")

    class Meta:
        db_table = 'CauHinhHeThong'
        verbose_name = 'Cấu hình hệ thống'
        verbose_name_plural = 'Cấu hình hệ thống'

    def __str__(self):
        return "Cấu hình hệ thống"
