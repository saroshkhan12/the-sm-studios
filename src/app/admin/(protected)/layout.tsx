import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_SESSION_COOKIE,
  getAdminSession,
} from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function ProtectedAdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const token = cookies().get(ADMIN_SESSION_COOKIE)?.value;
  if (!(await getAdminSession(token))) redirect("/admin/login");
  return children;
}
