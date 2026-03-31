import os
import re

def patch_file(file_path, pattern, insertion):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    if re.search(pattern, content):
        new_content = re.sub(pattern, r'\1' + insertion, content)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully updated {os.path.basename(file_path)}")
        return True
    else:
        print(f"Pattern not found in {os.path.basename(file_path)}")
        return False

# Patch StudentDashboard.tsx
student_path = r'd:\HK2NAM4\DoAnTN\SV5T_TTTN\frontend\src\pages\StudentDashboard.tsx'
student_pattern = r'(</div>\s*</div>\s*<div\s+className="flex\s+flex-wrap\s+gap-2">)'
student_insertion = """
                              {ev.evidenceDate && (
                                <div className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-100 mb-3 w-fit flex items-center gap-2">
                                  <i className="far fa-calendar-alt"></i>
                                  Ngày cấp/thực hiện: {ev.evidenceDate}
                                </div>
                              )}
"""
patch_file(student_path, student_pattern, student_insertion)
