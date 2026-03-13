from rest_framework.views import APIView
from rest_framework.generics import ListAPIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import NhomTieuChi, TieuChi, DiemTheoCapDo
from .serializers import (
    NhomTieuChiSerializer, TieuChiSerializer,
    TieuChiWriteSerializer, DiemTheoCapDoSerializer
)
from accounts.permissions import IsAdmin


class NhomTieuChiListView(ListAPIView):
    """Public: danh sách tất cả nhóm tiêu chí kèm tiêu chí con"""
    permission_classes = [AllowAny]
    serializer_class = NhomTieuChiSerializer
    pagination_class = None

    def get_queryset(self):
        return NhomTieuChi.objects.prefetch_related(
            'tieu_chi', 'tieu_chi__diem_cap_do'
        ).order_by('ThuTu')

    def post(self, request):
        if not request.user.is_authenticated or not request.user.VaiTro in ['Admin']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        
        ten_nhom = request.data.get('TenNhom')
        thu_tu = request.data.get('ThuTu', 0)
        
        if not ten_nhom:
            return Response({'detail': 'Thiếu tên nhóm.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            obj, created = NhomTieuChi.objects.get_or_create(
                TenNhom=ten_nhom,
                defaults={'ThuTu': thu_tu}
            )
            return Response(NhomTieuChiSerializer(obj).data, 
                          status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)
        except Exception as e:
            return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class NhomTieuChiDetailView(APIView):
    permission_classes = [AllowAny]

    def get_object(self, pk):
        try:
            return NhomTieuChi.objects.prefetch_related(
                'tieu_chi', 'tieu_chi__diem_cap_do'
            ).get(pk=pk)
        except NhomTieuChi.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(NhomTieuChiSerializer(obj).data)
    
    def put(self, request, pk):
        if not request.user.is_authenticated or not request.user.VaiTro in ['Admin']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = NhomTieuChiSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        if not request.user.is_authenticated or not request.user.VaiTro in ['Admin']:
            return Response({'detail': 'Không có quyền.'}, status=status.HTTP_403_FORBIDDEN)
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class TieuChiListView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request):
        serializer = TieuChiWriteSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tc = serializer.save()
        return Response(TieuChiSerializer(tc).data, status=status.HTTP_201_CREATED)


class TieuChiDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return TieuChi.objects.get(pk=pk)
        except TieuChi.DoesNotExist:
            return None

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = TieuChiWriteSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(TieuChiSerializer(obj).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class DiemTheoCapDoView(APIView):
    permission_classes = [IsAdmin]

    def post(self, request, tc_pk):
        try:
            tc = TieuChi.objects.get(pk=tc_pk)
        except TieuChi.DoesNotExist:
            return Response({'detail': 'Tiêu chí không tồn tại.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = DiemTheoCapDoSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        obj, _ = DiemTheoCapDo.objects.update_or_create(
            TieuChi=tc, CapDo=serializer.validated_data['CapDo'],
            defaults={'Diem': serializer.validated_data['Diem']}
        )
        return Response(DiemTheoCapDoSerializer(obj).data)
