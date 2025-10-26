import { apiClient } from "./http";

export type ContactAdminResponse = {
  ticketId: string;
  ticketCode: string;
  status: string;
  message: string;
};

export type ContactAdminPayload = {
  name: string;
  email: string;
  category:
    | "PAYMENT"
    | "ACCESS"
    | "CONTENT"
    | "TECHNICAL"
    | "ACCOUNT"
    | "OTHER";
  otherCategory?: string; // text bổ sung khi chọn OTHER
  urgency: "LOW" | "MEDIUM" | "HIGH";
  subject: string;
  message: string;
};

/**
 * Gửi ticket tới BE qua Next API (/api/contact-admin).
 * Giữ category đúng enum; nếu OTHER, nhét detail vào subject (tương thích enum BE).
 */
export async function submitTicket(
  payload: ContactAdminPayload,
): Promise<ContactAdminResponse> {
  const body = { ...payload };

  if (payload.category === "OTHER" && payload.otherCategory) {
    body.subject = `[OTHER: ${payload.otherCategory}] ${payload.subject}`;
  }

  const res = await apiClient.post<ContactAdminResponse>(
    "/contact-admin", // -> /api/contact-admin (middleware → API Route → BE)
    body,
  );
  return res.data;
}
