'use client';
import { useState } from 'react';
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setMessage(null);
    try {
      const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + '/api/auth/login', {
        method: 'POST', headers: {'Content-Type':'application/json'},
        body: JSON.stringify({ email, password })
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      document.cookie = `access_token=${data.accessToken}; path=/; max-age=${Math.floor(data.expiresInMs/1000)};`;
      window.location.href = '/dashboard';
    } catch (err:any) { setMessage(err.message); }
  };
  const loginWithGoogle = () => {
    window.location.href = process.env.NEXT_PUBLIC_API_BASE + '/oauth2/authorization/google';
  };
  return (
    <div style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 420, margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
        <h2 style={{ marginTop: 0, fontSize: 28 }}>Đăng nhập</h2>
        <p style={{ color: '#475569', marginTop: 4 }}>Truy cập Tài liệu và bảng điều khiển của bạn.</p>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Email</label>
            <input value={email} onChange={e=>setEmail(e.target.value)} required placeholder='you@example.com' style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10 }} />
          </div>
          <div>
            <label style={{ display: 'block', fontWeight: 600, marginBottom: 6 }}>Mật khẩu</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required placeholder='••••••••' style={{ width: '100%', padding: '10px 12px', border: '1px solid #cbd5e1', borderRadius: 10 }} />
          </div>
          <button type="submit" style={{ background: '#2563eb', color: '#ffffff', padding: '12px 16px', borderRadius: 10, border: 0, fontWeight: 700 }}>Đăng nhập</button>
        </form>
        <div style={{ height: 1, background: '#e2e8f0', margin: '16px 0' }} />
        <button onClick={loginWithGoogle} style={{ width: '100%', background: '#111827', color: '#ffffff', padding: '12px 16px', borderRadius: 10, border: 0, fontWeight: 700 }}>Đăng nhập với Google</button>
        {message && <p style={{ color: 'red', marginTop: 12 }}>{message}</p>}
      </div>
    </div>
  );
}