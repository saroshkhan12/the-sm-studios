import { NextRequest } from "next/server";
import { listAdminAccounts, reviewAdminAccount } from "@/lib/admin-auth";
import { adminErrorResponse, adminJson, readAdminJson, requestAdminSession, requestAdminToken } from "@/lib/admin-http";
export const runtime = "nodejs";
export async function GET(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({error:"Authentication required."},401);
  try { return adminJson({accounts:await listAdminAccounts(requestAdminToken(request)||"")}); }
  catch(error){return adminErrorResponse(error,"admin account list");}
}
export async function PATCH(request: NextRequest) {
  if (!(await requestAdminSession(request))) return adminJson({error:"Authentication required."},401);
  let body:unknown;
  try { body=await readAdminJson(request,"The account review request is invalid."); }
  catch(error){return adminErrorResponse(error,"admin account review request");}
  if(!body || typeof body!=="object") return adminJson({error:"The account review request is invalid."},400);
  const v=body as {username?:unknown;decision?:unknown};
  if(typeof v.username!=="string" || (v.decision!=="approve" && v.decision!=="reject")) return adminJson({error:"Choose an account and a valid decision."},400);
  try { return adminJson({account:await reviewAdminAccount(requestAdminToken(request)||"",v.username,v.decision)}); }
  catch(error){return adminErrorResponse(error,"admin account review");}
}