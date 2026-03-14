from rest_framework import serializers
from .models import BaiViet, VinhDanh


class BaiVietSerializer(serializers.ModelSerializer):
    TrangThaiDisplay = serializers.CharField(source='get_TrangThai_display', read_only=True)

    class Meta:
        model = BaiViet
        fields = ['id', 'TieuDe', 'NoiDung', 'HinhAnh', 'NgayDang',
                  'TrangThai', 'TrangThaiDisplay', 'NgayTao']
        read_only_fields = ['id', 'NgayDang', 'NgayTao']


class VinhDanhSerializer(serializers.ModelSerializer):

    class Meta:
        model = VinhDanh
        fields = ['id', 'TenSinhVien', 'ThanhTich', 'NoiDung',
                  'HinhAnh', 'NgayTao']
        read_only_fields = ['id', 'NgayTao']
