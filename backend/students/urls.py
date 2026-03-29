from django.urls import path
from .views import (
    SinhVienMeView, SinhVienSubmitView, SinhVienUnsubmitView,
    AdminSinhVienListView, AdminSinhVienDetailView,
    AdminSinhVienApproveView, AdminSinhVienRejectView,
    AdminSinhVienFeedbackView, AdminSinhVienDeleteView,
    XacMinhListView, XacMinhUpdateView, XacMinhExplainView,
)

urlpatterns = [
    # Sinh viên
    path('students/me/', SinhVienMeView.as_view(), name='student-me'),
    path('students/me/submit/', SinhVienSubmitView.as_view(), name='student-submit'),
    path('students/me/unsubmit/', SinhVienUnsubmitView.as_view(), name='student-unsubmit'),
    path('students/me/fields/<str:field>/explain/', XacMinhExplainView.as_view(), name='student-field-explain'),
    # Admin - sinh viên
    path('admin/students/', AdminSinhVienListView.as_view(), name='admin-students-list'),
    path('admin/students/<int:pk>/', AdminSinhVienDetailView.as_view(), name='admin-students-detail'),
    path('admin/students/<int:pk>/approve/', AdminSinhVienApproveView.as_view(), name='admin-students-approve'),
    path('admin/students/<int:pk>/reject/', AdminSinhVienRejectView.as_view(), name='admin-students-reject'),
    path('admin/students/<int:pk>/feedback/', AdminSinhVienFeedbackView.as_view(), name='admin-students-feedback'),
    path('admin/students/<int:pk>/delete/', AdminSinhVienDeleteView.as_view(), name='admin-students-delete'),
    # Xác minh
    path('admin/students/<int:pk>/verifications/', XacMinhListView.as_view(), name='xac-minh-list'),
    path('admin/students/<int:pk>/verifications/<str:field>/', XacMinhUpdateView.as_view(), name='xac-minh-update'),
]
