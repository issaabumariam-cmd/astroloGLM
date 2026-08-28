import { redirect } from "next/navigation";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export default async function AdvisorRedirect() {
  const h = await headers();
  // Force no-cache on this route so mobile browsers always get the redirect
  redirect("/jehana");
}