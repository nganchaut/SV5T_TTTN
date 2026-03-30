from rest_framework import serializers
from .models import SinhVien, XacMinh
from evidences.serializers import MinhChungSerializer


class XacMinhSerializer(serializers.ModelSerializer):
    TruongDuLieuDisplay = serializers.CharField(source='get_TruongDuLieu_display', read_only=True)
    TrangThaiDisplay = serializers.CharField(source='get_TrangThai_display', read_only=True)
    FileUrl = serializers.SerializerMethodField()

    class Meta:
        model = XacMinh
        fields = [
            'id', 'TruongDuLieu', 'TruongDuLieuDisplay',
            'TrangThai', 'TrangThaiDisplay', 
            'PhanHoiAdmin', 'GiaiTrinhSV', 'NgayGiaiTrinh',
            'NgayCapNhat',
            'DuongDanFile', 'FileUrl', 'TenFile'
        ]
        read_only_fields = ['id', 'NgayCapNhat']

    def get_FileUrl(self, obj):
        request = self.context.get('request')
        if obj.DuongDanFile and request:
            return request.build_absolute_uri(obj.DuongDanFile.url)
        return None


class SinhVienProfileSerializer(serializers.ModelSerializer):
    """Cho sinh viên tự xem hồ sơ"""
    xac_minh = XacMinhSerializer(many=True, read_only=True)
    minh_chung = MinhChungSerializer(many=True, read_only=True)
    TrangThaiDisplay = serializers.CharField(source='get_TrangThaiHoSo_display', read_only=True)
    TaiKhoanId = serializers.IntegerField(source='TaiKhoan.id', read_only=True)
    
    # Các trường kiểm tra trạng thái cổng
    is_submission_open = serializers.SerializerMethodField()
    can_edit_profile = serializers.SerializerMethodField()
    submission_msg = serializers.SerializerMethodField()
    da_xem_xet = serializers.SerializerMethodField()

    class Meta:
        model = SinhVien
        fields = [
            'id', 'TaiKhoanId', 'HoTen', 'MaSV', 'Lop', 'Khoa',
            'DiemTBC', 'DiemRenLuyen', 'DiemTheDuc',
            'TrinhDoNgoaiNgu', 'GPANgoaiNgu',
            'LaDangVien', 'KhongViPham',
            'TrangThaiHoSo', 'TrangThaiDisplay',
            'TongDiem', 'PhanHoiChung',
            'xac_minh', 'minh_chung', 'NgayTao', 'NgayCapNhat',
            'is_submission_open', 'can_edit_profile', 'submission_msg', 'da_xem_xet'
        ]
        read_only_fields = ['id', 'MaSV', 'TongDiem', 'TrangThaiHoSo', 'NgayTao', 'NgayCapNhat']

    def get_is_submission_open(self, obj):
        from .utils import is_submission_open
        return is_submission_open()

    def get_can_edit_profile(self, obj):
        from .utils import can_student_edit
        return can_student_edit(obj)

    def get_submission_msg(self, obj):
        from content.models import CauHinhHeThong
        config = CauHinhHeThong.objects.first()
        if not config:
            return ""
        from .utils import is_submission_open
        if is_submission_open():
            return config.ThongBaoHieuLuc
        return config.ThongBaoHetHan

    def get_da_xem_xet(self, obj):
        """True nếu Admin đã từng tác động hồ sơ (qua LichSuHoSo).
        Dùng audit trail thay vì trạng thái hiện tại để tránh bị reset sau giải trình."""
        return obj.lich_su.filter(
            TrangThaiSau__in=['Processing', 'Approved', 'Rejected']
        ).exists()


class SinhVienUpdateSerializer(serializers.ModelSerializer):
    """Sinh viên cập nhật thông tin hồ sơ (chỉ khi Draft)"""
    class Meta:
        model = SinhVien
        fields = [
            'HoTen', 'Lop', 'Khoa',
            'DiemTBC', 'DiemRenLuyen', 'DiemTheDuc',
            'TrinhDoNgoaiNgu', 'GPANgoaiNgu',
            'LaDangVien', 'KhongViPham',
        ]

    def validate(self, data):
        instance = self.instance
        if instance and instance.TrangThaiHoSo not in ['Draft', 'Rejected', 'Processing']:
            raise serializers.ValidationError(
                'Chỉ có thể chỉnh sửa hồ sơ khi ở trạng thái Nháp, Bị từ chối hoặc Đang giải trình.'
            )
        return data


class SinhVienAdminSerializer(serializers.ModelSerializer):
    """Admin xem danh sách + chi tiết sinh viên"""
    xac_minh = XacMinhSerializer(many=True, read_only=True)
    minh_chung = MinhChungSerializer(many=True, read_only=True)
    TrangThaiDisplay = serializers.CharField(source='get_TrangThaiHoSo_display', read_only=True)
    TaiKhoanInfo = serializers.SerializerMethodField()

    class Meta:
        model = SinhVien
        fields = '__all__'

    def get_TaiKhoanInfo(self, obj):
        return {
            'id': obj.TaiKhoan.id,
            'TenDangNhap': obj.TaiKhoan.TenDangNhap,
            'TrangThai': obj.TaiKhoan.TrangThai,
        }
