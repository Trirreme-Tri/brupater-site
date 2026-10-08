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
      var extra = "&loop=1&rel=0&playsinline=1&autoplay=1&enablejsapi=1&origin=" + encodeURIComponent(location.origin);
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

  var volume = null; // o que a pessoa escolheu no controle (vale nesta visita)
  function volumeInicial() {
    var v = Number(trilha().volume);
    return isNaN(v) ? 50 : Math.max(0, Math.min(100, Math.round(v)));
  }
  /* manda o volume pro player (YouTube e SoundCloud aceitam por mensagem) */
  function aplicarVolume(v) {
    var f = raiz && raiz.querySelector(".mu-player iframe"), e = info();
    if (!f || !f.contentWindow || !e) return;
    if (e.servico === "YouTube") f.contentWindow.postMessage(JSON.stringify({ event: "command", func: "setVolume", args: [v] }), "*");
    if (e.servico === "SoundCloud") f.contentWindow.postMessage(JSON.stringify({ method: "setVolume", value: v }), "*");
  }
  /* o player demora pra ficar pronto: repete o volume algumas vezes no começo */
  function volumeAoCarregar() {
    var n = 0, t = setInterval(function () { aplicarVolume(volume == null ? volumeInicial() : volume); if (++n >= 12) clearInterval(t); }, 500);
  }

  function trilha() { return (window.SITE && SITE.perfil && SITE.perfil.trilha) || {}; }
  function info() { var t = trilha(); return t.mostrar === false ? null : embed(t.url); }

  function montar() {
    if (raiz) raiz.remove();
    raiz = null; painel = null; aberto = false; carregado = false; fixo = false;
    var e = info();
    document.body.classList.toggle("com-musica", !!e);
    if (!e) return;
    var t = trilha();
    raiz = document.createElement("div");
    raiz.className = "musica";
    raiz.innerHTML =
      '<div class="mu-painel" id="mu-painel" role="dialog" aria-label="Trilha sonora" hidden>' +
        '<div class="mu-cab"><span class="mu-titulo">' + esc(t.rotulo || "Trilha sonora") + " <small>" + esc(e.servico) + "</small></span>" +
          '<button type="button" class="mu-ico" data-mu="minimizar" aria-label="Minimizar (a música continua)" title="Minimizar (a música continua)">&#8211;</button>' +
          '<button type="button" class="mu-ico" data-mu="fechar" aria-label="Parar e fechar" title="Parar e fechar">&times;</button></div>' +
        '<div class="mu-player" style="height:' + e.altura + 'px"><button type="button" class="mu-tocar" data-mu="tocar"><span aria-hidden="true">&#9654;</span> Tocar a trilha</button></div>' +
        (e.servico === "Spotify"
          ? '<p class="mu-nota">No Spotify, quem não está logado ouve só uma prévia de cada música. O volume é o do seu aparelho.</p>'
          : '<label class="mu-volume"><span class="mu-vol-ico" aria-hidden="true">&#128264;</span><input type="range" min="0" max="100" step="5" value="' + volumeInicial() + '" aria-label="Volume da música"><output>' + volumeInicial() + "%</output></label>") +
      "</div>" +
      '<button type="button" class="mu-botao" data-mu="alternar" aria-expanded="false" aria-controls="mu-painel">' +
        '<span class="mu-eq" aria-hidden="true"><i></i><i></i><i></i></span><span class="mu-txt">' + esc(t.rotulo || "Trilha sonora") + "</span></button>";
    document.body.appendChild(raiz);
    painel = raiz.querySelector(".mu-painel");
    var faixa = raiz.querySelector(".mu-volume input");
    if (faixa) faixa.addEventListener("input", function () {
      volume = Number(faixa.value);
      faixa.nextElementSibling.textContent = volume + "%";
      raiz.querySelector(".mu-vol-ico").innerHTML = volume === 0 ? "&#128263;" : volume < 50 ? "&#128264;" : "&#128266;";
      aplicarVolume(volume);
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
      raiz.addEventListener("mouseenter", function () { clearTimeout(timerSaida); if (!aberto) mostrar(); });
      raiz.addEventListener("mouseleave", function () {
        clearTimeout(timerSaida);
        timerSaida = setTimeout(function () { if (!fixo) minimizar(); }, 250);
      });
    }
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
    painel.hidden = false; aberto = true;
    raiz.classList.add("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "true");
  }
  /* o player (iframe) só é criado no clique: nada carrega nem toca antes disso */
  function abrir() {
    var e = info();
    if (!e || !raiz) return false;
    if (!carregado) {
      var bt = raiz.querySelector(".mu-tocar"); if (bt) bt.remove();
      var f = document.createElement("iframe");
      f.src = e.src;
      f.title = "Player de música (" + e.servico + ")";
      f.allow = "autoplay; encrypted-media; clipboard-write; picture-in-picture";
      f.setAttribute("loading", "eager");
      f.referrerPolicy = "strict-origin-when-cross-origin";
      f.addEventListener("load", volumeAoCarregar);
      raiz.querySelector(".mu-player").appendChild(f);
      carregado = true;
      raiz.classList.add("tocando");
    }
    painel.hidden = false;
    aberto = true;
    raiz.classList.add("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "true");
    return true;
  }
  function minimizar() {
    if (!raiz) return;
    painel.hidden = true; aberto = false;
    raiz.classList.remove("aberto");
    raiz.querySelector(".mu-botao").setAttribute("aria-expanded", "false");
  }
  /* fechar remove o player: a música para de verdade */
  function fechar() {
    if (!raiz) return;
    raiz.querySelector(".mu-player").innerHTML = '<button type="button" class="mu-tocar" data-mu="tocar"><span aria-hidden="true">&#9654;</span> Tocar a trilha</button>';
    carregado = false;
    raiz.classList.remove("tocando");
    minimizar();
  }

  /* no painel o script só serve pra reconhecer o link (embed) */
  if (!document.body.classList.contains("admin")) montar();
  return { montar: montar, abrir: abrir, embed: embed };
})();
