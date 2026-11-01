// app/api/[...path]/route.ts
//
// Một handler cho mọi route BFF chỉ chuyển tiếp sang backend. Đường dẫn nào
// chuyển tiếp được khai báo trong server/route-map.ts.
//
// Next.js ưu tiên route cụ thể hơn catch-all, nên route cần biến đổi dữ liệu
// (upload, stream, reshape response) vẫn giữ file riêng và vẫn thắng file này.
// Đường dẫn không có trong bảng và cũng không có file riêng sẽ nhận 404 kèm
// thông báo rõ ràng, thay vì 404 trắng của Next.

import { bffProxy } from "@/server/bff";

export const GET = bffProxy;
export const POST = bffProxy;
export const PUT = bffProxy;
export const PATCH = bffProxy;
export const DELETE = bffProxy;
