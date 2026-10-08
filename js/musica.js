"use strict";

/*
 * Mini player de música (pedido do Wellington pra Bru, out/2026).
 * Um botão fixo no canto esquerdo da tela abre um player pequeno com a
 * playlist que a Bru colar no painel (Sobre mim e contato → Trilha sonora).
 *
 * Serviços aceitos (o link é convertido no player certo):
 *   - YouTube / YouTube Music: playlist ou vídeo. Toca a música inteira pra
 *     todo mundo e REPETE sem parar (loop). É o recomendado.
 *   - Spotify: playlist, álbum ou faixa. Quem não está logado no Spotify
 *     no navegador ouve só uma prévia de 30 segundos, e não repete sozinho.
 *   - SoundCloud: playlist ou faixa.
 *
 * Volume: começa no "volume inicial" do painel e quem visita ajusta no
 * controle do player (YouTube e SoundCloud). O Spotify não deixa outro site
 * mudar o volume: lá, só pelo volume do aparelho.
 *
 * Regras dos navegadores (não dá pra contornar):
 *   - nenhum site pode tocar som sozinho: a música só começa quando a
 *     pessoa clica no botão;
 *   - ao trocar de página, a música para (cada página é carregada de novo).
 * Minimizar o player NÃO para a música: ele só sai da frente.
 *
 * Abrir e fechar (pedido do Wellington):
 *   - passar o mouse no botão abre o painel; tirar o mouse fecha;
 *   - clicar no botão deixa o painel FIXO aberto (e começa a música) até
 *     clicar nele de novo;
 *   - no celular (sem mouse) é só o toque: abre e fixa / fecha.
 * Passar o mouse não começa a música (o navegador não deixa som sem clique):
 * o painel mostra um botão "Tocar" até a pessoa clicar.
 */
var Musica = (function () {
  function embed(url) {
    var u;
    try { u = new URL(String(url || "").trim()); } catch (e) { return null; }
    if (u.protocol !== "https:") return null;
    var h = u.hostname.replace(/^(www|m|music)\./, "");
    if (h === "youtube.com" || h === "youtu.be") {
      var lista = u.searchParams.get("list");
      var v = h === "youtu.be" ? u.pathname.slice(1) : u.searchParams.get("v");
      var base = "https://www.youtube-nocookie.com/embed/";
      /* enablejsapi: permite mudar o volume pelo controle do mini player */
      /* mute=1: começa sem som e o volume sobe devagar (fade-in), em vez de
         começar alto e cair de repente */
      var extra = "&loop=1&rel=0&playsinline=1&autoplay=1&mute=1&enablejsapi=1&origin=" + encodeURIComponent(location.origin);
      if (lista && /^[\w-]+$/.test(lista)) return { servico: "YouTube", tipo: "playlist", loop: true, altura: 180, src: base + "videoseries?list=" + lista + extra };
      if (v && /^[\w-]{6,20}$/.test(v)) return { servico: "YouTube", tipo: "vídeo", loop: true, altura: 180, src: base + v + "?playlist=" + v + extra };
      return null;
    }
    if (h === "open.spotify.com") {
      var m = u.pathname.match(/(playlist|album|track|artist|show|episode)\/([A-Za-z0-9]+)/);
      if (m) return { servico: "Spotify", tipo: m[1], loop: false, altura: 152, src: "https://open.spotify.com/embed/" + m[1] + "/" + m[2] + "?theme=0" };
      return null;
    }
    if (h === "soundcloud.com") {
      return { servico: "SoundCloud", tipo: "faixa ou playlist", loop: false, altura: 166,
        src: "https://w.soundcloud.com/player/?url=" + encodeURIComponent(u.href) + "&auto_play=true&visual=false&show_comments=false&color=%23e8347f" };
    }
    return null;
  }

  var raiz, painel, aberto = false, carregado = false, fixo = false, timerSaida;
  var temMouse = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* ===== volume suave =====
     Toda mudança de volume é uma rampa (sobe/desce aos poucos), nunca um
     salto: ao começar (fade-in), ao mexer no controle e ao parar (fade-out). */
  var volume = null;        // o que a pessoa escolheu no controle (vale nesta visita)
  var atual = 0;            // volume que o player está tocando agora
  var timerRampa, timersInicio = [];
  function volumeInicial() {
    var v = Number(trilha().volume);
    return isNaN(v) ? 50 : Math.max(0, Math.min(100, Math.round(v)));
  }
  function escolhido() { return volume == null ? volumeInicial() : volume; }
  /* manda um comando pro player (YouTube e SoundCloud aceitam por mensagem) */
  function enviar(v, extra) {
    var f = raiz && raiz.querySelector(".mu-player iframe"), e = info();
    if (!f || !f.contentWindow || !e) return;
    if (e.servico === "YouTube") {
      f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [v] }), "*");
      if (extra === "som") f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "unMute", args: [] }), "*");
    }
    if (e.servico === "SoundCloud") f.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: v }), "*");
  }
  /* rampa suave (curva em "S") do volume atual até o destino */
  function rampa(destino, ms, depois) {
    clearInterval(timerRampa);
    var ini = atual, t0 = Date.now();
    timerRampa = setInterval(function () {
      var k = Math.min(1, (Date.now() - t0) / ms), ease = k * k * (3 - 2 * k);
      atual = ini + (destino - ini) * ease;
      enviar(Math.round(atual), "som");
      if (k >= 1) { clearInterval(timerRampa); if (depois) depois(); }
    }, 50);
  }
  /* o player demora um pouco pra ficar pronto: segura no zero, depois sobe
     devagar até o volume escolhido, e reforça o valor final algumas vezes */
  function aoCarregar() {
    limparInicio();
    atual = 0;
    var n = 0, t = setInterval(function () {
      enviar(0);
      if (++n >= 6) { clearInterval(t); rampa(escolhido(), 2600); }
    }, 250);
    timersInicio.push(t);
    timersInicio.push(setTimeout(function () {
      var k = 0, t2 = setInterval(function () { enviar(Math.round(atual), "som"); if (++k >= 6) clearInterval(t2); }, 700);
      timersInicio.push(t2);
    }, 4600));
  }
  function limparInicio() { timersInicio.forEach(function (t) { clearInterval(t); clearTimeout(t); }); timersInicio = []; }

  function trilha() { return (window.SITE && SITE.perfil && SITE.perfil.trilha) || {}; }
  function info() { var t = trilha(); return t.mostrar === false ? null : embed(t.url); }

  var ICO = {
    min: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 12h12"/></svg>',
    x: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 7l10 10M17 7L7 17"/></svg>',
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/></svg>',
    vol: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.5L12 6v12l-4.5-3.5H4z" fill="currentColor" stroke="none"/><path class="v1" d="M15.5 9.5a3.5 3.5 0 0 1 0 5"/><path class="v2" d="M18 7a7 7 0 0 1 0 10"/></svg>'
  };
  function botaoTocar() {
    return '<button type="button" class="mu-tocar" data-mu="tocar"><span class="mu-tocar-ico">' + ICO.play + "</span><span>Tocar a trilha</span></button>";
  }

  function montar() {
    if (raiz) raiz.remove();
    raiz = null; painel = null; aberto = false; carregado = false; fixo = false;
    var e = info();
    document.body.classList.toggle("com-musica", !!e);
    if (!e) return;
    var t = trilha(), nome = t.rotulo || "Trilha sonora";
    raiz = document.createElement("div");
    raiz.className = "musica";
    /* painel no estilo "cartão de créditos" de cinema: faixas finas em cima
       e embaixo, nome em letra de cinema, a tela do player com vinheta */
    raiz.innerHTML =
      '<div class="mu-painel" id="mu-painel" role="dialog" aria-label="' + esc(nome) + '" aria-hidden="true">' +
        '<div class="mu-cab">' +
          '<div class="mu-cab-txt"><span class="mu-kicker">&#9835; ' + esc(e.servico) + "</span>" +
          '<span class="mu-titulo">' + esc(nome) + "</span></div>" +
          '<button type="button" class="mu-ico" data-mu="minimizar" aria-label="Minimizar (a música continua)" title="Minimizar (a música continua)">' + ICO.min + "</button>" +
          '<button type="button" class="mu-ico" data-mu="fechar" aria-label="Parar e fechar" title="Parar e fechar">' + ICO.x + "</button>" +
        "</div>" +
        '<div class="mu-tela"><div class="mu-player" style="height:' + e.altura + 'px">' + botaoTocar() + "</div>" +
          '<p class="mu-carregando" aria-live="polite"><i></i><i></i><i></i> carregando a trilha</p></div>' +
        (e.servico === "Spotify"
          ? '<p class="mu-nota">No Spotify, quem não está logado ouve só uma prévia de cada música. O volume é o do seu aparelho.</p>'
          : '<label class="mu-volume"><span class="mu-vol-ico">' + ICO.vol + '</span><input type="range" min="0" max="100" step="1" value="' + volumeInicial() + '" aria-label="Volume da música" style="--pct:' + volumeInicial() + '%"><output>' + volumeInicial() + "%</output></label>") +
      "</div>" +
      '<button type="button" class="mu-botao" data-mu="alternar" aria-expanded="false" aria-controls="mu-painel">' +
        '<span class="mu-disco" aria-hidden="true"><i></i></span>' +
        '<span class="mu-txt">' + esc(nome) + "</span>" +
        '<span class="mu-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>';
    document.body.appendChild(raiz);
    painel = raiz.querySelector(".mu-painel");
    var faixa = raiz.querySelector(".mu-volume input");
    if (faixa) faixa.addEventListener("input", function () {
      volume = Number(faixa.value);
      faixa.nextElementSibling.textContent = volume + "%";
      faixa.style.setProperty("--pct", volume + "%");
      var ic = raiz.querySelector(".mu-vol-ico");
      ic.classList.toggle("mudo", volume === 0);
      ic.classList.toggle("baixo", volume > 0 && volume < 50);
      rampa(volume, 450);
    });
    raiz.addEventListener("click", function (ev) {
      var b = ev.target.closest("[data-mu]");
      if (!b) return;
      var acao = b.dataset.mu;
      if (acao === "alternar") {
        /* clique: fixa aberto e toca; se já estava fixo, fecha (a música continua) */
        if (fixo) { fixo = false; minimizar(); }
        else { fixo = true; abrir(); }
      }
      else if (acao === "tocar") { fixo = true; abrir(); }
      else if (acao === "minimizar") { fixo = false; minimizar(); }
      else if (acao === "fechar") { fixo = false; fechar(); }
      pintarFixo();
    });
    /* mouse por cima abre (sem tocar); mouse fora fecha, se não estiver fixo */
    if (temMouse) {
      raiz.addEventListener("mouseenter", function () { clearTimeout(timerSaida); preconectar(); if (!aberto) mostrar(); });
      raiz.addEventListener("mouseleave", function () {
        clearTimeout(timerSaida);
        timerSaida = setTimeout(function () { if (!fixo) minimizar(); }, 250);
      });
    }
  }

  /* otimização: avisa o navegador pra já abrir conexão com o serviço de
     música (o player carrega mais rápido quando a pessoa clicar) */
  var preconectado = false;
  function preconectar() {
    if (preconectado) return;
    preconectado = true;
    var e = info(); if (!e) return;
    var hosts = e.servico === "YouTube" ? ["https://www.youtube-nocookie.com", "https://i.ytimg.com", "https://www.google.com"]
      : e.servico === "Spotify" ? ["https://open.spotify.com"] : ["https://w.soundcloud.com"];
    hosts.forEach(function (h) { var l = document.createElement("link"); l.rel = "preconnect"; l.href = h; l.crossOrigin = ""; document.head.appendChild(l); });
  }

  function pintarFixo() {
    if (!raiz) return;
    raiz.classList.toggle("fixo", fixo);
    var b = raiz.querySelector(".mu-botao");
    b.setAttribute("aria-pressed", String(fixo));
    b.title = fixo ? "Clique pra fechar (a música continua)" : "Clique pra deixar aberto e tocar";
  }
  /* só mostra o painel (passar o mouse): não cria o player, não toca */
  function mostrar() {
    if (!raiz) return;
    painel.setAttribute("aria-hidden", "false"); aberto = true;
    raiz.classList.add("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "true");
  }
  /* o player (iframe) só é criado no clique: nada carrega nem toca antes disso */
  function abrir() {
    var e = info();
    if (!e || !raiz) return false;
    preconectar();
    if (!carregado) {
      var bt = raiz.querySelector(".mu-tocar"); if (bt) bt.remove();
      var f = document.createElement("iframe");
      f.src = e.src;
      f.title = "Player de música (" + e.servico + ")";
      f.allow = "autoplay; encrypted-media; clipboard-write; picture-in-picture";
      f.setAttribute("loading", "eager");
      f.referrerPolicy = "strict-origin-when-cross-origin";
      raiz.classList.add("carregando");
      f.addEventListener("load", function () { raiz.classList.remove("carregando"); aoCarregar(); });
      raiz.querySelector(".mu-player").appendChild(f);
      carregado = true;
      raiz.classList.add("tocando");
    }
    painel.setAttribute("aria-hidden", "false");
    aberto = true;
    raiz.classList.add("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "true");
    return true;
  }
  function minimizar() {
    if (!raiz) return;
    painel.setAttribute("aria-hidden", "true"); aberto = false;
    raiz.classList.remove("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "false");
  }
  /* fechar: o volume desce devagar (fade-out) e só então o player sai */
  function fechar() {
    if (!raiz) return;
    limparInicio();
    minimizar();
    var r0 = raiz;
    rampa(0, 700, function () {
      if (raiz !== r0) return;
      raiz.querySelector(".mu-player").innerHTML = botaoTocar();
      carregado = false;
      raiz.classList.remove("tocando");
    });
  }

  /* no painel o script só serve pra reconhecer o link (embed) */
  if (!document.body.classList.contains("admin")) montar();
  return { montar: montar, abrir: abrir, embed: embed };
})();
