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
            'id', 'MoTa', 'LoaiTieuChi', 'LoaiDisplay',
            'Diem', 'CoSoQuyetDinh', 'SoLuongToiThieu',
            'ThuTu', 'diem_cap_do', 'MaTieuChi'
        ]

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        ret['is_tieu_chi_cung'] = (instance.LoaiTieuChi == 'Cung')
        return ret


class NhomTieuChiSerializer(serializers.ModelSerializer):
    tieu_chi = TieuChiSerializer(many=True, read_only=True)

    class Meta:
        model = NhomTieuChi
        fields = ['id', 'TenNhom', 'MoTa', 'ThuTu', 'tieu_chi']


class TieuChiWriteSerializer(serializers.ModelSerializer):
    diem_cap_do = DiemTheoCapDoSerializer(many=True, required=False)

    class Meta:
        model = TieuChi
        fields = [
            'NhomTieuChi', 'MoTa', 'LoaiTieuChi', 'Diem',
            'CoSoQuyetDinh', 'SoLuongToiThieu', 'ThuTu', 'diem_cap_do'
        ]

    def create(self, validated_data):
        diem_data = validated_data.pop('diem_cap_do', [])
        tieu_chi = TieuChi.objects.create(**validated_data)
        for d in diem_data:
            DiemTheoCapDo.objects.create(TieuChi=tieu_chi, **d)
        return tieu_chi

    def update(self, instance, validated_data):
        diem_data = validated_data.pop('diem_cap_do', None)
        instance = super().update(instance, validated_data)
        if diem_data is not None:
            # Simple approach: clear and re-create for updates
            instance.diem_cap_do.all().delete()
            for d in diem_data:
                DiemTheoCapDo.objects.create(TieuChi=instance, **d)
        return instance
