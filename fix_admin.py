import os
import re

file_path = r'd:\HK2NAM4\DoAnTN\SV5T_TTTN\frontend\src\pages\AdminDashboard.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Flexible regex to find the showLevel block regardless of minor whitespace differences
pattern = r'({\s*showLevel\s*&&\s*\(\s*<>\s*<span>\{ev\.level\}\s*</span>\s*<span\s+className="w-1\s+h-1\s+bg-gray-300\s+rounded-full"></span>\s*</>\s*\)\s*})'

insertion = """
                                    {ev.evidenceDate && (
                                      <>
                                        <span className="text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                                          <i className="far fa-calendar-alt"></i>
                                          {ev.evidenceDate}
                                        </span>
                                        <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                                      </>
                                    )}"""

if re.search(pattern, content):
    new_content = re.sub(pattern, r'\1' + insertion, content)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print("Successfully updated AdminDashboard.tsx using Regex")
else:
    print("Regex pattern not found in AdminDashboard.tsx")
