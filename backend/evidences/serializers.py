from rest_framework import serializers
from .models import MinhChung
from criteria.models import TieuChi


class MinhChungSerializer(serializers.ModelSerializer):
    TrangThaiDisplay = serializers.CharField(source='get_TrangThai_display', read_only=True)
    CapDoDisplay = serializers.CharField(source='get_CapDo_display', read_only=True)
    is_tieu_chi_cung = serializers.BooleanField(read_only=True)
    NhomTieuChiTen = serializers.CharField(source='TieuChi.NhomTieuChi.TenNhom', read_only=True)
    TieuChiMoTa = serializers.CharField(source='TieuChi.MoTa', read_only=True)
    TieuChi = serializers.SlugRelatedField(read_only=True, slug_field='MaTieuChi')
    FileUrl = serializers.SerializerMethodField()

    class Meta:
        model = MinhChung
        fields = [
            'id', 'SinhVien', 'TieuChi',
            'NhomTieuChiTen', 'TieuChiMoTa',
            'TenMinhChung', 'CapDo', 'CapDoDisplay',
            'LoaiMinhChung', 'SoQuyetDinh', 'SoLuong',
            'DuongDanFile', 'FileUrl', 'TenFile', 'NgayNop',
            'NgayMinhChung', 'NgayGiaiTrinh',
            'Diem', 'is_tieu_chi_cung',
            'TrangThai', 'TrangThaiDisplay',
            'PhanHoiAdmin', 'GiaiTrinhSV',
            'NgayTao', 'NgayCapNhat'
        ]
        read_only_fields = [
            'id', 'NgayNop', 'Diem', 'TrangThai',
            'PhanHoiAdmin', 'NgayTao', 'NgayCapNhat'
        ]

    def get_FileUrl(self, obj):
        request = self.context.get('request')
        if obj.DuongDanFile and request:
            return request.build_absolute_uri(obj.DuongDanFile.url)
        return None


class MinhChungSubmitSerializer(serializers.ModelSerializer):
    """Dùng khi sinh viên nộp minh chứng"""
    TieuChi = serializers.SlugRelatedField(
        slug_field='MaTieuChi',
        queryset=TieuChi.objects.all()
    )
    
    class Meta:
        model = MinhChung
        fields = [
            'TieuChi', 'TenMinhChung', 'CapDo',
            'LoaiMinhChung', 'SoQuyetDinh', 'SoLuong',
            'DuongDanFile', 'TenFile', 'NgayMinhChung',
        ]

    def validate(self, data):
        tieu_chi = data.get('TieuChi')
        loai = data.get('LoaiMinhChung')

        # Rule: Nếu chọn "Có Sqđ" hoặc "Giấy khen" mà tiêu chí yêu cầu số quyết định -> Bắt buộc nhập SoQuyetDinh
        # Nếu chọn "Không Sqđ/GCN thường" -> Cho phép nộp kể cả khi tiêu chí yêu cầu số quyết định (để linh hoạt cho SV)
        if tieu_chi and tieu_chi.CoSoQuyetDinh:
            if loai != 'Không Sqđ/GCN thường' and not data.get('SoQuyetDinh'):
                raise serializers.ValidationError(
                    {'SoQuyetDinh': 'Hình thức này yêu cầu số quyết định.'}
                )
        return data

    def create(self, validated_data):
        mc = MinhChung(**validated_data)
        # Tự động tính điểm theo cấp độ
        mc.Diem = mc.tinh_diem_tu_cap_do()
        # Lưu tên file
        if mc.DuongDanFile and not mc.TenFile:
            mc.TenFile = mc.DuongDanFile.name.split('/')[-1]
        mc.save()
        return mc


class MinhChungAdminReviewSerializer(serializers.Serializer):
    """Admin duyệt/từ chối minh chứng"""
    TrangThai = serializers.ChoiceField(choices=['Approved', 'Rejected', 'NeedsExplanation'])
    PhanHoiAdmin = serializers.CharField(required=False, allow_blank=True)
    Diem = serializers.FloatField(required=False)
