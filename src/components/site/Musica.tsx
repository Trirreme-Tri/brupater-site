"use client";

/*
 * Mini player de música (trilha sonora da Bru).
 *
 * Fica no layout das páginas públicas, então CONTINUA TOCANDO quando a pessoa
 * troca de página (a troca acontece sem recarregar o site).
 *
 * Abrir e fechar:
 *   - passar o mouse no botão abre o painel; tirar o mouse fecha;
 *   - clicar deixa o painel FIXO aberto (e começa a música) até clicar de novo;
 *   - no celular (sem mouse) é só o toque.
 * Regras dos navegadores (não dá pra contornar): nenhum site toca som
 * sozinho, a música só começa no clique. O player (iframe) só é criado no
 * clique: nada carrega antes disso.
 *
 * Volume: toda mudança é uma rampa suave (fade-in ao começar, ao mexer no
 * controle e fade-out ao parar). YouTube e SoundCloud aceitam volume por
 * mensagem; no Spotify, só pelo volume do aparelho.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSite } from "@/lib/useSite";
import { embedMusica, type EmbedMusica } from "@/lib/musica";
import { estilo } from "@/lib/util";

const ICO_MIN = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12" /></svg>
);
const ICO_X = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17" /></svg>
);
const ICO_PLAY = (
  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none" /></svg>
);
const ICO_VOL = (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="none" />
    <path className="v1" d="M15.5 9.5a3.5 3.5 0 0 1 0 5" />
    <path className="v2" d="M18 7a7 7 0 0 1 0 10" />
  </svg>
);

const temMouse = () => typeof window !== "undefined" && !!window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

/** o site inteiro: só monta o player quando há link de trilha reconhecido */
export function Musica() {
  const site = useSite();
  const t = site.perfil.trilha || { mostrar: false, rotulo: "", url: "", volume: 50 };
  const e = useMemo(() => (t.mostrar === false ? null : embedMusica(t.url)), [t.mostrar, t.url]);

  useEffect(() => {
    document.body.classList.toggle("com-musica", !!e);
    return () => document.body.classList.remove("com-musica");
  }, [e]);

  if (!e) return null;
  /* trocar o link ou o volume inicial no painel recria o player */
  return <Player key={t.url + "|" + t.volume + "|" + t.rotulo} embed={e} nome={t.rotulo || "Trilha sonora"} volumeInicial={volumeValido(t.volume)} />;
}

function volumeValido(v: unknown): number {
  const n = Number(v);
  return isNaN(n) ? 50 : Math.max(0, Math.min(100, Math.round(n)));
}

function Player({ embed: e, nome, volumeInicial }: { embed: EmbedMusica; nome: string; volumeInicial: number }) {
  const [aberto, setAberto] = useState(false);
  const [fixo, setFixo] = useState(false);
  const [carregado, setCarregado] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [volume, setVolume] = useState(volumeInicial);
  const [origem, setOrigem] = useState("");
  const frame = useRef<HTMLIFrameElement>(null);
  const atual = useRef(0);
  const timerRampa = useRef<number | undefined>(undefined);
  const timersInicio = useRef<number[]>([]);
  const timerSaida = useRef<number | undefined>(undefined);
  const escolhido = useRef(volumeInicial);
  const preconectado = useRef(false);

  /* manda um comando pro player (YouTube e SoundCloud aceitam por mensagem) */
  const enviar = useCallback(
    (v: number, som?: boolean) => {
      const w = frame.current?.contentWindow;
      if (!w) return;
      if (e.servico === "YouTube") {
        w.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [v] }), "*");
        if (som) w.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
      }
      if (e.servico === "SoundCloud") w.postMessage(JSON.stringify({ method: "setVolume", value: v }), "*");
    },
    [e.servico],
  );

  /* rampa suave (curva em "S") do volume atual até o destino */
  const rampa = useCallback(
    (destino: number, ms: number, depois?: () => void) => {
      window.clearInterval(timerRampa.current);
      const ini = atual.current;
      const t0 = Date.now();
      timerRampa.current = window.setInterval(() => {
        const k = Math.min(1, (Date.now() - t0) / ms);
        const ease = k * k * (3 - 2 * k);
        atual.current = ini + (destino - ini) * ease;
        enviar(Math.round(atual.current), true);
        if (k >= 1) {
          window.clearInterval(timerRampa.current);
          if (depois) depois();
        }
      }, 50);
    },
    [enviar],
  );

  const limparInicio = useCallback(() => {
    timersInicio.current.forEach((x) => { window.clearInterval(x); window.clearTimeout(x); });
    timersInicio.current = [];
  }, []);

  /* o player demora um pouco pra ficar pronto: segura no zero, depois sobe
     devagar até o volume escolhido, e reforça o valor final algumas vezes */
  const aoCarregar = useCallback(() => {
    setCarregando(false);
    limparInicio();
    atual.current = 0;
    let n = 0;
    const t = window.setInterval(() => {
      enviar(0);
      if (++n >= 6) {
        window.clearInterval(t);
        rampa(escolhido.current, 2600);
      }
    }, 250);
    timersInicio.current.push(t);
    timersInicio.current.push(
      window.setTimeout(() => {
        let k = 0;
        const t2 = window.setInterval(() => {
          enviar(Math.round(atual.current), true);
          if (++k >= 6) window.clearInterval(t2);
        }, 700);
        timersInicio.current.push(t2);
      }, 4600),
    );
  }, [enviar, rampa, limparInicio]);

  /* limpa os temporizadores ao sair (ex.: o painel trocou a trilha) */
  useEffect(() => () => {
    limparInicio();
    window.clearInterval(timerRampa.current);
    window.clearTimeout(timerSaida.current);
  }, [limparInicio]);

  /* otimização: abre a conexão com o serviço de música antes do clique */
  const preconectar = () => {
    if (preconectado.current) return;
    preconectado.current = true;
    const hosts =
      e.servico === "YouTube" ? ["https://www.youtube-nocookie.com", "https://i.ytimg.com", "https://www.google.com"]
        : e.servico === "Spotify" ? ["https://open.spotify.com"] : ["https://w.soundcloud.com"];
    hosts.forEach((h) => {
      const l = document.createElement("link");
      l.rel = "preconnect";
      l.href = h;
      l.crossOrigin = "";
      document.head.appendChild(l);
    });
  };

  const abrirETocar = () => {
    preconectar();
    if (!carregado) {
      setOrigem(window.location.origin);
      setCarregando(true);
      setCarregado(true);
    }
    setAberto(true);
  };
  /* fechar: o volume desce devagar (fade-out) e só então o player sai */
  const fechar = () => {
    limparInicio();
    setAberto(false);
    rampa(0, 700, () => {
      setCarregado(false);
      setCarregando(false);
    });
  };

  const clique = (acao: "alternar" | "tocar" | "minimizar" | "fechar") => {
    if (acao === "alternar") {
      if (fixo) { setFixo(false); setAberto(false); }
      else { setFixo(true); abrirETocar(); }
    } else if (acao === "tocar") { setFixo(true); abrirETocar(); }
    else if (acao === "minimizar") { setFixo(false); setAberto(false); }
    else { setFixo(false); fechar(); }
  };

  const src = carregado ? e.src + (e.servico === "YouTube" && origem ? "&origin=" + encodeURIComponent(origem) : "") : "";

  return (
    <div
      className={["musica", aberto && "aberto", fixo && "fixo", carregado && "tocando", carregando && "carregando"].filter(Boolean).join(" ")}
      onMouseEnter={() => {
        if (!temMouse()) return;
        window.clearTimeout(timerSaida.current);
        preconectar();
        setAberto(true);
      }}
      onMouseLeave={() => {
        if (!temMouse()) return;
        window.clearTimeout(timerSaida.current);
        timerSaida.current = window.setTimeout(() => { if (!fixo) setAberto(false); }, 250);
      }}
    >
      <div className="mu-painel" id="mu-painel" role="dialog" aria-label={nome} aria-hidden={!aberto}>
        <div className="mu-cab">
          <div className="mu-cab-txt">
            <span className="mu-kicker">&#9835; {e.servico}</span>
            <span className="mu-titulo">{nome}</span>
          </div>
          <button type="button" className="mu-ico" aria-label="Minimizar (a música continua)" title="Minimizar (a música continua)" onClick={() => clique("minimizar")}>{ICO_MIN}</button>
          <button type="button" className="mu-ico" aria-label="Parar e fechar" title="Parar e fechar" onClick={() => clique("fechar")}>{ICO_X}</button>
        </div>
        <div className="mu-tela">
          <div className="mu-player" style={{ height: e.altura + "px" }}>
            {carregado ? (
              <iframe
                ref={frame}
                src={src}
                title={"Player de música (" + e.servico + ")"}
                allow="autoplay; encrypted-media; clipboard-write; picture-in-picture"
                loading="eager"
                referrerPolicy="strict-origin-when-cross-origin"
                onLoad={aoCarregar}
              />
            ) : (
              <button type="button" className="mu-tocar" onClick={() => clique("tocar")}>
                <span className="mu-tocar-ico">{ICO_PLAY}</span>
                <span>Tocar a trilha</span>
              </button>
            )}
          </div>
          <p className="mu-carregando" aria-live="polite"><i></i><i></i><i></i> carregando a trilha</p>
        </div>
        {e.servico === "Spotify" ? (
          <p className="mu-nota">No Spotify, quem não está logado ouve só uma prévia de cada música. O volume é o do seu aparelho.</p>
        ) : (
          <label className="mu-volume">
            <span className={"mu-vol-ico" + (volume === 0 ? " mudo" : volume < 50 ? " baixo" : "")}>{ICO_VOL}</span>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={volume}
              aria-label="Volume da música"
              style={estilo({ "--pct": volume + "%" })}
              onChange={(ev) => {
                const v = Number(ev.target.value);
                setVolume(v);
                escolhido.current = v;
                rampa(v, 450);
              }}
            />
            <output>{volume}%</output>
          </label>
        )}
      </div>
      <button
        type="button"
        className="mu-botao"
        aria-expanded={aberto}
        aria-controls="mu-painel"
        aria-pressed={fixo}
        title={fixo ? "Clique pra fechar (a música continua)" : "Clique pra deixar aberto e tocar"}
        onClick={() => clique("alternar")}
      >
        <span className="mu-disco" aria-hidden="true"><i></i></span>
        <span className="mu-txt">{nome}</span>
        <span className="mu-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      </button>
    </div>
  );
}
