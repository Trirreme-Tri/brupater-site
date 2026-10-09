import type { Metadata } from "next";
import "@/styles/apresentacao.css";
import { Apresentacao } from "@/components/apresentacao/Apresentacao";

export const metadata: Metadata = { title: { absolute: "Seu site, Bru" }, robots: { index: false, follow: false } };

export default function Page() {
  return <Apresentacao />;
}
