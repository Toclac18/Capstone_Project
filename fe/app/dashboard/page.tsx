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
  return <main><h2>Dashboard</h2><p>{msg}</p></main>;
}