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
    <main>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <div><label>Email</label><br/><input value={email} onChange={e=>setEmail(e.target.value)} required/></div>
        <div><label>Password</label><br/><input type="password" value={password} onChange={e=>setPassword(e.target.value)} required/></div>
        <button type="submit">Login (JWT)</button>
      </form>
      <button onClick={loginWithGoogle} style={{marginTop:16}}>Sign in with Google (OAuth2)</button>
      {message && <p style={{color:'red'}}>{message}</p>}
    </main>
  );
}