export const mockUsers = [
  {
    id: 1,
    email: "user@example.com",
    password: "password123", // In a real app this would be hashed, we just do a string match here
    name: "Regular User",
    role: "user"
  },
  {
    id: 2,
    email: "admin@example.com",
    password: "adminpass",
    name: "Admin User",
    role: "admin"
  }
];
