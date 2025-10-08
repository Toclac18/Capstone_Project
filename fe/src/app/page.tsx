import Link from 'next/link';
export default function Home() {
  return (
    <div>
      <section style={{
        padding: "56px 24px",
        background: "linear-gradient(180deg, #ffffff 0%, #eff6ff 100%)",
        borderBottom: "1px solid #e2e8f0"
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 32, alignItems: "center" }}>
          <div>
            <h1 style={{ fontSize: 48, lineHeight: 1.1, margin: 0 }}>
              Nền tảng học tập hiện đại cho sinh viên và giảng viên
            </h1>
            <p style={{ fontSize: 18, color: "#475569", marginTop: 16 }}>
              Khám phá Tài liệu tương tác, bài tập tự động chấm, bảng điều khiển tiến độ, và tích hợp đăng nhập an toàn.
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 24 }}>
              <Link href='/login' style={{
                background: "#2563eb",
                color: "#ffffff",
                padding: "12px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600
              }}>Bắt đầu học</Link>
              <Link href='#khoa-hoc' style={{
                background: "#e2e8f0",
                color: "#0f172a",
                padding: "12px 16px",
                borderRadius: 10,
                textDecoration: "none",
                fontWeight: 600
              }}>Xem Tài liệu</Link>
            </div>
            <div style={{ display: "flex", gap: 20, marginTop: 24, color: "#334155" }}>
              <span>✅ Bài giảng video HD</span>
              <span>✅ Bài tập tương tác</span>
              <span>✅ Theo dõi tiến độ</span>
            </div>
          </div>
          <div style={{ justifySelf: "end" }}>
            <img src='/window.svg' alt='Hero Illustration' width={520} height={360} style={{ maxWidth: "100%", height: "auto" }} />
          </div>
        </div>
      </section>

      <section id='khoa-hoc' style={{ padding: "48px 24px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <h2 style={{ fontSize: 28, margin: 0 }}>Tài liệu nổi bật</h2>
          <p style={{ color: "#475569", marginTop: 8 }}>Lộ trình học rõ ràng, nội dung cập nhật, thực hành theo dự án.</p>
          <div style={{
            marginTop: 20,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 16
          }}>
            {[
              { title: "Lập trình Web với React", desc: "Xây dựng SPA hiện đại với Next.js 15." },
              { title: "Cấu trúc dữ liệu & Giải thuật", desc: "Nắm vững nền tảng thuật toán." },
              { title: "Cơ sở dữ liệu", desc: "Thiết kế và tối ưu hoá hệ thống dữ liệu." }
            ].map((c) => (
              <div key={c.title} style={{
                background: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: 12,
                padding: 20
              }}>
                <h3 style={{ marginTop: 0 }}>{c.title}</h3>
                <p style={{ color: "#475569" }}>{c.desc}</p>
                <Link href='/login' style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none" }}>Đăng ký học</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: "24px", background: "#ffffff", borderTop: "1px solid #e2e8f0" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 16 }}>
          {[
            { k: "Người học", v: "12,500+" },
            { k: "Tài liệu", v: "120+" },
            { k: "Bài tập đã chấm", v: "340k+" }
          ].map(s => (
            <div key={s.k} style={{ background: "#f1f5f9", borderRadius: 12, padding: 20 }}>
              <div style={{ color: "#475569" }}>{s.k}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{s.v}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}