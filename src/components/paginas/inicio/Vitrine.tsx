"use client";

/*
 * Vitrine: o carrossel do topo da página inicial (pedido da Bru, inspirado
 * nos destaques da Steam). As artes vêm da galeria com "destaque: true".
 *
 * - As artes ocupam a tela inteira, sem moldura ("fundo" cobre a tela,
 *   "inteira" mostra a arte inteira). "ver arte inteira" abre sem corte.
 * - Passam pro lado sozinhas, num loop infinito, sempre no mesmo sentido.
 * - O movimento acontece SÓ na troca; depois a arte fica parada.
 * - Não pausa com toque nem com o mouse em cima. Só pelo botão de pausa
 *   (acessibilidade) e quando a aba do navegador fica escondida.
 * - "Reduzir movimento" (aparelho ou painel) troca o deslize por fade.
 *
 * O motor do carrossel mexe direto nas classes e posições dos slides
 * (animação quadro a quadro); o React só desenha os textos ao redor.
 */
import { useEffect, useRef } from "react";
import type { Obra, Site } from "@/lib/conteudo/tipos";
import { useMontado, useSite } from "@/lib/useSite";
import { estadoAgenda, TITULOS_ESTADO } from "@/lib/agenda";
import { esc, img } from "@/lib/util";
import { useCinema, type ItemLightbox } from "@/components/site/Cinema";
import { Etiqueta } from "@/components/site/Etiqueta";
import { LinkSite } from "@/components/site/LinkSite";

const INTERVALO = 6000; // tempo de cada arte na tela
const DURACAO = 1300; // tempo da passagem (igual ao CSS)

function destaques(site: Site): Obra[] {
  const visiveis = site.galeria.filter((o) => o.visivel !== false && img(o.img));
  const marcadas = visiveis.filter((o) => o.destaque);
  return (marcadas.length ? marcadas : visiveis.slice(0, 6)).slice(0, 12);
}
const mini = (o: Obra) => img(o.mini) || img(o.img);
const grande = (o: Obra) => img(o.img);
const celular = (o: Obra) => img(o.imgCelular);

/* motor do carrossel: devolve uma função que desliga tudo */
function ligarCarrossel(raizVit: HTMLElement, lista: Obra[], modo: "fundo" | "inteira", abrirLb: (l: ItemLightbox[], i: number, o: HTMLElement | null) => void): () => void {
  const $ = <T extends HTMLElement>(s: string) => raizVit.querySelector<T>(s);
  const raiz = document.documentElement;
  const mq = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
  let atual = 0;
  let timer: number | null = null;
  let limpeza: number | undefined;
  let pausaUsuario = false;
  let inicio = 0;
  let restante = INTERVALO;
  const modoFade = () => (mq && mq.matches) || raiz.dataset.movimento === "desligado";
  const slide = (i: number) => raizVit.querySelector<HTMLElement>('.vit-slide[data-i="' + i + '"]');

  /* só baixa a imagem grande quando ela é a atual ou a próxima */
  function carregar(i: number) {
    const fig = slide(i);
    if (!fig) return;
    const im = fig.querySelector("img")!;
    const fonte = fig.querySelector<HTMLSourceElement>("source[data-srcset]");
    if (fonte && !fonte.getAttribute("srcset")) fonte.setAttribute("srcset", fonte.dataset.srcset || "");
    if (!im.getAttribute("src")) im.setAttribute("src", im.dataset.src || "");
  }

  function posicionar(el: HTMLElement, x: number, animar: boolean) {
    el.style.transition = animar ? "" : "none";
    el.style.transform = "translate3d(" + x + "%,0,0)";
  }

  /* dir: 1 = vem da direita (padrão), -1 = vem da esquerda, 0 = sem animação */
  function mostrar(i: number, dir: number) {
    if (!lista.length) return;
    const anterior = atual;
    atual = (i + lista.length) % lista.length;
    if (atual === anterior && dir !== 0) return;
    carregar(atual);
    carregar((atual + 1) % lista.length);
    window.clearTimeout(limpeza);
    const fade = modoFade();
    const entra = slide(atual)!;
    const sai = dir !== 0 && anterior !== atual ? slide(anterior) : null;

    raizVit.querySelectorAll<HTMLElement>(".vit-slide").forEach((f) => {
      if (f !== entra && f !== sai) {
        f.classList.remove("ativa", "saindo", "pre");
        posicionar(f, 100, false);
      }
      f.setAttribute("aria-hidden", String(f !== entra));
    });

    if (fade || dir === 0) {
      posicionar(entra, 0, false);
      entra.classList.remove("saindo", "pre");
      entra.classList.add("ativa");
      if (sai) { sai.classList.remove("ativa"); sai.classList.add("saindo"); }
    } else {
      /* 1) coloca a que entra fora da tela, do lado certo, já com o zoom */
      posicionar(entra, 100 * dir, false);
      entra.classList.remove("saindo");
      entra.classList.add("ativa", "pre");
      void entra.offsetWidth;
      /* 2) anima as duas ao mesmo tempo */
      entra.classList.remove("pre");
      posicionar(entra, 0, true);
      if (sai) {
        sai.classList.remove("ativa");
        sai.classList.add("saindo");
        posicionar(sai, -100 * dir, true);
      }
    }
    /* depois da passagem, a que saiu some de vez */
    if (sai) limpeza = window.setTimeout(() => { sai.classList.remove("saindo"); posicionar(sai, 100, false); }, DURACAO + 100);

    raizVit.querySelectorAll<HTMLElement>(".vit-mini").forEach((b) => {
      const ativo = Number(b.dataset.i) === atual;
      b.setAttribute("aria-selected", String(ativo));
      b.tabIndex = ativo ? 0 : -1;
      /* reinicia a barrinha de progresso da miniatura */
      const p = b.querySelector<HTMLElement>(".vit-prog")!;
      p.style.animation = "none";
      void p.offsetWidth;
      p.style.animation = "";
    });

    /* no celular as miniaturas não cabem: a fileira acompanha a arte atual
       (rola só a fileira, nunca a página) */
    const fila = $("#vit-miniaturas");
    const mAtual = raizVit.querySelector<HTMLElement>('.vit-mini[data-i="' + atual + '"]');
    if (fila && mAtual && fila.scrollWidth > fila.clientWidth + 2) {
      const rf = fila.getBoundingClientRect(), rm = mAtual.getBoundingClientRect();
      const alvo = fila.scrollLeft + (rm.left - rf.left) - (fila.clientWidth - rm.width) / 2;
      if (fila.scrollTo) fila.scrollTo({ left: alvo, behavior: dir === 0 ? "auto" : "smooth" });
      else fila.scrollLeft = alvo;
    }
    restante = INTERVALO;
    agendar();
  }

  const proxima = () => mostrar(atual + 1, 1);
  function agendar() {
    if (timer) window.clearTimeout(timer);
    timer = null;
    const parado = pausaUsuario || document.hidden || lista.length < 2;
    raizVit.classList.toggle("parada", parado);
    raizVit.style.setProperty("--vit-tempo", INTERVALO + "ms");
    const pausa = $("#vit-pausa");
    if (pausa) {
      pausa.setAttribute("aria-pressed", String(pausaUsuario));
      pausa.setAttribute("aria-label", pausaUsuario ? "Continuar o carrossel" : "Pausar o carrossel");
    }
    if (parado) return;
    inicio = Date.now();
    timer = window.setTimeout(proxima, restante);
  }
  function congelar() {
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
      restante = Math.max(400, restante - (Date.now() - inicio));
    }
  }

  /* desenha os slides e as miniaturas */
  const palco = $("#vit-palco")!;
  palco.classList.toggle("vit-fade", modoFade());
  palco.classList.toggle("modo-inteira", modo === "inteira");
  palco.classList.toggle("modo-fundo", modo === "fundo");
  palco.innerHTML = lista.map((o, i) =>
    '<figure class="vit-slide" data-i="' + i + '" aria-roledescription="slide" aria-label="' + (i + 1) + " de " + lista.length + '">' +
    '<div class="vit-fundo" style="background-image:url(\'' + esc(mini(o)) + '\')"></div>' +
    /* versão de celular (vertical) opcional: entra sozinha em telas estreitas */
    (celular(o) ? '<picture><source media="(max-width: 899px)" data-srcset="' + esc(celular(o)) + '">' : "") +
    '<img data-src="' + esc(grande(o)) + '" alt="' + esc(o.titulo || "Arte da Brunna") + '" style="--foco:' + esc(o.foco || "50% 35%") + '"' +
    (o.w && o.h ? ' width="' + o.w + '" height="' + o.h + '"' : "") + ' decoding="async">' + (celular(o) ? "</picture>" : "") + "</figure>",
  ).join("");
  $("#vit-miniaturas")!.innerHTML = lista.map((o, i) =>
    '<button type="button" class="vit-mini" role="tab" data-i="' + i + '" aria-label="Arte ' + (i + 1) + '" aria-selected="false" tabindex="-1">' +
    '<img src="' + esc(mini(o)) + '" alt="" loading="lazy"><i class="vit-prog" aria-hidden="true"></i></button>',
  ).join("") + (lista.length > 1
    ? '<button type="button" class="vit-pausa" id="vit-pausa" aria-pressed="false" aria-label="Pausar o carrossel"><span aria-hidden="true"></span></button>'
    : "");

  /* eventos */
  const aoVisibilidade = () => { if (document.hidden) congelar(); agendar(); };
  const aoMq = () => palco.classList.toggle("vit-fade", modoFade());
  const aoClique = (e: MouseEvent) => {
    const alvo = e.target as HTMLElement;
    const m = alvo.closest<HTMLElement>(".vit-mini");
    if (m) {
      const n = Number(m.dataset.i);
      if (n !== atual) mostrar(n, n > atual ? 1 : -1);
      return;
    }
    if (alvo.closest("#vit-pausa")) {
      pausaUsuario = !pausaUsuario;
      if (pausaUsuario) congelar();
      agendar();
      return;
    }
    if (alvo.closest("#vit-ampliar") || alvo.closest(".vit-slide.ativa")) {
      abrirLb(lista.map((o) => ({ src: grande(o), titulo: o.titulo })), atual, $("#vit-ampliar"));
    }
  };
  const aoTecla = (e: KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const d = e.key === "ArrowRight" ? 1 : -1;
    mostrar(atual + d, d);
    raizVit.querySelector<HTMLElement>('.vit-mini[data-i="' + atual + '"]')?.focus();
  };
  /* arrastar o dedo para o lado no celular */
  let x0: number | null = null;
  const aoTocar = (e: TouchEvent) => { x0 = e.touches[0].clientX; };
  const aoSoltar = (e: TouchEvent) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    x0 = null;
    if (Math.abs(dx) > 45) { const d = dx < 0 ? 1 : -1; mostrar(atual + d, d); }
  };
  const minis = $("#vit-miniaturas")!;
  document.addEventListener("visibilitychange", aoVisibilidade);
  mq?.addEventListener?.("change", aoMq);
  raizVit.addEventListener("click", aoClique);
  minis.addEventListener("keydown", aoTecla);
  palco.addEventListener("touchstart", aoTocar, { passive: true });
  palco.addEventListener("touchend", aoSoltar);

  mostrar(atual, 0);

  return () => {
    if (timer) window.clearTimeout(timer);
    window.clearTimeout(limpeza);
    document.removeEventListener("visibilitychange", aoVisibilidade);
    mq?.removeEventListener?.("change", aoMq);
    raizVit.removeEventListener("click", aoClique);
    minis.removeEventListener("keydown", aoTecla);
    palco.removeEventListener("touchstart", aoTocar);
    palco.removeEventListener("touchend", aoSoltar);
    palco.innerHTML = "";
    minis.innerHTML = "";
  };
}

export function Vitrine() {
  const site = useSite();
  const montado = useMontado();
  const { lbAbrir } = useCinema();
  const raiz = useRef<HTMLElement>(null);
  const modo = (site.cenas.abertura || {}).modo === "inteira" ? "inteira" : "fundo";
  /* só recria o carrossel quando as artes ou o modo mudam de verdade */
  const listaJson = JSON.stringify(destaques(site));

  useEffect(() => {
    if (!raiz.current) return;
    return ligarCarrossel(raiz.current, JSON.parse(listaJson) as Obra[], modo, lbAbrir);
  }, [listaJson, modo, lbAbrir]);

  const c = site.cenas.abertura;
  const p = site.perfil;
  const ag = montado ? estadoAgenda(site.agenda) : null;

  return (
    <section className="vitrine" id="abertura" data-topo aria-roledescription="carrossel" aria-label="Artes em destaque" ref={raiz}>
      <div className="vit-palco" id="vit-palco" aria-live="off"></div>
      <div className="vit-veu" aria-hidden="true"></div>

      <div className="wrap vit-conteudo">
        <header className="vit-cab">
          <p className="rotulo vit-kicker" id="ab-kicker">{c.kicker || p.titulo}</p>
          <div className="vit-status" id="ab-status">
            {ag ? (
              <LinkSite href="/agenda" aria-label={TITULOS_ESTADO[ag.estado] + ", ver agenda"}>
                <Etiqueta site={site} estado={ag.estado} />
              </LinkSite>
            ) : null}
          </div>
        </header>

        <div className="vit-base">
          <div className="vit-info">
            <h1 className="so-leitor" id="ab-h1">{(p.nome || "") + (p.titulo ? " · " + p.titulo : "")}</h1>
            <p className="vit-frase t-mao" id="ab-frase">{p.frase}</p>
            <p className="vit-legenda" id="ab-legenda">{c.legenda}</p>
            <div className="vit-ctas">
              <LinkSite className="btn cheio" href="/encomendas">Fazer encomenda</LinkSite>
              <a className="btn" href="#projetos">Ver projetos</a>
            </div>
          </div>
          <div className="vit-lado">
            <button type="button" className="vit-ampliar" id="vit-ampliar">
              <span aria-hidden="true">&#10530;</span> <span className="txt">ver arte inteira</span>
            </button>
            <div className="vit-miniaturas" id="vit-miniaturas" role="tablist" aria-label="Escolher arte"></div>
          </div>
        </div>
      </div>
    </section>
  );
}
