from django.db import models


class BaiViet(models.Model):
    TRANG_THAI_CHOICES = [
        ('draft', 'Nháp'),
        ('published', 'Đã đăng'),
    ]

    TieuDe = models.CharField(max_length=300)
    NoiDung = models.TextField()
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
    HinhAnh = models.ImageField(upload_to='featured_faces/', max_length=500, blank=True, null=True)
    NgayTao = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'VinhDanh'
        verbose_name = 'Vinh danh'
        ordering = ['-NgayTao']

    def __str__(self):
        return f"{self.TenSinhVien} - {self.ThanhTich}"
