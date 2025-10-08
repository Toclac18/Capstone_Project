'use client';
import { useEffect, useState } from 'react';
export default function Dashboard(){
  const [msg,setMsg]=useState('Loading...');
  useEffect(()=>{
    const token=document.cookie.split('; ').find(x=>x.startsWith('access_token='))?.split('=')[1];
    if(!token){setMsg('No token, please login.');return;}
    fetch(process.env.NEXT_PUBLIC_API_BASE + '/api/hello', { headers: { Authorization: `Bearer ${token}` } })
      .then(async r=>setMsg(await r.text())).catch(e=>setMsg(e.message));
  },[]);
  return (
    <div style={{ padding: '32px 24px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <h2 style={{ marginTop: 0, fontSize: 28 }}>Bảng điều khiển</h2>
        <p style={{ color: '#475569' }}>Trạng thái hệ thống và tiến độ học tập của bạn.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16, marginTop: 16 }}>
          {[
            { k: 'Tiến độ Tài liệu', v: '75%' },
            { k: 'Bài tập đã nộp', v: '42' },
            { k: 'Chuỗi ngày học', v: '12 ngày' }
          ].map(card => (
            <div key={card.k} style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20 }}>
              <div style={{ color: '#475569' }}>{card.k}</div>
              <div style={{ fontSize: 28, fontWeight: 800 }}>{card.v}</div>
            </div>
          ))}
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 20, marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>Tin nhắn máy chủ</h3>
          <p style={{ color: '#0f172a' }}>{msg}</p>
        </div>
      </div>
    </div>
  );
}