from django.utils import timezone
from content.models import CauHinhHeThong

def is_submission_open():
    config = CauHinhHeThong.objects.first()
    if not config:
        return True # Default to open if no config exists yet
    
    if not config.TrangThaiMo:
        return False
    
    now = timezone.now()
    if config.ThoiGianBatDau and now < config.ThoiGianBatDau:
        return False
    if config.ThoiGianKetThuc and now > config.ThoiGianKetThuc:
        return False
        
    return True

def can_student_edit(student):
    """
    Checks if a student can edit their profile/evidences.
    Allowed if:
    1. Submission window is open OR
    2. Profile is in 'Processing' status (needs explanation regardless of window)
    """
    if student.TrangThaiHoSo == 'Processing':
        return True
    return is_submission_open()
