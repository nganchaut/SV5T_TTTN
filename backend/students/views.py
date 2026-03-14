from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import SinhVien, XacMinh
from .serializers import (
    SinhVienProfileSerializer, SinhVienUpdateSerializer,
    SinhVienAdminSerializer, XacMinhSerializer
)
from accounts.permissions import IsAdmin, IsSinhVien


class SinhVienMeView(APIView):
    """Sinh viên xem/cập nhật hồ sơ của mình"""
    permission_classes = [IsSinhVien]

    def get(self, request):
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Chưa có hồ sơ sinh viên.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SinhVienProfileSerializer(sv)
        return Response(serializer.data)

    def put(self, request):
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Chưa có hồ sơ sinh viên.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = SinhVienUpdateSerializer(sv, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Refresh object from DB to get latest related data (minh_chung, xac_minh)
        sv.refresh_from_db()
        return Response(SinhVienProfileSerializer(sv, context={'request': request}).data)


class SinhVienSubmitView(APIView):
    """Sinh viên nộp hồ sơ -> Draft thành Submitted"""
    permission_classes = [IsSinhVien]

    def post(self, request):
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Chưa có hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        if sv.TrangThaiHoSo != 'Draft':
            return Response(
                {'detail': f'Không thể nộp khi hồ sơ đang ở trạng thái {sv.TrangThaiHoSo}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Kiểm tra có ít nhất 1 minh chứng chưa
        if not sv.minh_chung.exists():
            return Response(
                {'detail': 'Phải có ít nhất 1 minh chứng trước khi nộp hồ sơ.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sv.TrangThaiHoSo = 'Submitted'
        sv.save()

        # Tự động tạo các bản ghi XacMinh cho 5 trường nếu chưa có
        FIELDS = ['gpa', 'trainingPoints', 'peScore', 'english', 'partyMember']
        for field in FIELDS:
            XacMinh.objects.get_or_create(SinhVien=sv, TruongDuLieu=field)

        return Response({'detail': 'Nộp hồ sơ thành công.', 'TrangThai': sv.TrangThaiHoSo})


class SinhVienUnsubmitView(APIView):
    """Sinh viên: Hủy nộp hồ sơ (Quay lại Draft) để chỉnh sửa"""
    permission_classes = [IsSinhVien]

    def post(self, request):
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        if sv.TrangThaiHoSo != 'Submitted':
            return Response(
                {'detail': f'Không thể hủy nộp khi hồ sơ đang ở trạng thái {sv.TrangThaiHoSo}.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        sv.TrangThaiHoSo = 'Draft'
        sv.save()
        return Response({'detail': 'Đã hủy nộp hồ sơ.', 'TrangThai': sv.TrangThaiHoSo})


# ── Admin views ──────────────────────────────────

class AdminSinhVienListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = SinhVien.objects.select_related('TaiKhoan').prefetch_related('xac_minh').exclude(TrangThaiHoSo='Draft')

        # Filter
        trang_thai = request.query_params.get('trangThai')
        khoa = request.query_params.get('khoa')
        lop = request.query_params.get('lop')
        search = request.query_params.get('search')

        if trang_thai:
            qs = qs.filter(TrangThaiHoSo=trang_thai)
        if khoa:
            qs = qs.filter(Khoa__icontains=khoa)
        if lop:
            qs = qs.filter(Lop__icontains=lop)
        if search:
            qs = qs.filter(HoTen__icontains=search) | qs.filter(MaSV__icontains=search)

        serializer = SinhVienAdminSerializer(qs, many=True, context={'request': request})
        return Response(serializer.data)


class AdminSinhVienDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return SinhVien.objects.select_related('TaiKhoan').prefetch_related('xac_minh', 'minh_chung').get(pk=pk)
        except SinhVien.DoesNotExist:
            return None

    def get(self, request, pk):
        sv = self.get_object(pk)
        if not sv:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(SinhVienAdminSerializer(sv, context={'request': request}).data)


class AdminSinhVienApproveView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            sv = SinhVien.objects.get(pk=pk)
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        if sv.TrangThaiHoSo not in ['Submitted', 'Processing']:
            return Response({'detail': 'Hồ sơ chưa được nộp.'}, status=status.HTTP_400_BAD_REQUEST)

        sv.TrangThaiHoSo = 'Approved'
        sv.PhanHoiChung = request.data.get('phanHoi', '')
        sv.tinh_tong_diem()
        sv.save()
        return Response({'detail': 'Đã duyệt hồ sơ.', 'TongDiem': sv.TongDiem})


class AdminSinhVienRejectView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            sv = SinhVien.objects.get(pk=pk)
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        sv.TrangThaiHoSo = 'Rejected'
        sv.PhanHoiChung = request.data.get('phanHoi', '')
        sv.save()
        return Response({'detail': 'Đã từ chối hồ sơ.'})


class AdminSinhVienFeedbackView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, pk):
        try:
            sv = SinhVien.objects.get(pk=pk)
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)

        sv.TrangThaiHoSo = 'Processing'
        sv.PhanHoiChung = request.data.get('phanHoi', sv.PhanHoiChung)
        sv.save()
        return Response({'detail': 'Đã gửi phản hồi.', 'PhanHoiChung': sv.PhanHoiChung})


# ── Xác minh views ──────────────────────────────

class XacMinhListView(APIView):
    permission_classes = [IsAdmin]

    def get(self, request, pk):
        try:
            sv = SinhVien.objects.get(pk=pk)
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        xm = sv.xac_minh.all()
        return Response(XacMinhSerializer(xm, many=True).data)


class XacMinhUpdateView(APIView):
    permission_classes = [IsAdmin]

    def put(self, request, pk, field):
        try:
            sv = SinhVien.objects.get(pk=pk)
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy sinh viên.'}, status=status.HTTP_404_NOT_FOUND)

        xm, _ = XacMinh.objects.get_or_create(SinhVien=sv, TruongDuLieu=field)
        trang_thai = request.data.get('TrangThai')
        phan_hoi = request.data.get('PhanHoi', '')

        if trang_thai not in ['Pending', 'Approved', 'Rejected', 'NeedsExplanation']:
            return Response({'detail': 'Trạng thái không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)

        xm.TrangThai = trang_thai
        xm.PhanHoi = phan_hoi
        xm.save()
        return Response(XacMinhSerializer(xm).data)


class XacMinhExplainView(APIView):
    """Sinh viên: giải trình cho một trường bị Admin bắt lỗi"""
    permission_classes = [IsSinhVien]

    def post(self, request, field):
        try:
            sv = request.user.sinh_vien
        except SinhVien.DoesNotExist:
            return Response({'detail': 'Không tìm thấy hồ sơ.'}, status=status.HTTP_404_NOT_FOUND)

        try:
            xm = sv.xac_minh.get(TruongDuLieu=field)
        except XacMinh.DoesNotExist:
            return Response({'detail': 'Trường dữ liệu này không cần giải trình.'}, status=status.HTTP_404_NOT_FOUND)

        if xm.TrangThai != 'NeedsExplanation':
            return Response({'detail': 'Trường này không yêu cầu giải trình.'}, status=status.HTTP_400_BAD_REQUEST)

        giai_trinh = request.data.get('GiaiTrinhSV', '')
        if not giai_trinh:
            return Response({'detail': 'Vui lòng nhập nội dung giải trình.'}, status=status.HTTP_400_BAD_REQUEST)

        xm.GiaiTrinhSV = giai_trinh
        xm.TrangThai = 'Pending'
        xm.save()
        return Response({'detail': 'Đã gửi giải trình.'})
