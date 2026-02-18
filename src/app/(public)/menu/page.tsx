import { redirect } from "next/navigation";
import { DEFAULT_TENANT } from "@/lib/tenants";

export default function MenuIndex() {
  redirect(`/menu/${DEFAULT_TENANT}`);
}
