from rest_framework import serializers
from .models import MinhChung, MinhChungFile
from criteria.models import TieuChi


class MinhChungFileSerializer(serializers.ModelSerializer):
    FileUrl = serializers.SerializerMethodField()

    class Meta:
        model = MinhChungFile
        fields = ['id', 'DuongDanFile', 'TenFile', 'FileUrl', 'NgayTao']

    def get_FileUrl(self, obj):
        request = self.context.get('request')
        if obj.DuongDanFile and request:
            return request.build_absolute_uri(obj.DuongDanFile.url)
        return None


class MinhChungSerializer(serializers.ModelSerializer):
    TrangThaiDisplay = serializers.CharField(source='get_TrangThai_display', read_only=True)
    CapDoDisplay = serializers.CharField(source='get_CapDo_display', read_only=True)
    is_tieu_chi_cung = serializers.BooleanField(read_only=True)
    NhomTieuChiTen = serializers.CharField(source='TieuChi.NhomTieuChi.TenNhom', read_only=True)
    TieuChiMoTa = serializers.CharField(source='TieuChi.MoTa', read_only=True)
    TieuChi = serializers.SlugRelatedField(read_only=True, slug_field='MaTieuChi')
    FileUrl = serializers.SerializerMethodField()
    danh_sach_file = MinhChungFileSerializer(many=True, read_only=True)

    class Meta:
        model = MinhChung
        fields = [
            'id', 'SinhVien', 'TieuChi',
            'NhomTieuChiTen', 'TieuChiMoTa',
            'TenMinhChung', 'CapDo', 'CapDoDisplay',
            'LoaiMinhChung', 'SoQuyetDinh', 'SoLuong',
            'DuongDanFile', 'FileUrl', 'TenFile', 'NgayNop',
            'danh_sach_file', 'Diem', 'is_tieu_chi_cung',
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
        # Nếu có file trong danh_sach_file thì trả về URL file đầu tiên (fallback)
        first_file = obj.danh_sach_file.first()
        if first_file and request:
            return request.build_absolute_uri(first_file.DuongDanFile.url)
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
            'DuongDanFile', 'TenFile',
        ]

    def validate(self, data):
        tieu_chi = data.get('TieuChi')
        cap_do = data.get('CapDo')
        loai = data.get('LoaiMinhChung')

        # Nếu tiêu chí yêu cầu số quyết định
        if tieu_chi and tieu_chi.CoSoQuyetDinh:
            if loai == 'Không Sqđ/GCN thường':
                raise serializers.ValidationError(
                    {'LoaiMinhChung': 'Tiêu chí này yêu cầu phải có số quyết định/GCN.'}
                )
            if not data.get('SoQuyetDinh'):
                raise serializers.ValidationError(
                    {'SoQuyetDinh': 'Tiêu chí này yêu cầu số quyết định.'}
                )
        return data

    def create(self, validated_data):
        # Lấy danh sách file từ request.FILES (key 'DuongDanFile')
        request = self.context.get('request')
        files = request.FILES.getlist('DuongDanFile') if request else []
        
        # Nếu có nhiều file, ta có thể chọn file đầu tiên làm file chính của MinhChung 
        # (đối với giao diện cũ vẫn dùng DuongDanFile)
        mc = MinhChung(**validated_data)
        mc.Diem = mc.tinh_diem_tu_cap_do()
        
        if files:
            # Gán file đầu tiên làm file chính (compatibility)
            mc.DuongDanFile = files[0]
            mc.TenFile = files[0].name.split('/')[-1]
        
        mc.save()
        
        # Tạo record MinhChungFile cho TẤT CẢ các file tải lên
        for f in files:
            MinhChungFile.objects.create(MinhChung=mc, DuongDanFile=f)
            
        return mc

    def update(self, instance, validated_data):
        request = self.context.get('request')
        files = request.FILES.getlist('DuongDanFile') if request else []
        
        # Update các field cơ bản
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        if files:
            # Xóa các file cũ nếu nộp tệp mới (tùy policy, ở đây ta ghi đè)
            instance.danh_sach_file.all().delete()
            
            # Gán file đầu tiên làm file chính
            instance.DuongDanFile = files[0]
            instance.TenFile = files[0].name.split('/')[-1]
            
            for f in files:
                MinhChungFile.objects.create(MinhChung=instance, DuongDanFile=f)
        
        # Re-calc điểm nếu cần
        instance.Diem = instance.tinh_diem_tu_cap_do()
        instance.save()
        return instance


class MinhChungAdminReviewSerializer(serializers.Serializer):
    """Admin duyệt/từ chối minh chứng"""
    TrangThai = serializers.ChoiceField(choices=['Approved', 'Rejected', 'NeedsExplanation'])
    PhanHoiAdmin = serializers.CharField(required=False, allow_blank=True)
    Diem = serializers.FloatField(required=False)
