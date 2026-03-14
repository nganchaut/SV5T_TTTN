from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .models import TaiKhoan, NguoiDung
from .serializers import (
    LoginSerializer, TaiKhoanSerializer,
    TaiKhoanCreateSerializer, NguoiDungSerializer, MeSerializer
)
from .permissions import IsAdmin


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': MeSerializer(user).data,
        })


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return Response({'detail': 'Đăng xuất thành công.'})
        except Exception:
            return Response({'detail': 'Token không hợp lệ.'}, status=status.HTTP_400_BAD_REQUEST)


class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = MeSerializer(request.user)
        return Response(serializer.data)


class TaiKhoanListView(APIView):
    """Admin: Quản lý tài khoản"""
    permission_classes = [IsAdmin]

    def get(self, request):
        vai_tro = request.query_params.get('vaiTro')
        qs = TaiKhoan.objects.all()
        if vai_tro:
            qs = qs.filter(VaiTro=vai_tro)
        serializer = TaiKhoanSerializer(qs, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = TaiKhoanCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(TaiKhoanSerializer(user).data, status=status.HTTP_201_CREATED)


class TaiKhoanDetailView(APIView):
    permission_classes = [IsAdmin]

    def get_object(self, pk):
        try:
            return TaiKhoan.objects.get(pk=pk)
        except TaiKhoan.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(TaiKhoanSerializer(obj).data)

    def delete(self, request, pk):
        obj = self.get_object(pk)
        if not obj:
            return Response({'detail': 'Không tìm thấy.'}, status=status.HTTP_404_NOT_FOUND)
        obj.delete()
        return Response({'detail': 'Đã xóa tài khoản.'}, status=status.HTTP_204_NO_CONTENT)
