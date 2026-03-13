import os
from django.db import models
from students.models import SinhVien
from criteria.models import TieuChi


def minh_chung_upload_path(instance, filename):
    return f"minh_chung/{instance.SinhVien.MaSV}/{filename}"


class MinhChung(models.Model):
    CAP_DO_CHOICES = [
        ('Cấp Khoa/CLB', 'Cấp Khoa/CLB'),
        ('Cấp Trường/Phường/Xã', 'Cấp Trường/Phường/Xã'),
        ('Cấp ĐHĐN', 'Cấp ĐHĐN'),
        ('Cấp Tỉnh/Thành phố', 'Cấp Tỉnh/Thành phố'),
        ('Cấp Trung ương', 'Cấp Trung ương'),
    ]
    LOAI_CHOICES = [
        ('Không Sqđ/GCN thường', 'Không Sqđ/GCN thường'),
        ('Có Sqđ/GCN có mã số', 'Có Sqđ/GCN có mã số'),
        ('Giấy khen/Bằng khen', 'Giấy khen/Bằng khen'),
    ]
    TRANG_THAI_CHOICES = [
        ('Pending', 'Chờ duyệt'),
        ('Approved', 'Đã duyệt'),
        ('Rejected', 'Từ chối'),
        ('NeedsExplanation', 'Cần giải trình'),
    ]

    SinhVien = models.ForeignKey(
        SinhVien, on_delete=models.CASCADE, related_name='minh_chung'
    )
    TieuChi = models.ForeignKey(
        TieuChi, on_delete=models.CASCADE, related_name='minh_chung'
    )
    TenMinhChung = models.CharField(max_length=200)
    CapDo = models.CharField(max_length=50, choices=CAP_DO_CHOICES)
    LoaiMinhChung = models.CharField(max_length=50, choices=LOAI_CHOICES)
    SoQuyetDinh = models.CharField(max_length=100, blank=True, null=True)
    # Số lượng: số ngày tình nguyện, số lần hiến máu, v.v.
    SoLuong = models.IntegerField(blank=True, null=True)
    DuongDanFile = models.FileField(upload_to=minh_chung_upload_path, blank=True, null=True)
    TenFile = models.CharField(max_length=200, blank=True, null=True)
    NgayNop = models.DateField(auto_now_add=True)
    Diem = models.FloatField(default=0)
    TrangThai = models.CharField(max_length=30, choices=TRANG_THAI_CHOICES, default='Pending')
    PhanHoiAdmin = models.CharField(max_length=500, blank=True, null=True)
    GiaiTrinhSV = models.CharField(max_length=500, blank=True, null=True)
    NgayTao = models.DateTimeField(auto_now_add=True)
    NgayCapNhat = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'MinhChung'
        verbose_name = 'Minh chứng'
        ordering = ['-NgayTao']

    def __str__(self):
        return f"{self.SinhVien.MaSV} - {self.TenMinhChung}"

    @property
    def is_tieu_chi_cung(self):
        return self.TieuChi.LoaiTieuChi == 'Cung'

    def tinh_diem_tu_cap_do(self):
        """Tính điểm dựa trên CapDo và LoaiMinhChung để khớp với Frontend"""
        POINT_MATRIX = {
            'Cấp Khoa/CLB': {
                'Không Sqđ/GCN thường': 0.1,
                'Có Sqđ/GCN có mã số': 0.1,
                'Giấy khen/Bằng khen': 0.1,
            },
            'Cấp Trường/Phường/Xã': {
                'Không Sqđ/GCN thường': 0.2,
                'Có Sqđ/GCN có mã số': 0.3,
                'Giấy khen/Bằng khen': 0.4,
            },
            'Cấp ĐHĐN': {
                'Không Sqđ/GCN thường': 0.3,
                'Có Sqđ/GCN có mã số': 0.4,
                'Giấy khen/Bằng khen': 0.5,
            },
            'Cấp Tỉnh/Thành phố': {
                'Không Sqđ/GCN thường': 0.4,
                'Có Sqđ/GCN có mã số': 0.5,
                'Giấy khen/Bằng khen': 0.6,
            },
            'Cấp Trung ương': {
                'Không Sqđ/GCN thường': 0.5,
                'Có Sqđ/GCN có mã số': 0.6,
                'Giấy khen/Bằng khen': 0.7,
            },
        }
        try:
            return POINT_MATRIX.get(self.CapDo, {}).get(self.LoaiMinhChung, self.TieuChi.Diem or 0)
        except Exception:
            return self.TieuChi.Diem or 0
