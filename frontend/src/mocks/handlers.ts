import { http, HttpResponse, delay } from 'msw';
import { mockUsers } from './data/users';
import { mockStudents, updateMockStudent } from './data/students';
import { mockFaces, updateMockFaces } from './data/faces';
import { CriterionType, StudentProfile, FeaturedFace } from '../types';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const apiUrl = (path: string) => `${baseURL}${path}`;

// --- Utils ---
const getAuthUserId = (request: Request): string | null => {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '').trim();
  try {
    // authService generates base64-encoded JWT: header.encodedPayload.signature
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    // Check expiry if present
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload.id || payload.sub || null;
  } catch {
    return null;
  }
};

const getStudentProfileByUserId = (userId: string) => {
  const user = mockUsers.find(u => u.id.toString() === userId);
  if (!user || user.role !== 'student') return null;
  
  // Logic: In a real app we'd query by user_account_id. Here we emulate it.
  // For SV001, we know it's a specific user in mockUsers if we structured it that way.
  // Let's just find the student by matching an ID rule, or fallback to the first student for demo.
  // Since we don't have a direct link in mock data yet, we'll try to match user.email with studentId or just return a default.
  // Actually, we'll assume user.id maps to the SV record. SV001 -> user 1?
  
  // To make it simple: if role is student, we find the student record.
  // We'll just return the first student for now or SV001. We should ideally link them.
  // Let's assume user.id = 1 is SV001. user.id = 'SVNEW' etc.
  
  // For now let's use a naive matching based on student id if available, else SV001
  return mockStudents[0]; 
};

export const handlers = [
  // ============================================
  // AUTHENTICATION (Same as before)
  // ============================================
  http.post(apiUrl('/api/token/'), async ({ request }) => {
    await delay(300);
    const body = await request.json() as any;
    const { email, password } = body;
    const user = mockUsers.find(u => u.email === email && u.password === password);

    if (user) {
      if (user.role === 'student') {
         // Also fetch their string ID, let's say we map the email to SV001, SV002, etc
         // or we just inject it in the mockUsers.
      }
      return HttpResponse.json({
        access: `mock.access.token.${user.id}.${Date.now()}`,
        refresh: `mock.refresh.token.${user.id}.${Date.now()}`,
        user: { id: user.id, email: user.email, name: user.name, role: user.role }
      });
    }
    return new HttpResponse(JSON.stringify({ detail: 'No active account found with the given credentials' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
  }),

  // ============================================
  // PUBLIC API
  // ============================================
  http.get(apiUrl('/api/public/faces/'), async () => {
    await delay(300);
    return HttpResponse.json(mockFaces);
  }),

  // ============================================
  // STUDENT API
  // ============================================
  
  // Get My Profile
  http.get(apiUrl('/api/profiles/me/'), async ({ request }) => {
    await delay(400);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    // In a real app we lookup by userId. For this mock, we just use a header passed specifically for mocking 
    // or just return the active student ID requested via query param `?studentId=` for testing flexibility
    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';
    
    let student = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    
    // If not found, it's a new student login. Generate a dedicated mock profile.
    if (!student) {
      const template = mockStudents.find(s => s.id === 'SVNEW') || mockStudents[0];
      student = {
        ...template,
        id: `SV_${mockStudentId}`,
        studentId: mockStudentId,
        fullName: `Tài khoản mới (${mockStudentId})`,
        evidences: { 
          [CriterionType.ETHICS]: [], 
          [CriterionType.ACADEMIC]: [], 
          [CriterionType.PHYSICAL]: [], 
          [CriterionType.VOLUNTEER]: [], 
          [CriterionType.INTEGRATION]: [] 
        },
        verifications: JSON.parse(JSON.stringify(template.verifications))
      };
      mockStudents.push(student);
    }
    
    return HttpResponse.json(student);
  }),

  // Update Profile fields (GPA, PE, etc)
  http.put(apiUrl('/api/profiles/me/'), async ({ request }) => {
    await delay(100); // reduced delay to prevent UI race condition
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });
    
    const updateData = await request.json() as Partial<StudentProfile>;

    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';
    let currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    
    if (!currentStudent) {
       return new HttpResponse(JSON.stringify({ detail: 'Student not found in mock DB.' }), { status: 404 });
    }
    
    const updated = { ...currentStudent, ...updateData };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Add Evidence
  http.post(apiUrl('/api/profiles/me/evidences/'), async ({ request }) => {
    await delay(200);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';
    const { type, evidence } = await request.json() as { type: CriterionType, evidence: any };
    
    const currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });
    
    const newEvidenceList = [...(currentStudent.evidences[type] || []), { ...evidence, status: 'Pending' }];
    
    const updated = { 
      ...currentStudent, 
      evidences: { ...currentStudent.evidences, [type]: newEvidenceList } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Remove Evidence
  http.delete(apiUrl('/api/profiles/me/evidences/:guid'), async ({ request, params }) => {
    await delay(300);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    const { guid } = params;
    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';
    const type = url.searchParams.get('type') as CriterionType;

    const currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });
    const newEvidenceList = currentStudent.evidences[type].filter(ev => ev.id !== guid);
    
    const updated = { 
      ...currentStudent, 
      evidences: { ...currentStudent.evidences, [type]: newEvidenceList } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Explain Evidence
  http.put(apiUrl('/api/profiles/me/evidences/:guid/explain'), async ({ request, params }) => {
    await delay(400);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    const { guid } = params;
    const { type, explanation } = await request.json() as { type: CriterionType, explanation: string };
    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';

    const currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });
    
    const newEvidenceList = currentStudent.evidences[type].map(ev => ev.id === guid ? { ...ev, studentExplanation: explanation } : ev);
    
    const updated = { 
      ...currentStudent, 
      evidences: { ...currentStudent.evidences, [type]: newEvidenceList } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Explain Field
  http.put(apiUrl('/api/profiles/me/fields/:key/explain'), async ({ request, params }) => {
    await delay(400);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    const { key } = params;
    const { explanation } = await request.json() as { explanation: string };
    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';

    const currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });
    
    const updated = { 
      ...currentStudent, 
      verifications: { 
        ...currentStudent.verifications, 
        [key as string]: { ...currentStudent.verifications[key as keyof StudentProfile['verifications']], feedback: explanation }
      } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Submit Profile
  http.post(apiUrl('/api/profiles/me/submit/'), async ({ request }) => {
    await delay(600);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });

    const url = new URL(request.url);
    const mockStudentId = url.searchParams.get('studentId') || 'SV001';
    const currentStudent = mockStudents.find(s => s.studentId === mockStudentId) || mockStudents.find(s => s.id === mockStudentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });

    const updated = { ...currentStudent, status: 'Submitted' as const };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // ============================================
  // ADMIN API
  // ============================================

  // List all profiles
  http.get(apiUrl('/api/admin/profiles/'), async ({ request }) => {
    await delay(500);
    const userId = getAuthUserId(request);
    if (!userId) return new HttpResponse(null, { status: 401 });
    // In real app, check role "admin"
    
    return HttpResponse.json(mockStudents);
  }),

  // Update profile overall status
  http.put(apiUrl('/api/admin/profiles/:id/status/'), async ({ request, params }) => {
    await delay(400);
    const { id } = params;
    const { status, feedback } = await request.json() as { status: StudentProfile['status'], feedback?: string };
    
    const currentStudent = mockStudents.find(s => s.id === id);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });

    const updated = { ...currentStudent, status, feedback: feedback || currentStudent.feedback };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Update specific evidence status
  http.put(apiUrl('/api/admin/profiles/:studentId/evidences/:evidenceId/status/'), async ({ request, params }) => {
    await delay(400);
    const { studentId, evidenceId } = params;
    const { type, status, feedback } = await request.json() as { type: CriterionType, status: any, feedback?: string };
    
    const currentStudent = mockStudents.find(s => s.id === studentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });

    const newEvidenceList = currentStudent.evidences[type].map(ev => 
      ev.id === evidenceId ? { ...ev, status, adminFeedback: feedback } : ev
    );

    const updated = { 
      ...currentStudent, 
      evidences: { ...currentStudent.evidences, [type]: newEvidenceList } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Update specific field verification status
  http.put(apiUrl('/api/admin/profiles/:studentId/fields/:fieldId/status/'), async ({ request, params }) => {
    await delay(400);
    const { studentId, fieldId } = params;
    const { status, feedback } = await request.json() as { status: any, feedback?: string };
    
    const currentStudent = mockStudents.find(s => s.id === studentId);
    if (!currentStudent) return new HttpResponse(null, { status: 404 });

    const key = fieldId as keyof StudentProfile['verifications'];
    const updated = { 
      ...currentStudent, 
      verifications: { 
        ...currentStudent.verifications, 
        [key]: { status, feedback }
      } 
    };
    updateMockStudent(updated);

    return HttpResponse.json(updated);
  }),

  // Update faces
  http.put(apiUrl('/api/admin/faces/'), async ({ request }) => {
    await delay(500);
    const newFaces = await request.json() as FeaturedFace[];
    updateMockFaces(newFaces);
    return HttpResponse.json(mockFaces);
  })
];
