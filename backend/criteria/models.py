from django.db import models


class NhomTieuChi(models.Model):
    TenNhom = models.CharField(max_length=100, unique=True)
    MoTa = models.CharField(max_length=500, blank=True, null=True)
    ThuTu = models.IntegerField(default=0)

    class Meta:
        db_table = 'NhomTieuChi'
        verbose_name = 'Nhóm tiêu chí'
        ordering = ['ThuTu']

    def __str__(self):
        return self.TenNhom


class TieuChi(models.Model):
    LOAI_CHOICES = [
        ('Cung', 'Cứng (bắt buộc)'),
        ('Cong', 'Cộng (linh hoạt)'),
    ]

    NhomTieuChi = models.ForeignKey(
        NhomTieuChi, on_delete=models.CASCADE, related_name='tieu_chi'
    )
    MaTieuChi = models.CharField(max_length=50, unique=True, null=True, blank=True)
    MoTa = models.CharField(max_length=500)
    LoaiTieuChi = models.CharField(max_length=10, choices=LOAI_CHOICES, default='Cong')
    Diem = models.FloatField(null=True, blank=True)
    CoSoQuyetDinh = models.BooleanField(default=False)
    SoLuongToiThieu = models.IntegerField(null=True, blank=True)
    ThuTu = models.IntegerField(default=0)

    class Meta:
        db_table = 'TieuChi'
        verbose_name = 'Tiêu chí'
        ordering = ['ThuTu']

    def __str__(self):
        return f"[{self.NhomTieuChi.TenNhom}] {self.MoTa[:60]}"

    def save(self, *args, **kwargs):
        if not self.MaTieuChi:
            from django.utils.text import slugify
            import uuid
            base_slug = slugify(self.MoTa)[:40]
            if not base_slug:
                base_slug = 'tieuchi'
            self.MaTieuChi = f"{base_slug}-{str(uuid.uuid4())[:6]}"
        super().save(*args, **kwargs)


class DiemTheoCapDo(models.Model):
    CAP_DO_CHOICES = [
        ('Cấp Khoa/CLB', 'Cấp Khoa/CLB'),
        ('Cấp Trường/Phường/Xã', 'Cấp Trường/Phường/Xã'),
        ('Cấp ĐHĐN', 'Cấp ĐHĐN'),
        ('Cấp Tỉnh/Thành phố', 'Cấp Tỉnh/Thành phố'),
        ('Cấp Trung ương', 'Cấp Trung ương'),
    ]

    TieuChi = models.ForeignKey(
        TieuChi, on_delete=models.CASCADE, related_name='diem_cap_do'
    )
    CapDo = models.CharField(max_length=50, choices=CAP_DO_CHOICES)
    Diem = models.FloatField()

    class Meta:
        db_table = 'DiemTheoCapDo'
        verbose_name = 'Điểm theo cấp độ'
        unique_together = ('TieuChi', 'CapDo')

    def __str__(self):
        return f"{self.TieuChi} | {self.CapDo}: {self.Diem}"
