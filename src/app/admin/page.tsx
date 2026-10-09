import type { Metadata } from "next";
import "@/styles/admin.css";
import { Painel } from "@/components/painel/Painel";

export const metadata: Metadata = { title: { absolute: "Painel da Bru" }, robots: { index: false, follow: false } };

export default function Page() {
  return <Painel />;
}
