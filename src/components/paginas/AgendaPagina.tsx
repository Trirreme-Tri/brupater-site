"use client";

/*
 * Agenda: situação agora, calendário, agendas de cada mês, próximas datas e
 * fila de produção. Tudo depende da data de hoje, então é desenhado no
 * navegador (depois de montar).
 */
import { useState, type ReactNode } from "react";
import type { EventoAgenda, Site, TipoEvento } from "@/lib/conteudo/tipos";
import { useMontado, useSite } from "@/lib/useSite";
import { dataExtenso, dataLocal, diasAte, estadoAgenda, hojeZero, MESES, sessoesOrdenadas, TITULOS_ESTADO, type EstadoSessaoNome } from "@/lib/agenda";
import { contatoLink, contatoTemWhats, MSG_AVISAR } from "@/lib/contato";
import { copiarTexto, estilo } from "@/lib/util";
import { Cabecalho } from "@/components/site/Cabecalho";
import { Etiqueta } from "@/components/site/Etiqueta";
import { LinkSite } from "@/components/site/LinkSite";
import { useCinema } from "@/components/site/Cinema";

const TIPOS_EVENTO: Record<TipoEvento, { nome: string; cor: string }> = {
  abertura: { nome: "Abertura", cor: "var(--rosa)" },
  fechamento: { nome: "Fechamento", cor: "var(--cine-ink)" },
  entrega: { nome: "Entrega", cor: "var(--teal)" },
  aviso: { nome: "Aviso", cor: "var(--violeta)" },
};
const NOMES_SESSAO: Record<EstadoSessaoNome, string> = { aberta: "Aberta", esgotado: "Esgotado", embreve: "Em breve", encerrada: "Encerrada" };
const dois = (n: number) => String(n).padStart(2, "0");

function Estrelas({ ocupadas, total }: { ocupadas: number; total: number }) {
  return (
    <div className="estrelas" role="img" aria-label={ocupadas + " de " + total + " vagas preenchidas"}>
      {Array.from({ length: total }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" className={i < ocupadas ? "cheia" : "vazia"} aria-hidden="true">
          <path d="M12 3l2.6 5.6 6 .7-4.5 4.1 1.2 6L12 16.4 6.7 19.4l1.2-6L3.4 9.3l6-.7z" />
        </svg>
      ))}
    </div>
  );
}

/* "Me avisa quando abrir": WhatsApp com a mensagem pronta (ou DM do Instagram, com a mensagem copiada) */
function BotaoAvisar({ site, classe }: { site: Site; classe: string }) {
  const { aviso } = useCinema();
  const clicar = () => {
    const link = contatoLink(site, MSG_AVISAR);
    if (contatoTemWhats(site)) {
      window.open(link, "_blank", "noopener");
      return;
    }
    /* DM do Instagram não aceita texto pronto: copia antes de abrir */
    copiarTexto(MSG_AVISAR).then(() => aviso("Mensagem copiada! Cole na DM que vai abrir e envie ✨"), () => {});
    window.open(link, "_blank", "noopener");
  };
  return <button type="button" className={("btn " + classe).trim()} data-avisar onClick={clicar}>Me avisa quando abrir</button>;
}

function Status({ site }: { site: Site }) {
  const ag = estadoAgenda(site.agenda);
  const a = site.agenda;
  let esq: ReactNode;
  let dir: ReactNode = null;
  if (ag.estado === "aberta" && ag.atual) {
    esq = <div className="st-num"><span className="rotulo">vagas livres</span><strong>{ag.atual.livres}</strong><small>de {ag.atual.vagas} · {ag.atual.sessao.nome}</small></div>;
    dir = <div className="st-num"><span className="rotulo">vagas preenchidas</span><Estrelas ocupadas={ag.atual.ocupadas} total={ag.atual.vagas} /><small>{ag.atual.ocupadas} de {ag.atual.vagas}</small></div>;
  } else {
    if (ag.proxima && a.mostrarContagem) {
      const d = diasAte(ag.proxima.abre);
      esq = <div className="st-num"><span className="rotulo">próxima agenda abre em</span><strong>{d === 0 ? "hoje" : d}</strong><small>{d === 0 ? "" : d === 1 ? "dia · " : "dias · "}{dataExtenso(ag.proxima.abre)}</small></div>;
    } else if (ag.proxima) {
      esq = <div className="st-num"><span className="rotulo">próxima agenda</span><strong>{dois(ag.proxima.abre.getDate())}/{dois(ag.proxima.abre.getMonth() + 1)}</strong><small>{dataExtenso(ag.proxima.abre)}</small></div>;
    } else {
      esq = <div className="st-num"><span className="rotulo">próxima agenda</span><strong>em breve</strong><small>fique de olho no Instagram</small></div>;
    }
    if (ag.proxima) dir = <div className="st-num"><span className="rotulo">{ag.proxima.sessao.nome}</span><Estrelas ocupadas={0} total={ag.proxima.vagas} /><small>{ag.proxima.vagas} vagas</small></div>;
  }
  return (
    <>
      <div className="st-topo"><Etiqueta site={site} estado={ag.estado} /></div>
      <h2 className="st-titulo">{TITULOS_ESTADO[ag.estado]}</h2>
      <p className="st-aviso">{(a.avisos || {})[ag.estado] || ""}</p>
      <div className="st-numeros">{esq}{dir}</div>
      <div className="st-ctas">
        {ag.estado === "aberta" ? (
          <>
            <LinkSite className="btn cheio" href="/encomendas">Garantir minha vaga</LinkSite>
            <a className="btn" href={contatoLink(site, "")} target="_blank" rel="noopener">Tirar dúvida</a>
          </>
        ) : (
          <>
            <BotaoAvisar site={site} classe="cheio" />
            <LinkSite className="btn" href="/encomendas">Simular meu pedido</LinkSite>
          </>
        )}
      </div>
      {ag.estado !== "aberta" ? <p className="st-nota">O botão copia a mensagem e abre a minha DM: é só colar e enviar.</p> : null}
    </>
  );
}

function Sessoes({ site }: { site: Site }) {
  const lista = sessoesOrdenadas(site.agenda);
  const hoje = hojeZero();
  const ag = estadoAgenda(site.agenda);
  /* esconde agendas antigas que já acabaram: mostra a atual e as próximas */
  const visiveis = lista.filter((x) => x.abre >= hoje || (ag.atual && x.sessao === ag.atual.sessao));
  if (!visiveis.length) return <li className="vazio-cine">Nenhuma agenda marcada por enquanto. Fique de olho no Instagram!</li>;
  return (
    <>
      {visiveis.map((x, i) => {
        const estado: EstadoSessaoNome = site.agenda.pausa && x.estado === "aberta" ? "encerrada" : x.estado;
        const info = estado === "embreve" ? "abre em " + dataExtenso(x.abre)
          : estado === "aberta" ? x.livres + (x.livres === 1 ? " vaga livre" : " vagas livres")
          : estado === "esgotado" ? "todas as " + x.vagas + " vagas preenchidas" : "agenda encerrada";
        return (
          <li key={i} className={"sessao " + estado + " surge"}>
            <div className="sessao-cab">
              {estado === "esgotado"
                ? <span className="carimbo">{(site.agenda.etiquetas || {}).esgotado || "Esgotado"}</span>
                : <span className="sessao-chip">{NOMES_SESSAO[estado]}</span>}
            </div>
            <h3 className="sessao-nome">{x.sessao.nome}</h3>
            <Estrelas ocupadas={x.ocupadas} total={x.vagas} />
            <p className="sessao-info">{info}</p>
            {x.sessao.nota ? <p className="sessao-nota">{x.sessao.nota}</p> : null}
            {estado === "aberta" ? <LinkSite className="btn cheio" href="/encomendas">Garantir minha vaga</LinkSite> : estado === "embreve" ? <BotaoAvisar site={site} classe="" /> : null}
          </li>
        );
      })}
    </>
  );
}

/* datas manuais + aberturas das agendas, tudo junto */
interface Ev { e: Pick<EventoAgenda, "tipo" | "titulo" | "desc">; d: Date }
function eventosOrdenados(site: Site): Ev[] {
  const todos: { e: Ev["e"]; d: Date | null }[] = (site.agenda.eventos || []).map((e) => ({ e, d: dataLocal(e.data) }));
  sessoesOrdenadas(site.agenda).forEach((x) => {
    todos.push({
      e: { tipo: "abertura", titulo: "Abre: " + x.sessao.nome, desc: x.vagas + (x.vagas === 1 ? " vaga" : " vagas") + (x.sessao.nota ? " · " + x.sessao.nota : "") },
      d: x.abre,
    });
  });
  return todos.filter((x): x is Ev => !!x.d).sort((a, b) => a.d.getTime() - b.d.getTime());
}

function Calendario({ site }: { site: Site }) {
  const hoje = hojeZero();
  const [mesCal, setMesCal] = useState(() => new Date(hoje.getFullYear(), hoje.getMonth(), 1));
  const [sel, setSel] = useState<number | null>(null);
  const ano = mesCal.getFullYear(), mes = mesCal.getMonth();
  const porDia: Record<number, Ev["e"][]> = {};
  eventosOrdenados(site).forEach((x) => {
    if (x.d.getFullYear() === ano && x.d.getMonth() === mes) (porDia[x.d.getDate()] = porDia[x.d.getDate()] || []).push(x.e);
  });
  const inicio = new Date(ano, mes, 1).getDay();
  const diasMes = new Date(ano, mes + 1, 0).getDate();
  const cel: ReactNode[] = ["D", "S", "T", "Q", "Q", "S", "S"].map((s, i) => <span key={"s" + i} className="cal-sem" aria-hidden="true">{s}</span>);
  for (let i = 0; i < inicio; i++) cel.push(<span key={"f" + i} className="cal-dia fora"></span>);
  for (let d = 1; d <= diasMes; d++) {
    const data = new Date(ano, mes, d), evs = porDia[d];
    const cls = ["cal-dia"];
    if (data < hoje) cls.push("passado");
    if (data.getTime() === hoje.getTime()) cls.push("hoje");
    if (evs) {
      cls.push("marcado");
      if (evs.some((e) => e.tipo === "abertura")) cls.push("dia-abertura");
      if (sel === d) cls.push("sel");
      const cor = (TIPOS_EVENTO[evs[0].tipo] || TIPOS_EVENTO.aviso).cor;
      cel.push(
        <button key={d} type="button" className={cls.join(" ")} data-dia={d} style={estilo({ "--cor-ev": cor })}
          aria-label={d + " de " + MESES[mes] + ": " + evs.map((e) => e.titulo).join(", ")} onClick={() => setSel(d)}>
          {d}
        </button>,
      );
    } else {
      cel.push(<span key={d} className={cls.join(" ")}>{d}</span>);
    }
  }
  const trocarMes = (n: number) => {
    setMesCal(new Date(ano, mes + n, 1));
    setSel(null);
  };
  const evsSel = sel ? porDia[sel] || [] : null;
  return (
    <>
      <div className="cal-topo">
        <h3 className="cal-mes">{MESES[mes]} <small style={{ fontSize: ".55em", opacity: 0.6 }}>{ano}</small></h3>
        <div className="cal-nav">
          <button type="button" data-cal="-1" aria-label="Mês anterior" onClick={() => trocarMes(-1)}>&#8592;</button>
          <button type="button" data-cal="1" aria-label="Próximo mês" onClick={() => trocarMes(1)}>&#8594;</button>
        </div>
      </div>
      <div className="cal-grade">{cel}</div>
      <p className="cal-detalhe" id="cal-detalhe" aria-live="polite">
        {evsSel
          ? evsSel.map((ev, i) => <span key={i}>{i > 0 ? <br /> : null}<b>{ev.titulo}</b> · {ev.desc}</span>)
          : Object.keys(porDia).length ? "Toque num dia marcado para ver o que acontece." : "Nenhuma data marcada neste mês."}
      </p>
      <div className="legenda">
        {(Object.keys(TIPOS_EVENTO) as TipoEvento[]).map((k) => <span key={k} style={estilo({ "--c": TIPOS_EVENTO[k].cor })}>{TIPOS_EVENTO[k].nome}</span>)}
      </div>
    </>
  );
}

function Eventos({ site }: { site: Site }) {
  const hoje = hojeZero();
  /* só o que ainda vai acontecer (e o que passou nos últimos 7 dias) */
  const lista = eventosOrdenados(site).filter((x) => x.d >= new Date(hoje.getTime() - 7 * 86400000));
  if (!lista.length) return <li className="vazio-cine">Nenhuma data marcada por enquanto.</li>;
  return (
    <>
      {lista.map((x, i) => {
        const t = TIPOS_EVENTO[x.e.tipo] || TIPOS_EVENTO.aviso;
        return (
          <li key={i} className={"ev" + (x.d < hoje ? " passado" : "")} style={estilo({ "--cor-ev": t.cor })}>
            <div className="ev-data"><b>{dois(x.d.getDate())}</b><small>{MESES[x.d.getMonth()].slice(0, 3)}</small></div>
            <div><span className="ev-tipo">{t.nome}</span><span className="ev-titulo">{x.e.titulo}</span><span className="ev-desc">{x.e.desc}</span></div>
          </li>
        );
      })}
    </>
  );
}

function Fila({ site }: { site: Site }) {
  const etapas = site.agenda.etapas || [];
  const n = etapas.length;
  const fila = site.agenda.fila || [];
  if (!fila.length) return <li className="vazio-cine">A fila está vazia agora.</li>;
  return (
    <>
      {fila.map((f, k) => {
        const e = Math.max(0, Math.min(n - 1, Number(f.etapa) || 0));
        return (
          <li key={k} className="fila-item">
            <div className="fila-cab"><span><b>{f.nome}</b> <small>{f.detalhe}</small></span><span className="fila-etapa">{etapas[e] || ""}</span></div>
            <div className="fila-barra" style={estilo({ "--n": n })} role="img" aria-label={"Etapa " + (e + 1) + " de " + n + ": " + (etapas[e] || "")}>
              {Array.from({ length: n }, (_, i) => <i key={i} className={i < e || e === n - 1 ? "ok" : i === e ? "agora" : ""}></i>)}
            </div>
          </li>
        );
      })}
    </>
  );
}

export function AgendaPagina() {
  const site = useSite();
  const montado = useMontado();
  return (
    <>
      <Cabecalho pagina="agenda" />
      <main className="agenda" id="agenda">
        <div className="wrap">
          <div className="agenda-grade">
            <div className="agenda-status surge" id="agenda-status">{montado ? <Status site={site} /> : null}</div>
            <div className="agenda-cal surge" id="agenda-cal">{montado ? <Calendario site={site} /> : null}</div>
          </div>

          <section className="agenda-bloco" aria-labelledby="sessoes-t">
            <h2 className="rotulo" id="sessoes-t">agendas de encomenda</h2>
            <ol className="sessoes" id="agenda-sessoes">{montado ? <Sessoes site={site} /> : null}</ol>
          </section>

          <div className="agenda-grade dois">
            <div className="agenda-eventos surge">
              <h2 className="rotulo">próximas datas</h2>
              <ol className="linha-tempo" id="agenda-eventos">{montado ? <Eventos site={site} /> : null}</ol>
            </div>
            <div className="agenda-fila surge">
              <h2 className="rotulo">fila de produção</h2>
              <ol className="fila" id="agenda-fila"><Fila site={site} /></ol>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
