"use client";

/*
 * Encomendas: a calculadora (mesma mecânica do site da Anne: monta itens,
 * soma, aplica desconto por volume e uso comercial, e manda o resumo).
 *
 * Preço de UMA arte:
 *   base do enquadramento
 *   × (1 + personagens extras × % do personagem extra)
 *   × fator do acabamento
 *   + preço do fundo
 * Depois: × quantidade → soma → − desconto de volume → + uso comercial.
 *
 * Duas categorias (pedido da Bru): "Crie sua Ilustração" e "Crie sua
 * Identidade Visual" (pacotes com preço fixo; preço 0 = "sob consulta").
 * Desconto de volume e uso comercial valem só pra ilustração.
 * O botão principal manda o pedido pro WhatsApp; copiar o resumo fica pro
 * Instagram (a DM não aceita texto pronto e pede login).
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Site } from "@/lib/conteudo/tipos";
import { useMontado, useSite } from "@/lib/useSite";
import { dataExtenso, estadoAgenda } from "@/lib/agenda";
import { contatoLink, contatoTemWhats } from "@/lib/contato";
import { brl, copiarTexto, img } from "@/lib/util";
import { Cabecalho } from "@/components/site/Cabecalho";
import { Etiqueta } from "@/components/site/Etiqueta";
import { Icone } from "@/components/site/Icone";
import { LinkSite } from "@/components/site/LinkSite";
import { useCinema } from "@/components/site/Cinema";

interface ItemIlu { id: number; tipo?: undefined; enq: string; acab: string; pers: number; fundo: string; qtd: number }
interface ItemIdv { id: number; tipo: "idv"; pacote: string; qtd: number }
type Item = ItemIlu | ItemIdv;
const ehIdv = (i: Item): i is ItemIdv => i.tipo === "idv";

function porId<T extends { id: string }>(lista: T[], id: string | null | undefined): T | undefined {
  return lista.filter((x) => x.id === id)[0];
}

/* ===== cálculo ===== */
function maxPers(site: Site) {
  return Math.max(1, Number(site.precos.maxPersonagens) || 1);
}
function precoUnitario(site: Site, item: Item | (Omit<ItemIlu, "id"> & { id?: number })): number {
  const p = site.precos;
  if ("tipo" in item && item.tipo === "idv") return Number((porId(p.identidade.pacotes || [], (item as ItemIdv).pacote) || { preco: 0 }).preco) || 0;
  const it = item as ItemIlu;
  const enq = porId(p.enquadramentos, it.enq), acab = porId(p.acabamentos, it.acab), fundo = porId(p.fundos, it.fundo);
  if (!enq || !acab || !fundo) return 0;
  const extras = ((it.pers - 1) * (Number(p.personagemExtraPct) || 0)) / 100;
  return Number(enq.preco) * (1 + extras) * Number(acab.fator) + Number(fundo.preco || 0);
}
const subtotal = (site: Site, item: Item | (Omit<ItemIlu, "id"> & { id?: number })) => precoUnitario(site, item) * item.qtd;

function calcular(site: Site, itens: Item[], comercialMarcado: boolean) {
  const P = site.precos;
  const faixas = (P.descontosVolume || []).slice().sort((a, b) => a.min - b.min);
  const ilu = itens.filter((i) => !ehIdv(i));
  const idv = itens.filter(ehIdv);
  const qtdTotal = ilu.reduce((t, i) => t + i.qtd, 0);
  const bruto = ilu.reduce((t, i) => t + subtotal(site, i), 0);
  const idvTotal = idv.reduce((t, i) => t + subtotal(site, i), 0);
  const aCombinar = idv.some((i) => !precoUnitario(site, i));
  const faixa = faixas.reduce((m, f) => (qtdTotal >= f.min ? f : m), { min: 0, pct: 0 });
  const desconto = (bruto * (Number(faixa.pct) || 0)) / 100;
  const comercial = comercialMarcado ? ((bruto - desconto) * (Number(P.comercialPct) || 0)) / 100 : 0;
  const proxima = faixas.filter((f) => f.min > qtdTotal && f.pct > (faixa.pct || 0))[0];
  return {
    qtdTotal, temIlu: ilu.length > 0, temIdv: idv.length > 0, idvTotal, aCombinar,
    soCombinar: aCombinar && ilu.length === 0 && idvTotal === 0,
    bruto, pct: Number(faixa.pct) || 0, desconto, comercial, total: bruto - desconto + comercial + idvTotal, proxima,
  };
}

function descricao(site: Site, item: Item): string {
  const p = site.precos;
  if (ehIdv(item)) return "Identidade Visual · " + (porId(p.identidade.pacotes || [], item.pacote) || { nome: "" }).nome;
  const partes = [(porId(p.enquadramentos, item.enq) || { nome: "" }).nome, (porId(p.acabamentos, item.acab) || { nome: "" }).nome];
  if (item.pers > 1) partes.push(item.pers + " personagens");
  const fundo = porId(p.fundos, item.fundo);
  if (fundo && Number(fundo.preco) > 0) partes.push(fundo.nome.toLowerCase());
  return partes.join(" · ");
}
const valorTxt = (site: Site, item: Item) => { const v = subtotal(site, item); return v ? brl(v) : "sob consulta"; };
function fatorTxt(f: number): string {
  f = Number(f);
  if (f === 1) return "preço base";
  const pct = Math.round((f - 1) * 100);
  return (pct > 0 ? "+" : "") + pct + "%";
}

export function Encomendas() {
  const site = useSite();
  const montado = useMontado();
  const { lbAbrir, aviso } = useCinema();
  const P = site.precos;
  const pacotes = (P.identidade || { pacotes: [] }).pacotes || [];

  const [tipoEscolhido, setTipo] = useState<"ilu" | "idv">("ilu");
  const [rasc, setRasc] = useState({ enq: "", acab: "", pers: 1, fundo: "", qtd: 1 });
  const [pacoteEscolhido, setPacote] = useState("");
  const [itensBrutos, setItens] = useState<Item[]>([]);
  const [comercial, setComercial] = useState(false);
  const [adicionado, setAdicionado] = useState<"" | "ilu" | "idv">("");
  const [copiado, setCopiado] = useState("");
  const [barraAtiva, setBarraAtiva] = useState(false);
  const proximoId = useRef(1);
  const pedidoRef = useRef<HTMLElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  /* se o painel removeu a opção escolhida, vale a primeira que existe */
  const tipo = pacotes.length ? tipoEscolhido : "ilu";
  const rascunho = {
    enq: porId(P.enquadramentos, rasc.enq) ? rasc.enq : (P.enquadramentos[0] || { id: "" }).id,
    acab: porId(P.acabamentos, rasc.acab) ? rasc.acab : (P.acabamentos[0] || { id: "" }).id,
    fundo: porId(P.fundos, rasc.fundo) ? rasc.fundo : (P.fundos[0] || { id: "" }).id,
    pers: Math.min(Math.max(1, rasc.pers), maxPers(site)),
    qtd: rasc.qtd,
  };
  const pacoteSel = porId(pacotes, pacoteEscolhido) ? pacoteEscolhido : (pacotes[0] || { id: "" }).id;
  const itens = itensBrutos.filter((i) => (ehIdv(i) ? !!porId(pacotes, i.pacote) : !!(porId(P.enquadramentos, i.enq) && porId(P.acabamentos, i.acab) && porId(P.fundos, i.fundo))));
  const c = calcular(site, itens, comercial);
  const ag = montado ? estadoAgenda(site.agenda) : null;
  const aberta = !!ag && ag.estado === "aberta";
  const whats = contatoTemWhats(site);
  const vazio = itens.length === 0;

  const totalTxt = c.soCombinar ? "a combinar" : brl(c.total) + (c.aCombinar ? " + identidade visual a combinar" : "");
  const resumo = () => {
    const L = [aberta ? "Oi, Bru! Montei um pedido no seu site ✨" : "Oi, Bru! Quero entrar na lista de espera com este pedido ✨", ""];
    itens.forEach((i) => L.push("• " + i.qtd + "x " + descricao(site, i) + " — " + valorTxt(site, i)));
    L.push("");
    if (c.pct > 0) L.push("Desconto de volume: " + c.pct + "% (" + c.qtdTotal + " artes)");
    if (comercial && c.temIlu) L.push("Uso comercial: +" + P.comercialPct + "%");
    L.push("Total estimado*: " + totalTxt);
    if (P.notaTotal) L.push("*" + P.notaTotal);
    L.push("", c.temIdv && !c.temIlu ? "Te conto mais sobre a marca por aqui!" : "Te mando as referências por aqui!");
    return L.join("\n");
  };

  /* barra do total aparece só enquanto a área de encomendas está na tela */
  useEffect(() => {
    const el = mainRef.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => es.forEach((en) => setBarraAtiva(en.isIntersecting)), { threshold: 0.08 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const feedbackAdicionado = (qual: "ilu" | "idv") => {
    setAdicionado(qual);
    window.setTimeout(() => setAdicionado(""), 1400);
    /* no celular o pedido fica embaixo: rola até ele pra pessoa ver que entrou */
    if (window.innerWidth < 980) pedidoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const addItem = () => {
    setItens((l) => l.concat([{ id: proximoId.current++, enq: rascunho.enq, acab: rascunho.acab, pers: rascunho.pers, fundo: rascunho.fundo, qtd: rascunho.qtd }]));
    setRasc((r) => ({ ...r, qtd: 1 }));
    feedbackAdicionado("ilu");
  };
  const addIdv = () => {
    if (!pacoteSel) return;
    /* um pacote de identidade por pedido: trocar o pacote substitui o anterior */
    setItens((l) => {
      const semIdv: Item[] = l.filter((i) => !ehIdv(i));
      return semIdv.concat([{ id: proximoId.current++, tipo: "idv", pacote: pacoteSel, qtd: 1 }]);
    });
    feedbackAdicionado("idv");
  };
  const acaoItem = (id: number, acao: "mais" | "menos" | "remover") => {
    setItens((l) => {
      if (acao === "remover") return l.filter((i) => i.id !== id);
      return l.map((i) => (i.id !== id ? i : { ...i, qtd: acao === "mais" ? Math.min(20, i.qtd + 1) : Math.max(1, i.qtd - 1) }));
    });
  };
  const copiar = () => {
    if (vazio) { aviso("Monte seu pedido primeiro ✨"); return; }
    copiarTexto(resumo()).then(
      () => { setCopiado("Copiado!"); if (whats) aviso("Resumo copiado! É só colar na minha DM do Instagram ✨"); },
      () => setCopiado("Não deu pra copiar"),
    ).then(() => window.setTimeout(() => setCopiado(""), 1800));
  };

  const il = P.ilustracao || { titulo: "", sub: "" }, idt = P.identidade || { titulo: "", sub: "" };
  const abas: { k: "ilu" | "idv"; t: string; s: string }[] = [{ k: "ilu", t: il.titulo || "Crie sua Ilustração", s: il.sub }];
  if (pacotes.length) abas.push({ k: "idv", t: idt.titulo || "Crie sua Identidade Visual", s: idt.sub });
  const selPacote = porId(pacotes, pacoteSel);

  let avisoTxt: ReactNode = null;
  if (ag) {
    if (ag.estado === "aberta" && ag.atual) {
      avisoTxt = <><b>{ag.atual.sessao.nome}</b>: {ag.atual.livres} de {ag.atual.vagas}{ag.atual.vagas === 1 ? " vaga livre" : " vagas livres"}. A vaga é garantida quando o pagamento de 50% é confirmado.</>;
    } else if (ag.estado === "esgotado" && ag.atual) {
      avisoTxt = <><b>{ag.atual.sessao.nome}</b> está esgotada. Você pode montar seu pedido e mandar pra lista de espera{ag.proxima ? " da próxima agenda, que abre em " + dataExtenso(ag.proxima.abre) : ""}.</>;
    } else {
      avisoTxt = <>As encomendas estão fechadas agora{ag.proxima ? <> (a <b>{ag.proxima.sessao.nome}</b> abre em {dataExtenso(ag.proxima.abre)})</> : null}. Você pode simular seu pedido e mandar pra lista de espera.</>;
    }
  }

  const avisoAviso = c.temIlu
    ? (c.pct > 0 ? c.pct + "% de desconto aplicado (" + c.qtdTotal + " artes)." : "") +
      (c.proxima ? (c.pct > 0 ? " " : "") + "Com " + c.proxima.min + " artes no pedido o desconto vai pra " + c.proxima.pct + "%." : "")
    : "";
  const txtCta = whats ? (aberta ? "Enviar pedido no WhatsApp" : "Lista de espera no WhatsApp") : aberta ? "Fechar na DM" : "Entrar na lista de espera";
  const tabela = P.tabela || { mostrar: false, img: "", legenda: "" };
  const urlTabela = img(tabela.img);

  return (
    <>
      <Cabecalho pagina="encomendas" />
      <main className="encomendas papel" id="encomendas" aria-labelledby="enc-t" ref={mainRef}>
        <div className="wrap">
          <header className="enc-cab surge">
            <h2 className="enc-titulo t-cinema" id="enc-t">Faça sua <span>encomenda</span></h2>
            <p className="enc-sub">Escolha o que você quer criar, veja o valor estimado na hora e mande o pedido direto pro meu WhatsApp.</p>
            <div className={"enc-aviso" + (ag ? " " + ag.estado : "")} id="enc-aviso" hidden={!ag}>
              {ag ? <><Etiqueta site={site} estado={ag.estado} /><p>{avisoTxt} <LinkSite href="/agenda">ver agenda</LinkSite></p></> : null}
            </div>
          </header>

          <div className="enc-grade">
            <div className="construtor surge" id="construtor">
              {/* duas categorias: ilustração (como sempre foi) e identidade visual */}
              <div className="enc-tipos" id="enc-tipos" role="group" aria-label="O que você quer criar" hidden={abas.length < 2}>
                {abas.map((a) => (
                  <button key={a.k} type="button" className="enc-tipo" data-tipo={a.k} aria-pressed={a.k === tipo} onClick={() => setTipo(a.k)}>
                    <b>{a.t}</b>{a.s ? <small>{a.s}</small> : null}
                  </button>
                ))}
              </div>

              <div id="monta-ilu" hidden={tipo !== "ilu"}>
                <div className="passo">
                  <p className="passo-t"><span className="passo-n">1</span> Enquadramento</p>
                  <div className="opcoes grandes" id="op-enquadramento" role="group" aria-label="Enquadramento">
                    {P.enquadramentos.map((o) => (
                      <Opcao key={o.id} grupo="enq" id={o.id} nome={o.nome} desc={o.desc} foto={img(o.img)} sel={o.id === rascunho.enq} preco={brl(o.preco)} onEscolher={() => setRasc((r) => ({ ...r, enq: o.id }))} />
                    ))}
                  </div>
                </div>

                <div className="passo">
                  <p className="passo-t"><span className="passo-n">2</span> Acabamento</p>
                  <div className="opcoes" id="op-acabamento" role="group" aria-label="Acabamento">
                    {P.acabamentos.map((o) => (
                      <Opcao key={o.id} grupo="acab" id={o.id} nome={o.nome} desc={o.desc} foto={img(o.img)} sel={o.id === rascunho.acab} preco={fatorTxt(o.fator)} onEscolher={() => setRasc((r) => ({ ...r, acab: o.id }))} />
                    ))}
                  </div>
                </div>

                <div className="passo">
                  <p className="passo-t"><span className="passo-n">3</span> Personagens na arte</p>
                  <div className="linha-passo">
                    <div className="stepper">
                      <button type="button" id="pers-menos" aria-label="Menos personagens" disabled={rascunho.pers <= 1} onClick={() => setRasc((r) => ({ ...r, pers: rascunho.pers - 1 }))}>&minus;</button>
                      <output id="pers-qtd" aria-live="polite">{rascunho.pers}</output>
                      <button type="button" id="pers-mais" aria-label="Mais personagens" disabled={rascunho.pers >= maxPers(site)} onClick={() => setRasc((r) => ({ ...r, pers: rascunho.pers + 1 }))}>+</button>
                    </div>
                    <p className="passo-nota" id="pers-nota">Cada personagem extra na mesma arte: +{Number(P.personagemExtraPct) || 0}% do enquadramento.</p>
                  </div>
                </div>

                <div className="passo">
                  <p className="passo-t"><span className="passo-n">4</span> Fundo</p>
                  <div className="opcoes" id="op-fundo" role="group" aria-label="Fundo">
                    {P.fundos.map((o) => (
                      <Opcao key={o.id} grupo="fundo" id={o.id} nome={o.nome} desc={o.desc} foto="" sel={o.id === rascunho.fundo} preco={Number(o.preco) > 0 ? "+ " + brl(o.preco) : "incluso"} onEscolher={() => setRasc((r) => ({ ...r, fundo: o.id }))} />
                    ))}
                  </div>
                </div>

                <div className="passo">
                  <p className="passo-t"><span className="passo-n">5</span> Quantas artes iguais a essa</p>
                  <div className="stepper">
                    <button type="button" id="qtd-menos" aria-label="Diminuir quantidade" disabled={rascunho.qtd <= 1} onClick={() => setRasc((r) => ({ ...r, qtd: Math.max(1, r.qtd - 1) }))}>&minus;</button>
                    <output id="qtd" aria-live="polite">{rascunho.qtd}</output>
                    <button type="button" id="qtd-mais" aria-label="Aumentar quantidade" disabled={rascunho.qtd >= 20} onClick={() => setRasc((r) => ({ ...r, qtd: Math.min(20, r.qtd + 1) }))}>+</button>
                  </div>
                </div>

                <div className="construtor-pe">
                  <p className="rascunho-preco" id="rascunho-preco"><small>esta arte</small>{brl(subtotal(site, rascunho))}</p>
                  <button className={"btn cheio" + (adicionado === "ilu" ? " adicionado" : "")} type="button" id="add-item" onClick={addItem}>
                    {adicionado === "ilu" ? "Adicionado ✓" : "Adicionar ao pedido"}
                  </button>
                </div>
              </div>

              <div id="monta-idv" hidden={tipo !== "idv"}>
                <div className="passo">
                  <p className="passo-t"><span className="passo-n">1</span> Escolha o pacote</p>
                  <div className="pacotes" id="op-pacotes" role="group" aria-label="Pacote de identidade visual">
                    {pacotes.map((pc, i) => {
                      const lista = String(pc.itens || "").split("·").map((x) => x.trim()).filter(Boolean);
                      return (
                        <button key={pc.id} type="button" className="pacote" data-pacote={pc.id} aria-pressed={pc.id === pacoteSel} onClick={() => setPacote(pc.id)}>
                          <span className="pacote-topo">
                            <span><span className="pacote-n">{i + 1} · {pc.nome}</span><br /><span className="pacote-nome">{pc.sub || pc.nome}</span></span>
                            <span className="pacote-preco">{Number(pc.preco) ? brl(pc.preco) : "sob consulta"}</span>
                          </span>
                          {lista.length ? <ul>{lista.map((x, j) => <li key={j}>{x}</li>)}</ul> : null}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="construtor-pe">
                  <p className="rascunho-preco" id="idv-preco"><small>este pacote</small>{selPacote && Number(selPacote.preco) ? brl(selPacote.preco) : "sob consulta"}</p>
                  <button className={"btn cheio" + (adicionado === "idv" ? " adicionado" : "")} type="button" id="add-idv" onClick={addIdv}>
                    {adicionado === "idv" ? "Adicionado ✓" : "Adicionar ao pedido"}
                  </button>
                </div>
              </div>
            </div>

            <aside className="pedido surge" id="pedido" aria-labelledby="pedido-t" ref={pedidoRef}>
              <h3 className="rotulo" id="pedido-t">seu pedido</h3>
              <p className="pedido-vazio" id="pedido-vazio" hidden={!vazio}>Nada aqui ainda. Monte um personagem ao lado pra começar.</p>
              <ul className="pedido-itens" id="pedido-itens">
                {itens.map((i) => (
                  <li key={i.id} className="pi" data-id={i.id}>
                    <span className="pi-desc">{i.qtd}x {descricao(site, i)}</span>
                    <span className="pi-valor">{valorTxt(site, i)}</span>
                    <span className="pi-acoes">
                      {ehIdv(i) ? null : (
                        <span className="stepper">
                          <button type="button" data-acao="menos" aria-label="Diminuir" disabled={i.qtd <= 1} onClick={() => acaoItem(i.id, "menos")}>&minus;</button>
                          <output>{i.qtd}</output>
                          <button type="button" data-acao="mais" aria-label="Aumentar" disabled={i.qtd >= 20} onClick={() => acaoItem(i.id, "mais")}>+</button>
                        </span>
                      )}
                      <button type="button" className="pi-rem" data-acao="remover" onClick={() => acaoItem(i.id, "remover")}>remover</button>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="pedido-desconto" id="pedido-desconto">{avisoAviso}</p>
              <label className="comercial" id="comercial-linha" hidden={!c.temIlu}>
                <input type="checkbox" id="comercial" checked={comercial} onChange={(e) => setComercial(e.target.checked)} />
                <span><b>Uso comercial</b><small id="comercial-txt">Pra revender, estampar produto ou usar em capa. Acrescenta {Number(P.comercialPct) || 0}% ao valor.</small></span>
              </label>
              <div className="recibo" id="recibo">
                {c.temIlu ? (
                  <>
                    <div className="row"><span>Subtotal ({c.qtdTotal}{c.qtdTotal === 1 ? " arte" : " artes"})</span><span>{brl(c.bruto)}</span></div>
                    {c.pct > 0 ? <div className="row"><span>Desconto de volume ({c.pct}%)</span><span>&minus; {brl(c.desconto)}</span></div> : null}
                    {comercial ? <div className="row"><span>Uso comercial (+{P.comercialPct}%)</span><span>{brl(c.comercial)}</span></div> : null}
                  </>
                ) : null}
                {c.temIdv ? <div className="row"><span>Identidade visual</span><span>{c.idvTotal ? brl(c.idvTotal) : ""}{c.aCombinar ? (c.idvTotal ? " + " : "") + "a combinar" : ""}</span></div> : null}
                <div className="row total"><span className="rotulo">total estimado<sup>*</sup></span><strong>{c.soCombinar ? "A combinar" : brl(c.total)}</strong></div>
                {P.notaTotal ? <p className="total-nota"><b>*</b> {P.notaTotal}</p> : null}
              </div>
              <div className="pedido-ctas">
                {/* botão principal: WhatsApp com o resumo já escrito. Sem número no painel, vai pela DM do Instagram */}
                <a
                  className="btn cheio"
                  id="fechar"
                  href={contatoLink(site, resumo())}
                  target="_blank"
                  rel="noopener"
                  aria-disabled={vazio}
                  onClick={(e) => {
                    if (vazio) { e.preventDefault(); return; }
                    if (!whats) copiarTexto(resumo()).catch(() => {});
                  }}
                >
                  {whats ? <Icone id="whatsapp" /> : null}<span>{txtCta}</span>
                </a>
                <button className="btn btn-ig" type="button" id="copiar" onClick={copiar}>
                  {copiado ? copiado : whats ? <><Icone id="instagram" /><span>Copiar resumo pro Instagram</span></> : <span>Copiar resumo</span>}
                </button>
              </div>
              <p className="pedido-nota" id="pedido-nota">
                {whats
                  ? "O resumo já vai escrito na mensagem do WhatsApp. 50% pra começar, 50% depois do esboço."
                  : "A DM do Instagram não aceita texto pronto: o resumo é copiado sozinho, é só colar na conversa."}
              </p>
              <p className="pedido-ig" id="pedido-ig" hidden={!whats || !site.perfil.instagram}>
                {whats && site.perfil.instagram ? (
                  <>Prefere o Instagram? Copie o resumo e cole na minha DM: <a href={"https://ig.me/m/" + encodeURIComponent(site.perfil.instagram)} target="_blank" rel="noopener">@{site.perfil.instagram} &#8599;</a></>
                ) : null}
              </p>
            </aside>
          </div>

          <div className="regras surge" id="regras">
            {(P.regras || []).map((r, i) => <div key={i} className="regra"><b>0{i + 1}</b><span>{r}</span></div>)}
          </div>

          {/* tabela de comissões: imagem e legenda vêm do painel (Preços → Tabela) */}
          <div className="tabela-dela surge" id="tabela-dela" hidden={tabela.mostrar === false || !urlTabela}>
            {urlTabela ? (
              <button type="button" className="tabela-btn" id="tabela-btn" onClick={(e) => lbAbrir([{ src: urlTabela, titulo: "Tabela de comissões" }], 0, e.currentTarget)}>
                <img id="tabela-img" src={urlTabela} width={tabela.w || undefined} height={tabela.h || undefined} alt="Tabela de comissões da Brunna" loading="lazy" />
              </button>
            ) : null}
            <p className="t-mao" id="tabela-legenda">{tabela.legenda || ""}</p>
          </div>
        </div>

        <section className="perguntas-enc" id="perguntas" aria-labelledby="faq-t">
          <div className="wrap estreito">
            <header className="cena-cab surge">
              <p className="rotulo">perguntas</p>
              <h2 className="t-cinema" id="faq-t">A Bru responde</h2>
            </header>
            <div className="faq" id="faq">
              {site.faq.map((f, i) => (
                <details key={i} className="surge"><summary>{f.p}</summary><p className="resp">{f.r}</p></details>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* barra fixa do total (aparece só na área de encomendas) */}
      <div className={"barra-total" + (barraAtiva ? " ativa" : "")} id="barra-total" aria-hidden={!barraAtiva}>
        <div className="barra-total-in">
          <div><span className="rotulo">total estimado*</span><strong id="barra-valor">{c.soCombinar ? "A combinar" : brl(c.total)}</strong></div>
          <a className="btn cheio" id="barra-cta" href="#pedido">Ver pedido</a>
        </div>
      </div>
    </>
  );
}

function Opcao(props: { grupo: string; id: string; nome: string; desc: string; foto: string; sel: boolean; preco: string; onEscolher: () => void }) {
  const { grupo, id, nome, desc, foto, sel, preco, onEscolher } = props;
  return (
    <button type="button" className={"opcao" + (foto ? "" : " so-texto")} data-grupo={grupo} data-id={id} aria-pressed={sel} onClick={onEscolher}>
      {foto ? <img src={foto} alt="" loading="lazy" /> : null}
      <span className="o-nome">{nome}</span>
      {preco ? <span className="o-preco">{preco}</span> : null}
      {desc ? <span className="o-desc">{desc}</span> : null}
    </button>
  );
}
