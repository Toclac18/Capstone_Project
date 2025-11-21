# guideline.md

> **Mục tiêu:** Chuẩn hoá cách code FE (Next.js App Router) để:
>
> - Dùng **service layer** thống nhất.
> - Có thể **mock** hoàn toàn (không cần BE) _hoặc_ **gọi BE thật** chỉ bằng 1 biến môi trường.
> - Bảo đảm **middleware + JWT** hoạt động nhất quán.
> - Dễ **nhân rộng** cho các module mới (user, order, …).

1. Kiến trúc tổng quan
   Next.js (App Router)
   │
   ├─ Middleware (JWT guard) ← đọc cookie httpOnly, chặn /api & pages
   │
   ├─ API Route (BFF) ← /api/<domain> (1 endpoint chung)
   │ │
   │ ├─ USE_MOCK=true → xử lý bằng mockDB (in-memory)
   │ └─ USE_MOCK=false → proxy fetch tới BE thật (NEXT_PUBLIC_API_BASE_URL)
   │
   └─ Client UI (Pages/Components)
   └─ gọi Service (Axios baseURL=/api, withCredentials=true)

Điểm chốt:

UI không gọi trực tiếp BE → luôn gọi /api/... (BFF).

Bật/tắt mock bằng USE_MOCK (env).

Bảo mật: middleware chặn mọi route (trừ whitelist) dựa trên cookie httpOnly.

2. Cấu trúc thư mục (chuẩn hoá)
   src/
   ├─ app/
   │ ├─ api/
   │ │ ├─ <domain>/route.ts # API Route BFF cho module (ví dụ: contact-admin)
   │ │ └─ auth/
   │ │ ├─ login/route.ts # mock login: set cookie httpOnly
   │ │ └─ logout/route.ts # mock logout: xoá cookie
   │ └─ <page-module>/ # UI (components, css module…)
   │
   ├─ mock/ # Toàn bộ mock in-memory dùng chung
   │ ├─ db.ts # in-memory DB helpers
   │ └─ <domain>.ts # (tuỳ chọn) mock utils riêng cho domain
   │
   └─ services/
   ├─ http.ts # axios client (baseURL=/api)
   └─ <domain>.ts # service domain gọi /api/<domain>

3. Biến môi trường

Tạo file .env.local (không commit secrets):

# bật mock (true/false)

USE_MOCK=true

# JWT (server-only)

JWT_SECRET=CHANGE-ME-SUPER-LONG-RANDOM-SECRET
COOKIE_NAME=access_token

# BE base cho proxy (khi USE_MOCK=false)

NEXT_PUBLIC_API_BASE_URL=http://localhost:8080

# FE axios base

NEXT_PUBLIC_API_URL=/api
NEXT_PUBLIC_API_TIMEOUT=10000

# CSP tham chiếu

NEXT_PUBLIC_FE_DOMAIN=http://localhost:3000

🔁 Mỗi khi sửa env → restart npm run dev.

4. Middleware (JWT guard)

Whitelist page công khai (/, /auth/sign-in, /auth/sign-up)

Whitelist API công khai (/api/auth, /api/health)

Chặn các route còn lại nếu không có cookie hợp lệ.

Đảm bảo chỉ verify ở middleware; không verify lại trong API Route (tránh lệch).

5. Service Layer (axios)

src/services/http.ts:

import axios from "axios";

const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL?.trim() || "/api").replace(/\/+$/, "");
const API_TIMEOUT = parseInt(process.env.NEXT_PUBLIC_API_TIMEOUT || "10000", 10);

export const apiClient = axios.create({
baseURL: API_BASE_URL, // -> /api
timeout: API_TIMEOUT,
headers: { "Content-Type": "application/json" },
withCredentials: true, // gửi cookie httpOnly
});

apiClient.interceptors.response.use(
(res) => res,
(err) => {
const msg =
err?.response?.data?.error ||
err?.response?.data?.message ||
err?.message ||
"Request error";
return Promise.reject(new Error(msg));
}
);

Tất cả services import apiClient và chỉ gọi /api/<domain>.

6. API Route (BFF) – mẫu dùng chung

src/app/api/<domain>/route.ts:

import { headers } from "next/headers";
import { mockDB } from "@/mock/db"; // hoặc mock riêng theo domain

const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

// Ví dụ: GET list (mock-only)
export async function GET() {
if (USE_MOCK) {
const items = mockDB.list("<domain>");
return Response.json({ items, total: items.length }, { status: 200 });
}
return Response.json({ error: "Method not allowed" }, { status: 405 });
}

// Ví dụ: POST create (mock OR proxy)
export async function POST(req: Request) {
const body = await req.json().catch(() => null);
if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

if (USE_MOCK) {
const record = mockDB.insert("<domain>", body);
return Response.json(record, { status: 201 });
}

// Proxy BE thật
const upstream = await fetch(`${BE_BASE}/<be-path>`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(body),
cache: "no-store",
});

const text = await upstream.text();
const contentType = upstream.headers.get("content-type") ?? "application/json";
return new Response(text, { status: upstream.status, headers: { "content-type": contentType } });
}

💡 mockDB có thể lưu theo namespace (domain) để không lẫn dữ liệu giữa các module.

7. Mock DB – chuẩn hoá

src/mock/db.ts:

type Table = Record<string, any>; // tuỳ module
type Store = Record<string, Table[]>; // by namespace

const store: Store = {};

function table(ns: string): Table[] {
if (!store[ns]) store[ns] = [];
return store[ns];
}

function randomCode(n = 5) {
const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
return Array.from({ length: n }).map(() => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export const mockDB = {
list(ns: string) {
return table(ns).slice().reverse();
},
insert(ns: string, payload: any) {
const id = crypto.randomUUID();
const now = new Date();
const ymd = `${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}`;
const code = `${ns.toUpperCase().replace(/[^A-Z0-9]/g,"") || "REC"}-${ymd}-${randomCode(5)}`;

    const row = {
      id,
      code,
      createdAt: now.toISOString(),
      payload,
      status: "OPEN",
    };
    table(ns).push(row);
    return row;

},
clear(ns?: string) {
if (ns) { store[ns] = []; return; }
Object.keys(store).forEach((k) => (store[k] = []));
},
};

✅ Dùng chung cho mọi module bằng namespace (vd: "contact-admin", "orders").

8. Ví dụ triển khai module Contact Admin
   8.1 Service domain

src/services/contact-admin.ts:

import { apiClient } from "./http";

export type ContactAdminPayload = {
name: string;
email: string;
category: "PAYMENT" | "ACCESS" | "CONTENT" | "TECHNICAL" | "ACCOUNT" | "OTHER";
otherCategory?: string;
urgency: "LOW" | "MEDIUM" | "HIGH";
subject: string;
message: string;
};

export type ContactAdminResponse = {
ticketId?: string; // khi BE
ticketCode?: string;
status: string;
message?: string;
// mock fields:
id?: string;
code?: string;
createdAt?: string;
};

export async function submitTicket(data: ContactAdminPayload): Promise<ContactAdminResponse> {
// (tuỳ chọn) chuẩn hoá OTHER
if (data.category === "OTHER" && data.otherCategory) {
data = { ...data, subject: `[OTHER: ${data.otherCategory}] ${data.subject}` };
}
const res = await apiClient.post<ContactAdminResponse>("/contact-admin", data);
return res.data;
}

export async function listTickets(): Promise<any> {
const res = await apiClient.get("/contact-admin");
return res.data;
}

8.2 API Route BFF (đã tối ưu cho mock/BE thật)

src/app/api/contact-admin/route.ts:

import { headers } from "next/headers";
import { mockDB } from "@/mock/db";

const USE_MOCK = process.env.USE_MOCK === "true";
const BE_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export async function GET() {
if (USE_MOCK) {
const items = mockDB.list("contact-admin");
return Response.json({ items, total: items.length }, { status: 200 });
}
return Response.json({ error: "Method not allowed" }, { status: 405 });
}

export async function POST(req: Request) {
const body = await req.json().catch(() => null);
if (!body) return Response.json({ error: "Invalid JSON" }, { status: 400 });

if (USE_MOCK) {
const ip = headers().get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
const row = mockDB.insert("contact-admin", body);
return Response.json(
{
ticketId: row.id,
ticketCode: row.code,
status: row.status,
message: "Your message has been received. (mock)",
meta: { ip, createdAt: row.createdAt },
},
{ status: 201 }
);
}

const upstream = await fetch(`${BE_BASE}/contact-admin`, {
method: "POST",
headers: { "Content-Type": "application/json" },
body: JSON.stringify(body),
cache: "no-store",
});
const text = await upstream.text();
const contentType = upstream.headers.get("content-type") ?? "application/json";
return new Response(text, { status: upstream.status, headers: { "content-type": contentType } });
}

9. Thêm module mới (ví dụ: orders)

Tạo service: src/services/orders.ts

Tạo API Route: src/app/api/orders/route.ts (copy mẫu ở trên; dùng mockDB.list("orders"), mockDB.insert("orders", payload))

UI gọi ordersService.createOrder() → /api/orders

Không cần chỉnh middleware/axios.

10. Test nhanh (cả UI lẫn curl)
    Login (đặt cookie httpOnly)
    curl -i -c cookies.txt \
     -H "Content-Type: application/json" \
     -d '{"userId":"u100","email":"qa@example.com","name":"QA"}' \
     -X POST http://localhost:3000/api/auth/login

Submit ticket (mock hoặc BE thật tuỳ USE_MOCK)
curl -i -b cookies.txt \
 -H "Content-Type: application/json" \
 -d '{
"name":"QA",
"email":"qa@example.com",
"category":"OTHER",
"otherCategory":"Partnership",
"urgency":"HIGH",
"subject":"Need to contact admin",
"message":"We would like to discuss a partnership opportunity."
}' \
 -X POST http://localhost:3000/api/contact-admin

List mock tickets
curl -i -b cookies.txt http://localhost:3000/api/contact-admin

11. Troubleshooting

401 khi submit từ UI:

Chưa login mock trong trình duyệt (cookie từ curl không dùng được cho browser).

Dùng host khác nhau (127.0.0.1 vs localhost).

Middleware chưa whitelist /api/auth.

404 /api/contact-admin:

Thiếu file src/app/api/contact-admin/route.ts.

Đổi env nhưng chưa restart server.

CSP chặn:

Thêm domain vào connect-src, img-src trong next.config.ts.

12. Security notes

JWT_SECRET: chỉ dùng process.env.JWT_SECRET (server-only). Không dùng NEXT_PUBLIC_JWT_SECRET.

Cookie httpOnly + SameSite=Lax; Secure khi production.

Middleware là “single source of truth” để verify. Tránh verify lần 2 ở API Route.

BFF /api/\* giúp không lộ BE & dễ thêm rate-limit/log/biến đổi dữ liệu.

13. Checklist khi chuyển sang BE thật

.env.local:

USE_MOCK=false
NEXT_PUBLIC_API_BASE_URL=https://be.your-domain.com

Không đổi UI/Service.

Kiểm thử lại bằng curl/UI (201 từ BE).

Bật secure: true khi set cookie trong production.
