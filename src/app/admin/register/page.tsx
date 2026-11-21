"use client";
import { FormEvent,useState } from "react";
import Link from "next/link";
import { m,useReducedMotion } from "framer-motion";
import { ArrowUpRight,UserPlus } from "lucide-react";
import { MotionButton } from "@/components/motion-button";
export default function AdminRegisterPage(){
 const reduceMotion=useReducedMotion();
 const [fullName,setFullName]=useState(""),[email,setEmail]=useState(""),[username,setUsername]=useState(""),[password,setPassword]=useState(""),[confirm,setConfirm]=useState("");
 const [error,setError]=useState(""),[message,setMessage]=useState(""),[busy,setBusy]=useState(false);
 async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setError("");setMessage("");
  if(password.length<12){setError("Use at least 12 characters for your password.");return;}
  if(password!==confirm){setError("The passwords do not match.");return;}
  setBusy(true);try{const response=await fetch("/api/admin/auth/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({fullName,email,username,password})});
   const result=await response.json();if(!response.ok){setError(result.error||"Registration could not be submitted.");return;}
   setMessage(result.message||"Registration submitted for Owner approval.");setPassword("");setConfirm("");
  }catch{setError("The admin service could not be reached. Try again.");}finally{setBusy(false);}
 }
 return <main className="admin-login-page"><m.section className="admin-login-card glass-surface" initial={reduceMotion?false:{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{duration:reduceMotion?0:.3}}>
  <span className="admin-login-icon"><UserPlus size={20}/></span><span className="eyebrow">ADMIN ACCOUNT REQUEST</span><h1>Request <em>access.</em></h1>
  <p>Create an administrator account. It will remain pending until the studio Owner approves it.</p>
  <form onSubmit={submit}>
   <label htmlFor="register-full-name">FULL NAME</label><input id="register-full-name" autoComplete="name" maxLength={100} required value={fullName} onChange={e=>setFullName(e.target.value)}/>
   <label htmlFor="register-email">EMAIL ADDRESS</label><input id="register-email" type="email" autoComplete="email" maxLength={254} required value={email} onChange={e=>setEmail(e.target.value)}/>
   <label htmlFor="register-username">USERNAME</label><input id="register-username" autoComplete="username" minLength={3} maxLength={40} pattern="[A-Za-z0-9._-]+" required value={username} onChange={e=>setUsername(e.target.value)}/>
   <label htmlFor="register-password">PASSWORD (MINIMUM 12 CHARACTERS)</label><input id="register-password" type="password" autoComplete="new-password" minLength={12} maxLength={1024} required value={password} onChange={e=>setPassword(e.target.value)}/>
   <label htmlFor="register-confirm">CONFIRM PASSWORD</label><input id="register-confirm" type="password" autoComplete="new-password" required value={confirm} onChange={e=>setConfirm(e.target.value)}/>
   {error&&<p className="admin-form-message is-error" role="alert">{error}</p>}{message&&<p className="admin-form-message is-success" role="status">{message}</p>}
   <MotionButton className="btn btn-light" type="submit" disabled={busy}>{busy?"SUBMITTING…":"SUBMIT REQUEST"}{!busy&&<ArrowUpRight size={16}/>}</MotionButton>
  </form><small>Already approved? <Link href="/admin/login">Return to sign in</Link></small>
 </m.section></main>;
}