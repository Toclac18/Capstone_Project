'use client';
import { useEffect } from 'react';
export default function OAuthCallback({ searchParams }: { searchParams: { token?: string } }){
  useEffect(()=>{
    if(searchParams?.token){
      document.cookie=`access_token=${searchParams.token}; path=/; max-age=${60*60*24};`;
      window.location.href='/dashboard';
    }else{ window.location.href='/login'; }
  },[searchParams]);
  return <main>Processing OAuth2 callback...</main>;
}