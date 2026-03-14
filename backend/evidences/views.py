from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import MinhChung
from .serializers import (
    MinhChungSerializer, MinhChungSubmitSerializer,
    MinhChungAdminReviewSerializer
)
from accounts.permissions import IsAdmin, IsSinhVien
from students.models import SinhVien
from students.serializers import SinhVienProfileSerializer


class MinhChungListView(APIView):
    """Sinh viên: xem và nộp minh chứng"""

    def get_permissions(self):
        return [IsAuthenticated()]

    def get(self, request):
        if request.user.VaiTro == 'SinhVien':
            try:
                sv = request.user.sinh_vien
            except SinhVien.DoesNotExist:
                return Response([])
            qs = MinhChung.objects.filter(SinhVien=sv).select_related('TieuChi', 'TieuChi__NhomTieuChi')
            # Filter by nhóm tiêu chí
            nhom_id = request.query_params.get('nhom')
            if nhom_id:
                qs = qs.filter(TieuChi__NhomTieuChi_id=nhom_id)
            return Response(MinhChungSerializer(qs, many=True, context={'request': request}).data)
        else:
            # Admin xem tất cả
            return Response({'detail': 'Dùng endpoint /api/admin/evidences/'}, status=status.HTTP_403_FORBIDDEN)

    def post(self, request):
        if request.user.VaiTro != 'SinhVien':
            return Response({'detail': 'Chỉ sinh viên mới có thể nộp minh chứng.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Chưa có hồ sơ sinh viên.'}, status=status.HTTP_404_NOT_FOUND)

        if sv.TrangThaiHoSo == 'Approved':
            return Response({'detail': 'Hồ sơ đã được duyệt, không thể nộp thêm minh chứng.'}, status=status.HTTP_400_BAD_REQUEST)

        serializer = MinhChungSubmitSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        mc = serializer.save(SinhVien=sv)
        sv.tinh_tong_diem() # Cập nhật điểm ngay
        return Response(MinhChungSerializer(mc, context={'request': request}).data, status=status.HTTP_201_CREATED)


class MinhChungDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get_object(self, pk, user):
        try:
            mc = MinhChung.objects.select_related('SinhVien', 'TieuChi').get(pk=pk)
            if user.VaiTro == 'SinhVien' and mc.SinhVien.TaiKhoan != user:
                return None
            return mc
        except MinhChung.DoesNotExist:
            return None

    def put(self, request, pk):
        mc = self.get_object(pk, request.user)
        if not mc:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        if mc.TrangThai not in ['Pending', 'NeedsExplanation']:
            return Response({'detail': 'Không thể sửa minh chứng đã duyệt/từ chối.'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = MinhChungSubmitSerializer(mc, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        mc.SinhVien.tinh_tong_diem() # Cập nhật điểm
        return Response(MinhChungSerializer(mc, context={'request': request}).data)

    def delete(self, request, pk):
        mc = self.get_object(pk, request.user)
        if not mc:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        if mc.TrangThai == 'Approved':
            return Response({'detail': 'Không thể xóa minh chứng đã duyệt.'}, status=status.HTTP_400_BAD_REQUEST)
        sv = mc.SinhVien
        mc.delete()
        sv.tinh_tong_diem() # Cập nhật điểm sau xóa
        return Response(status=status.HTTP_204_NO_CONTENT)


class MinhChungExplainView(APIView):
    permission_classes = [IsSinhVien]

    def post(self, request, pk):
        try:
            sv = request.user.sinh_vien
            mc = MinhChung.objects.get(pk=pk, SinhVien=sv)
        except (SinhVien.DoesNotExist, MinhChung.DoesNotExist):
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        if mc.TrangThai not in ['NeedsExplanation', 'Pending']:
            return Response({'detail': 'Minh chứng này không cần giải trình.'}, status=status.HTTP_400_BAD_REQUEST)

        giai_trinh = request.data.get('GiaiTrinhSV', '')
        new_file = request.data.get('DuongDanFile')

        if not giai_trinh and not new_file:
            return Response({'detail': 'Vui lòng nhập nội dung giải trình hoặc đính kèm file.'}, status=status.HTTP_400_BAD_REQUEST)

        if giai_trinh:
            mc.GiaiTrinhSV = giai_trinh
        if new_file:
            # Nếu có file mới thì ghi đè file cũ
            mc.DuongDanFile = new_file
            if hasattr(new_file, 'name'):
                mc.TenFile = new_file.name.split('/')[-1]

        mc.TrangThai = 'Pending'
        mc.save()
        return Response(SinhVienProfileSerializer(mc.SinhVien).data)


# ── Admin Evidence Views ─────────────────────────

class AdminMinhChungListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = MinhChung.objects.select_related(
            'SinhVien', 'TieuChi', 'TieuChi__NhomTieuChi'
        )
        trang_thai = request.query_params.get('trangThai')
        sv_id = request.query_params.get('sinhVien')
        tc_id = request.query_params.get('tieuChi')

        if trang_thai:
            qs = qs.filter(TrangThai=trang_thai)
        if sv_id:
            qs = qs.filter(SinhVien_id=sv_id)
        if tc_id:
            qs = qs.filter(TieuChi_id=tc_id)

        return Response(MinhChungSerializer(qs, many=True, context={'request': request}).data)


class AdminMinhChungReviewView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk, action):
        try:
            mc = MinhChung.objects.get(pk=pk)
        except MinhChung.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        if action == 'approve':
            diem = request.data.get('Diem', mc.tinh_diem_tu_cap_do())
            mc.TrangThai = 'Approved'
            mc.Diem = diem
            mc.PhanHoiAdmin = request.data.get('PhanHoiAdmin', '')
            mc.save()
            # Cập nhật lại tổng điểm sinh viên
            mc.SinhVien.tinh_tong_diem()
            return Response({'detail': 'Đã duyệt minh chứng.', 'Diem': mc.Diem})

        elif action == 'reject':
            mc.TrangThai = 'Rejected'
            mc.Diem = 0
            mc.PhanHoiAdmin = request.data.get('PhanHoiAdmin', '')
            mc.save()
            mc.SinhVien.tinh_tong_diem()
            return Response({'detail': 'Đã từ chối minh chứng.'})

        elif action == 'request-explain':
            mc.TrangThai = 'NeedsExplanation'
            mc.PhanHoiAdmin = request.data.get('PhanHoiAdmin', '')
            mc.save()
            return Response({'detail': 'Đã yêu cầu sinh viên giải trình.'})

        return Response({'detail': 'Hành động không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)
