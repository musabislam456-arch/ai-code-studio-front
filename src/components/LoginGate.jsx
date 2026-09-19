import React,{useEffect,useState} from "react";
import {api,getAccessToken,setAccessToken} from "../lib/api";

export default function LoginGate({children}){
 const [loading,setLoading]=useState(true);
 const [mode,setMode]=useState("signin");
 const [name,setName]=useState("");
 const [email,setEmail]=useState("");
 const [password,setPassword]=useState("");
 const [error,setError]=useState("");
 useEffect(()=>{
   const run=async()=>{
     try{
       if(location.pathname==="/auth/callback"){
         const code=new URLSearchParams(location.search).get("code");
         if(!code) throw new Error("Google login code missing.");
         const r=await api.googleExchange(code); setAccessToken(r.token);
         history.replaceState({}, "", "/"); location.reload(); return;
       }
       if(getAccessToken()){ await api.me(); }
     }catch(err){ setAccessToken(""); }
     finally{ setLoading(false); }
   };
   run();
 },[]);
 if(loading) return <div className="login-gate"><div className="login-card"><p>Loading…</p></div></div>;
 if(getAccessToken()) return children;

 const submit=async()=>{
   setError("");
   try{
     const r=mode==="signup" ? await api.signUp({name,email,password}) : await api.signIn({email,password});
     setAccessToken(r.token); location.reload();
   }catch(err){setError(err.message);}
 };
 return <div className="login-gate">
   <div className="login-card auth-card">
     <div className="auth-brand"><span className="brand-dot"/> AI Code Studio</div>
     <h2>{mode==="signup"?"Create your account":"Welcome back"}</h2>
     <p>{mode==="signup"?"Apna account banayein aur projects save karein.":"Sign in karke apne projects continue karein."}</p>
     {mode==="signup" && <input value={name} onChange={e=>setName(e.target.value)} placeholder="Name"/>}
     <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" type="email"/>
     <input value={password} onChange={e=>setPassword(e.target.value)} placeholder="Password (8+ characters)" type="password" onKeyDown={e=>e.key==="Enter"&&submit()}/>
     {error&&<div className="auth-error">{error}</div>}
     <button onClick={submit}>{mode==="signup"?"Create account":"Sign in"}</button>
     <div className="auth-divider"><span>or</span></div>
     <a className="google-btn" href={api.googleAuthUrl()}>Continue with Google</a>
     <button className="auth-switch" onClick={()=>{setMode(mode==="signup"?"signin":"signup");setError("")}}>
       {mode==="signup"?"Already have an account? Sign in":"Create a new account"}
     </button>
   </div>
 </div>;
}
