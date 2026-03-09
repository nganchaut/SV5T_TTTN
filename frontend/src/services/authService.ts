// MOCK JWT Implementation for Frontend testing
export interface UserPayload {
  id: string;
  studentId?: string;
  role: 'student' | 'admin';
  fullName?: string;
}

export interface AuthResponse {
  token: string;
  user: UserPayload;
}

// Giả lập database users
const MOCK_DB_KEY = 'sv5t_mock_users';

const getMockUsers = (): Record<string, any> => {
  const data = localStorage.getItem(MOCK_DB_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      return {};
    }
  }
  // Data khởi tạo
  return {
    'admin': { password: 'admin', role: 'admin', id: 'admin_id' },
    '20123456': { password: 'password', role: 'student', id: 'SV001', studentId: '20123456', fullName: 'Lê Thanh Bình' }
  };
};

const saveMockUsers = (users: Record<string, any>) => {
  localStorage.setItem(MOCK_DB_KEY, JSON.stringify(users));
};

// Khởi tạo data nếu chưa có
if (!localStorage.getItem(MOCK_DB_KEY)) {
  saveMockUsers(getMockUsers());
}

const generateMockJWT = (payload: UserPayload): string => {
  // Chuẩn JWT giả lập: header.payload.signature
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const encodedPayload = btoa(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) })); // Hết hạn 1 ngày
  return `${header}.${encodedPayload}.mock_signature_for_testing_only`;
};

export const decodeJWT = (token: string): UserPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(atob(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }
    return payload as UserPayload;
  } catch {
    return null;
  }
};

export const authService = {
  login: async (identifier: string, password: string, role: 'student' | 'admin'): Promise<AuthResponse> => {
    // Giả lập network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const users = getMockUsers();
    const user = users[identifier];

    if (!user || user.password !== password || user.role !== role) {
      throw new Error('Tài khoản hoặc mật khẩu không đúng!');
    }

    const payload: UserPayload = {
      id: user.id,
      studentId: user.studentId,
      role: user.role,
      fullName: user.fullName
    };

    const token = generateMockJWT(payload);
    
    // Lưu session
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));

    return { token, user: payload };
  },

  register: async (identifier: string, password: string, fullName: string, role: 'student' | 'admin' = 'student'): Promise<AuthResponse> => {
    await new Promise(resolve => setTimeout(resolve, 600));

    const users = getMockUsers();
    
    if (users[identifier]) {
      throw new Error('Tài khoản này đã được đăng ký!');
    }

    const newId = role === 'admin' ? `AD_${Date.now()}` : `SV_${Date.now()}`;
    users[identifier] = {
      id: newId,
      studentId: role === 'student' ? identifier : undefined,
      password: password,
      role: role,
      fullName: fullName
    };

    saveMockUsers(users);

    const payload: UserPayload = {
      id: newId,
      studentId: role === 'student' ? identifier : undefined,
      role: role,
      fullName: fullName
    };

    const token = generateMockJWT(payload);
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(payload));

    return { token, user: payload };
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: (): UserPayload | null => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return null;
    
    const tokenPayload = decodeJWT(token);
    if (!tokenPayload) {
      // Token expired or invalid
      authService.logout();
      return null;
    }

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  }
};
