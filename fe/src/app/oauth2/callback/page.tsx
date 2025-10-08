'use client';
import { useEffect } from 'react';
export default function OAuthCallback({ searchParams }: { searchParams: { token?: string } }){
  useEffect(()=>{
    if(searchParams?.token){
      document.cookie=`access_token=${searchParams.token}; path=/; max-age=${60*60*24};`;
      window.location.href='/dashboard';
    }else{ window.location.href='/login'; }
  },[searchParams]);
  return (
    <div style={{ padding: '48px 24px' }}>
      <div style={{ maxWidth: 640, margin: '0 auto', background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
        <h3 style={{ marginTop: 0 }}>Đang xử lý xác thực OAuth2...</h3>
        <p style={{ color: '#475569' }}>Vui lòng đợi trong giây lát.</p>
      </div>
    </div>
  );
}