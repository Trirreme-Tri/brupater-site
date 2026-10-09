/* Projetos (coleções): só a capa na página inicial; o projeto inteiro em /projeto?p=<id> */
import type { Obra, Projeto, Site } from "./conteudo/tipos";
import { img } from "./util";

export function projetosVisiveis(site: Site): Projeto[] {
  return (site.projetos || []).filter((p) => p.visivel !== false && p.id && img(p.capa));
}
/** largura/altura e versão menor da imagem, se ela também estiver na galeria */
export function daGaleria(site: Site, u: string): Partial<Obra> {
  return site.galeria.filter((o) => o.img === u)[0] || {};
}
export function linkProjeto(p: Projeto): string {
  return "/projeto?p=" + encodeURIComponent(p.id);
}
export function qtdImagens(p: Projeto): string {
  const n = (p.imagens || []).filter((i) => img(i.img)).length;
  return n + (n === 1 ? " imagem" : " imagens");
}
