from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny

from .models import BaiViet, VinhDanh, CauHinhHeThong
from .serializers import BaiVietSerializer, VinhDanhSerializer, CauHinhHeThongSerializer
from accounts.permissions import IsAdmin, IsAdminOrReadOnly


class BaiVietListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        qs = BaiViet.objects.filter(TrangThai='published').order_by('-NgayDang')
        return Response(BaiVietSerializer(qs, many=True).data)

    def post(self, request):
        serializer = BaiVietSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class BaiVietDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get_object(self, pk):
        try:
            return BaiViet.objects.get(pk=pk)
        except BaiViet.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(BaiVietSerializer(obj).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = BaiVietSerializer(obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class AdminBaiVietListView(APIView):
    """Admin xem tất cả bài viết kể cả draft"""
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = BaiViet.objects.all().order_by('-NgayDang')
        return Response(BaiVietSerializer(qs, many=True).data)


class VinhDanhListView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        qs = VinhDanh.objects.all()
        return Response(VinhDanhSerializer(qs, many=True, context={'request': request}).data)

    def post(self, request):
        serializer = VinhDanhSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class VinhDanhDetailView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get_object(self, pk):
        try:
            return VinhDanh.objects.get(pk=pk)
        except VinhDanh.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(VinhDanhSerializer(obj, context={'request': request}).data)

    def put(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        serializer = VinhDanhSerializer(obj, data=request.data, partial=True, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CauHinhHeThongView(APIView):
    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdmin()]

    def get(self, request):
        obj = CauHinhHeThong.objects.first()
        if not obj:
            # Create a default one if none exists
            obj = CauHinhHeThong.objects.create()
        return Response(CauHinhHeThongSerializer(obj).data)

    def post(self, request):
        obj = CauHinhHeThong.objects.first()
        if obj:
            serializer = CauHinhHeThongSerializer(obj, data=request.data, partial=True)
        else:
            serializer = CauHinhHeThongSerializer(data=request.data)
        
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)
