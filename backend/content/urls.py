from django.urls import path
from .views import (
    BaiVietListView, BaiVietDetailView, AdminBaiVietListView,
    VinhDanhListView, VinhDanhDetailView, CauHinhHeThongView,
)

urlpatterns = [
    # Public
    path('posts/', BaiVietListView.as_view(), name='posts-list'),
    path('posts/<int:pk>/', BaiVietDetailView.as_view(), name='posts-detail'),
    path('featured/', VinhDanhListView.as_view(), name='featured-list'),
    path('featured/<int:pk>/', VinhDanhDetailView.as_view(), name='featured-detail'),
    # Admin
    path('admin/posts/', AdminBaiVietListView.as_view(), name='admin-posts-list'),
    path('settings/', CauHinhHeThongView.as_view(), name='system-settings'),
]
