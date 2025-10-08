import Link from 'next/link';
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang='vi'>
      <head>
        <title>Readee</title>
      </head>
      <body style={{
        margin: 0,
        fontFamily: "Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"Apple Color Emoji\", \"Segoe UI Emoji\"",
        color: "#0f172a",
        backgroundColor: "#f8fafc"
      }}>
        <header style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: "#ffffff",
          borderBottom: "1px solid #e2e8f0"
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}>
            <Link href='/' style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              textDecoration: "none"
            }}>
              <img src='/globe.svg' alt='Readee' width={28} height={28} />
              <span style={{ fontWeight: 800, letterSpacing: 0.2, color: "#0f172a" }}>Readee</span>
            </Link>

            <nav style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <Link href='/' style={{ color: "#334155", textDecoration: "none" }}>Trang chủ</Link>
              <Link href='#khoa-hoc' style={{ color: "#334155", textDecoration: "none" }}>Tài liệu</Link>
              <Link href='/dashboard' style={{ color: "#334155", textDecoration: "none" }}>Bảng điều khiển</Link>
              <Link href='/login' style={{
                color: "#ffffff",
                background: "#2563eb",
                padding: "8px 14px",
                borderRadius: 8,
                textDecoration: "none"
              }}>Đăng nhập</Link>
            </nav>
          </div>
        </header>

        <main style={{ minHeight: "calc(100dvh - 160px)" }}>
          {children}
        </main>

        <footer style={{
          marginTop: 40,
          background: "#0f172a",
          color: "#e2e8f0"
        }}>
          <div style={{
            maxWidth: 1200,
            margin: "0 auto",
            padding: "32px 24px",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <img src='/globe.svg' alt='' width={24} height={24} />
                <strong>Readee</strong>
              </div>
              <div style={{ opacity: 0.8 }}>
                © {new Date().getFullYear()} Readee. All rights reserved.
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}