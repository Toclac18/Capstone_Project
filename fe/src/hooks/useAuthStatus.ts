import { COOKIE_NAME } from "@/server/config";
import { decodeJwtPayload } from "@/utils/jwt";
import { cookies } from "next/headers";
import { useEffect, useState } from "react";

export function useAuthStatus() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    let alive = true;

    const load = async () => {
      try {
        const res = await checkUserStatus();
        const json = await res.json();
        if (alive) setIsAuthenticated(json?.isAuthenticated ?? false);
      } catch {
        if (alive) setIsAuthenticated(false);
      }
    };

    load();
    return () => {
      alive = false;
    };
  }, []);

  return isAuthenticated;
}

async function checkUserStatus() {
  const cookieStore = await cookies();
  const rawToken = cookieStore.get(COOKIE_NAME)?.value;

  // 1. Không tìm thấy token trong cookie -> Chưa đăng nhập
  if (!rawToken) {
    return Response.json({ isAuthenticated: false }, { status: 200 });
  }

  try {
    // Decode payload (decode không verify signature + check exp ở tầng client-proxy)
    const payload = decodeJwtPayload(rawToken);

    // 2. Token rác không decode được -> Chưa đăng nhập
    if (!payload) {
      return Response.json({ isAuthenticated: false }, { status: 200 });
    }

    // 3. Kiểm tra Token hết hạn
    // Trường 'exp' trong JWT là Unix timestamp (tính bằng giây)
    if (payload.exp) {
      const nowInSeconds = Math.floor(Date.now() / 1000);
      if (payload.exp < nowInSeconds) {
        // Token đã hết hạn -> Coi như chưa đăng nhập
        return Response.json({ isAuthenticated: false }, { status: 200 });
      }
    }

    // 4. Token tồn tại và còn hạn -> Đã đăng nhập
    return Response.json({ isAuthenticated: true }, { status: 200 });
  } catch (error) {
    // Bất kỳ lỗi nào trong quá trình xử lý -> Mặc định là chưa đăng nhập để an toàn
    return Response.json({ isAuthenticated: false }, { status: 200 });
  }
}
