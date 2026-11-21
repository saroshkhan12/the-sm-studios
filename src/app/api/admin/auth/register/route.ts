import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { registerAdmin } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson } from "@/lib/admin-http";
export const runtime = "nodejs";
const attempts = new Map<string,{count:number;resetAt:number}>();
export async function POST(request: NextRequest) {
  let body: unknown;
  try { body=await readAdminJson(request,"The registration request is invalid.",12*1024); }
  catch(error){return adminErrorResponse(error,"registration request");}
  if(!body || typeof body!=="object") return adminJson({error:"The registration request is invalid."},400);
  const v=body as {username?:unknown;fullName?:unknown;email?:unknown;password?:unknown};
  if(typeof v.username!=="string" || typeof v.fullName!=="string" || typeof v.email!=="string" || typeof v.password!=="string")
    return adminJson({error:"Complete all registration fields."},400);
  const address=request.ip || request.headers.get("x-real-ip") || "unknown";
  const key=createHash("sha256").update(address).digest("hex"), now=Date.now();
  let bucket=attempts.get(key);
  if(!bucket || bucket.resetAt<=now){\n    if(attempts.size>=5000){for(const [stored,entry] of attempts){if(entry.resetAt<=now)attempts.delete(stored);}}\n    if(attempts.size>=5000){const oldest=attempts.keys().next().value;if(oldest)attempts.delete(oldest);}\n    bucket={count:0,resetAt:now+15*60*1000};attempts.set(key,bucket);\n  }
  if(bucket.count>=5) return adminJson({error:"Too many registration attempts. Try again in 15 minutes."},429);
  bucket.count++;
  try {
    await registerAdmin({username:v.username,fullName:v.fullName,email:v.email,password:v.password});
    return adminJson({ok:true,message:"Registration received. An Owner must approve your account before you can sign in."},201);
  } catch(error){return adminErrorResponse(error,"registration");}
}