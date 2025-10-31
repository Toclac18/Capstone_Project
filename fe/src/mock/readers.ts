// src/mock/readers.ts

export type MockReader = {
  id: string;
  fullName: string;
  username: string;
  email: string;
  status: "ACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  coinBalance: number;
};

export const mockReaders: MockReader[] = [
  {
    id: "6b1f9d2a-21b0-4d01-8f7a-d3a3d9b9b111",
    fullName: "Alice Nguyen",
    username: "alice",
    email: "alice@example.com",
    status: "ACTIVE",
    coinBalance: 120,
  },
  {
    id: "f8fd1b1c-7a6c-4b11-9f0a-6f1310a0c222",
    fullName: "Bob Tran",
    username: "bob",
    email: "bob@example.com",
    status: "SUSPENDED",
    coinBalance: 5,
  },
  {
    id: "7d9018dc-a86f-4a60-9001-70ac70d33aa3",
    fullName: "Charlie Le",
    username: "charlie",
    email: "charlie@example.com",
    status: "ACTIVE",
    coinBalance: 80,
  },
];

// Đổi trạng thái truy cập: enable=true => ACTIVE, enable=false => SUSPENDED
export function mockChangeReaderAccess(userId: string, enable: boolean) {
  const r = mockReaders.find((x) => x.id === userId);
  if (!r) {
    return { success: false, message: `User ${userId} not found (mock)` };
  }
  r.status = enable ? "ACTIVE" : "SUSPENDED";
  return {
    success: true,
  };
}
