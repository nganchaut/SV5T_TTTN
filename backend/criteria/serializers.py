from rest_framework import serializers
from .models import NhomTieuChi, TieuChi, DiemTheoCapDo


class DiemTheoCapDoSerializer(serializers.ModelSerializer):
    class Meta:
        model = DiemTheoCapDo
        fields = ['id', 'CapDo', 'Diem']


class TieuChiSerializer(serializers.ModelSerializer):
    diem_cap_do = DiemTheoCapDoSerializer(many=True, read_only=True)
    LoaiDisplay = serializers.CharField(source='get_LoaiTieuChi_display', read_only=True)

    class Meta:
        model = TieuChi
        fields = [
            'id', 'MaTieuChi', 'MoTa', 'LoaiTieuChi', 'LoaiDisplay',
            'Diem', 'CoSoQuyetDinh', 'SoLuongToiThieu',
            'ThuTu', 'diem_cap_do'
        ]


class NhomTieuChiSerializer(serializers.ModelSerializer):
    tieu_chi = TieuChiSerializer(many=True, read_only=True)

    class Meta:
        model = NhomTieuChi
        fields = ['id', 'TenNhom', 'MoTa', 'ThuTu', 'tieu_chi']


class TieuChiWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = TieuChi
        fields = ['NhomTieuChi', 'MoTa', 'LoaiTieuChi', 'Diem',
                  'CoSoQuyetDinh', 'SoLuongToiThieu', 'ThuTu']
