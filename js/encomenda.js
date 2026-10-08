"use strict";

/*
 * "Crie seu personagem" — a calculadora de encomendas (mesma mecânica do
 * site da Anne: monta itens, soma, aplica desconto por volume e uso
 * comercial, e fecha pela DM/WhatsApp com o resumo pronto).
 *
 * Preço de UMA arte:
 *   base do enquadramento
 *   × (1 + personagens extras × % do personagem extra)
 *   × fator do acabamento
 *   + preço do fundo
 * Depois: × quantidade → soma → − desconto de volume → + uso comercial.
 *
 * Out/2026 (pedido da Bru): duas categorias — "Crie sua Ilustração" (a de
 * sempre) e "Crie sua Identidade Visual" (3 pacotes com preço fixo; preço 0 =
 * "sob consulta"). Desconto de volume e uso comercial valem só pra ilustração.
 * O botão principal manda o pedido pro WhatsApp; copiar o resumo fica pro
 * Instagram (a DM não aceita texto pronto e pede login).
 */
var Encomenda = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var P = function () { return SITE.precos; };

  var proximoId = 1;
  var pedido = { itens: [], comercial: false };
  var rascunho = { enq: null, acab: null, pers: 1, fundo: null, qtd: 1 };
  var tipo = "ilu";          // "ilu" (ilustração) ou "idv" (identidade visual)
  var pacoteSel = null;

  function pacotes() { return ((P().identidade || {}).pacotes) || []; }
  function ehIdv(item) { return item.tipo === "idv"; }

  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }

  /* se o painel removeu a opção escolhida, volta pra primeira que existe */
  function garantirRascunho() {
    var p = P();
    if (!porId(p.enquadramentos, rascunho.enq)) rascunho.enq = (p.enquadramentos[0] || {}).id;
    if (!porId(p.acabamentos, rascunho.acab)) rascunho.acab = (p.acabamentos[0] || {}).id;
    if (!porId(p.fundos, rascunho.fundo)) rascunho.fundo = (p.fundos[0] || {}).id;
    rascunho.pers = Math.min(Math.max(1, rascunho.pers), maxPers());
    if (!porId(pacotes(), pacoteSel)) pacoteSel = (pacotes()[0] || {}).id;
    if (!pacotes().length) tipo = "ilu";
    pedido.itens = pedido.itens.filter(function (i) {
      if (ehIdv(i)) return !!porId(pacotes(), i.pacote);
      return porId(p.enquadramentos, i.enq) && porId(p.acabamentos, i.acab) && porId(p.fundos, i.fundo);
    });
  }
  function maxPers() { return Math.max(1, Number(P().maxPersonagens) || 1); }

  /* ===== cálculo ===== */
  function precoUnitario(item) {
    var p = P();
    if (ehIdv(item)) return Number((porId(pacotes(), item.pacote) || {}).preco) || 0;
    var enq = porId(p.enquadramentos, item.enq), acab = porId(p.acabamentos, item.acab), fundo = porId(p.fundos, item.fundo);
    if (!enq || !acab || !fundo) return 0;
    var extras = (item.pers - 1) * (Number(p.personagemExtraPct) || 0) / 100;
    return Number(enq.preco) * (1 + extras) * Number(acab.fator) + Number(fundo.preco || 0);
  }
  function subtotal(item) { return precoUnitario(item) * item.qtd; }

  function calcular() {
    var faixas = (P().descontosVolume || []).slice().sort(function (a, b) { return a.min - b.min; });
    var ilu = pedido.itens.filter(function (i) { return !ehIdv(i); });
    var idv = pedido.itens.filter(ehIdv);
    var qtdTotal = ilu.reduce(function (t, i) { return t + i.qtd; }, 0);
    var bruto = ilu.reduce(function (t, i) { return t + subtotal(i); }, 0);
    var idvTotal = idv.reduce(function (t, i) { return t + subtotal(i); }, 0);
    var aCombinar = idv.some(function (i) { return !precoUnitario(i); });
    var faixa = faixas.reduce(function (m, f) { return qtdTotal >= f.min ? f : m; }, { min: 0, pct: 0 });
    var desconto = bruto * (Number(faixa.pct) || 0) / 100;
    var comercial = pedido.comercial ? (bruto - desconto) * (Number(P().comercialPct) || 0) / 100 : 0;
    var proxima = faixas.filter(function (f) { return f.min > qtdTotal && f.pct > (faixa.pct || 0); })[0];
    return { qtdTotal: qtdTotal, temIlu: ilu.length > 0, temIdv: idv.length > 0, idvTotal: idvTotal, aCombinar: aCombinar,
      soCombinar: aCombinar && ilu.length === 0 && idvTotal === 0,
      bruto: bruto, pct: Number(faixa.pct) || 0, desconto: desconto, comercial: comercial, total: bruto - desconto + comercial + idvTotal, proxima: proxima };
  }

  function descricao(item) {
    var p = P();
    if (ehIdv(item)) return "Identidade Visual · " + porId(pacotes(), item.pacote).nome;
    var partes = [porId(p.enquadramentos, item.enq).nome, porId(p.acabamentos, item.acab).nome];
    if (item.pers > 1) partes.push(item.pers + " personagens");
    var fundo = porId(p.fundos, item.fundo);
    if (fundo && Number(fundo.preco) > 0) partes.push(fundo.nome.toLowerCase());
    return partes.join(" · ");
  }

  function aberta() { return estadoAgenda().estado === "aberta"; }

  function resumo() {
    var c = calcular();
    var L = [aberta() ? "Oi, Bru! Montei um pedido no seu site ✨" : "Oi, Bru! Quero entrar na lista de espera com este pedido ✨", ""];
    pedido.itens.forEach(function (i) { L.push("• " + i.qtd + "x " + descricao(i) + " — " + valorTxt(i)); });
    L.push("");
    if (c.pct > 0) L.push("Desconto de volume: " + c.pct + "% (" + c.qtdTotal + " artes)");
    if (pedido.comercial && c.temIlu) L.push("Uso comercial: +" + P().comercialPct + "%");
    L.push("Total estimado*: " + totalTxt(c));
    if (P().notaTotal) L.push("*" + P().notaTotal);
    L.push("", c.temIdv && !c.temIlu ? "Te conto mais sobre a marca por aqui!" : "Te mando as referências por aqui!");
    return L.join("\n");
  }

  function valorTxt(item) { var v = subtotal(item); return v ? brl(v) : "sob consulta"; }
  function totalTxt(c) {
    if (c.soCombinar) return "a combinar";
    return brl(c.total) + (c.aCombinar ? " + identidade visual a combinar" : "");
  }

  /* ===== desenho ===== */
  function opcaoHtml(grupo, o, sel, precoTxt) {
    var foto = urlSegura(o.img, true);
    return '<button type="button" class="opcao' + (foto ? "" : " so-texto") + '" data-grupo="' + grupo + '" data-id="' + esc(o.id) + '" aria-pressed="' + (o.id === sel) + '">' +
      (foto ? '<img src="' + esc(foto) + '" alt="" loading="lazy">' : "") +
      '<span class="o-nome">' + esc(o.nome) + "</span>" +
      (precoTxt ? '<span class="o-preco">' + precoTxt + "</span>" : "") +
      (o.desc ? '<span class="o-desc">' + esc(o.desc) + "</span>" : "") + "</button>";
  }

  function fatorTxt(f) {
    f = Number(f);
    if (f === 1) return "preço base";
    var pct = Math.round((f - 1) * 100);
    return (pct > 0 ? "+" : "") + pct + "%";
  }

  function renderOpcoes() {
    var p = P();
    $("#op-enquadramento").innerHTML = p.enquadramentos.map(function (o) { return opcaoHtml("enq", o, rascunho.enq, esc(brl(o.preco))); }).join("");
    $("#op-acabamento").innerHTML = p.acabamentos.map(function (o) { return opcaoHtml("acab", o, rascunho.acab, esc(fatorTxt(o.fator))); }).join("");
    $("#op-fundo").innerHTML = p.fundos.map(function (o) { return opcaoHtml("fundo", o, rascunho.fundo, Number(o.preco) > 0 ? "+ " + esc(brl(o.preco)) : "incluso"); }).join("");
  }

  function renderRascunho() {
    $("#pers-qtd").textContent = rascunho.pers;
    $("#pers-menos").disabled = rascunho.pers <= 1;
    $("#pers-mais").disabled = rascunho.pers >= maxPers();
    $("#pers-nota").textContent = "Cada personagem extra na mesma arte: +" + (Number(P().personagemExtraPct) || 0) + "% do enquadramento.";
    $("#qtd").textContent = rascunho.qtd;
    $("#qtd-menos").disabled = rascunho.qtd <= 1;
    $("#qtd-mais").disabled = rascunho.qtd >= 20;
    $("#rascunho-preco").innerHTML = "<small>esta arte</small>" + esc(brl(subtotal(rascunho)));
  }

  /* as duas abas: "Crie sua Ilustração" e "Crie sua Identidade Visual" */
  function renderTipos() {
    var p = P(), il = p.ilustracao || {}, id = p.identidade || {};
    var abas = [{ k: "ilu", t: il.titulo || "Crie sua Ilustração", s: il.sub }];
    if (pacotes().length) abas.push({ k: "idv", t: id.titulo || "Crie sua Identidade Visual", s: id.sub });
    $("#enc-tipos").hidden = abas.length < 2;
    $("#enc-tipos").innerHTML = abas.map(function (a) {
      return '<button type="button" class="enc-tipo" data-tipo="' + a.k + '" aria-pressed="' + (a.k === tipo) + '"><b>' + esc(a.t) + "</b>" + (a.s ? "<small>" + esc(a.s) + "</small>" : "") + "</button>";
    }).join("");
    $("#monta-ilu").hidden = tipo !== "ilu";
    $("#monta-idv").hidden = tipo !== "idv";
  }

  function renderPacotes() {
    $("#op-pacotes").innerHTML = pacotes().map(function (pc, i) {
      var itens = String(pc.itens || "").split("·").map(function (x) { return x.trim(); }).filter(Boolean);
      return '<button type="button" class="pacote" data-pacote="' + esc(pc.id) + '" aria-pressed="' + (pc.id === pacoteSel) + '">' +
        '<span class="pacote-topo"><span><span class="pacote-n">' + (i + 1) + " · " + esc(pc.nome) + '</span><br><span class="pacote-nome">' + esc(pc.sub || pc.nome) + "</span></span>" +
        '<span class="pacote-preco">' + (Number(pc.preco) ? esc(brl(pc.preco)) : "sob consulta") + "</span></span>" +
        (itens.length ? "<ul>" + itens.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>" : "") + "</button>";
    }).join("");
    var sel = porId(pacotes(), pacoteSel) || {};
    $("#idv-preco").innerHTML = "<small>este pacote</small>" + (Number(sel.preco) ? esc(brl(sel.preco)) : "sob consulta");
  }

  function renderPedido() {
    var c = calcular(), vazio = pedido.itens.length === 0;
    $("#pedido-vazio").hidden = !vazio;
    $("#comercial-linha").hidden = !c.temIlu;
    $("#pedido-itens").innerHTML = pedido.itens.map(function (i) {
      var passo = ehIdv(i) ? "" : '<span class="stepper"><button type="button" data-acao="menos" aria-label="Diminuir"' + (i.qtd <= 1 ? " disabled" : "") + ">&minus;</button><output>" + i.qtd +
        '</output><button type="button" data-acao="mais" aria-label="Aumentar"' + (i.qtd >= 20 ? " disabled" : "") + ">+</button></span>";
      return '<li class="pi" data-id="' + i.id + '"><span class="pi-desc">' + i.qtd + "x " + esc(descricao(i)) + '</span><span class="pi-valor">' + esc(valorTxt(i)) + "</span>" +
        '<span class="pi-acoes">' + passo + '<button type="button" class="pi-rem" data-acao="remover">remover</button></span></li>';
    }).join("");

    var aviso = "";
    if (c.temIlu) {
      if (c.pct > 0) aviso = c.pct + "% de desconto aplicado (" + c.qtdTotal + " artes).";
      if (c.proxima) aviso += (aviso ? " " : "") + "Com " + c.proxima.min + " artes no pedido o desconto vai pra " + c.proxima.pct + "%.";
    }
    $("#pedido-desconto").textContent = aviso;
    $("#comercial-txt").textContent = "Pra revender, estampar produto ou usar em capa. Acrescenta " + (Number(P().comercialPct) || 0) + "% ao valor.";

    var linhas = [];
    if (c.temIlu) {
      linhas.push('<div class="row"><span>Subtotal (' + c.qtdTotal + (c.qtdTotal === 1 ? " arte" : " artes") + ")</span><span>" + esc(brl(c.bruto)) + "</span></div>");
      if (c.pct > 0) linhas.push('<div class="row"><span>Desconto de volume (' + c.pct + "%)</span><span>&minus; " + esc(brl(c.desconto)) + "</span></div>");
      if (pedido.comercial) linhas.push('<div class="row"><span>Uso comercial (+' + P().comercialPct + "%)</span><span>" + esc(brl(c.comercial)) + "</span></div>");
    }
    if (c.temIdv) linhas.push('<div class="row"><span>Identidade visual</span><span>' + (c.idvTotal ? esc(brl(c.idvTotal)) : "") + (c.aCombinar ? (c.idvTotal ? " + " : "") + "a combinar" : "") + "</span></div>");
    linhas.push('<div class="row total"><span class="rotulo">total estimado<sup>*</sup></span><strong>' + (c.soCombinar ? "A combinar" : esc(brl(c.total))) + "</strong></div>");
    if (P().notaTotal) linhas.push('<p class="total-nota"><b>*</b> ' + esc(P().notaTotal) + "</p>");
    $("#recibo").innerHTML = linhas.join("");

    /* botão principal: WhatsApp (com o resumo já escrito). Sem número no painel,
       volta a ser a DM do Instagram como antes. */
    var whats = contatoTemWhats();
    var cta = $("#fechar");
    cta.href = contatoLink(resumo());
    cta.setAttribute("aria-disabled", String(vazio));
    var txtCta = whats ? (aberta() ? "Enviar pedido no WhatsApp" : "Lista de espera no WhatsApp") : (aberta() ? "Fechar na DM" : "Entrar na lista de espera");
    cta.innerHTML = (whats ? iconeSvg("whatsapp") : "") + "<span>" + esc(txtCta) + "</span>";

    var cop = $("#copiar");
    if (!cop.dataset.ocupado) cop.innerHTML = whats ? iconeSvg("instagram") + "<span>Copiar resumo pro Instagram</span>" : "<span>Copiar resumo</span>";
    $("#pedido-nota").textContent = whats
      ? "O resumo já vai escrito na mensagem do WhatsApp. 50% pra começar, 50% depois do esboço."
      : "A DM do Instagram não aceita texto pronto: o resumo é copiado sozinho, é só colar na conversa.";
    var ig = $("#pedido-ig");
    ig.hidden = !whats || !SITE.perfil.instagram;
    if (!ig.hidden) ig.innerHTML = "Prefere o Instagram? Copie o resumo e cole na minha DM: " +
      '<a href="https://ig.me/m/' + encodeURIComponent(SITE.perfil.instagram) + '" target="_blank" rel="noopener">@' + esc(SITE.perfil.instagram) + " &#8599;</a>";

    $("#barra-valor").textContent = c.soCombinar ? "A combinar" : brl(c.total);
  }

  /* faixa no topo da calculadora: sempre mostra a situação da agenda */
  function renderAviso() {
    var av = $("#enc-aviso"), ag = estadoAgenda();
    var txt;
    if (ag.estado === "aberta") {
      txt = "<b>" + esc(ag.atual.sessao.nome) + "</b>: " + ag.atual.livres + " de " + ag.atual.vagas + (ag.atual.vagas === 1 ? " vaga livre" : " vagas livres") + ". A vaga é garantida quando o pagamento de 50% é confirmado.";
    } else if (ag.estado === "esgotado") {
      txt = "<b>" + esc(ag.atual.sessao.nome) + "</b> está esgotada. Você pode montar seu pedido e mandar pra lista de espera" +
        (ag.proxima ? " da próxima agenda, que abre em " + esc(dataExtenso(ag.proxima.abre)) : "") + ".";
    } else {
      txt = "As encomendas estão fechadas agora" + (ag.proxima ? " (a <b>" + esc(ag.proxima.sessao.nome) + "</b> abre em " + esc(dataExtenso(ag.proxima.abre)) + ")" : "") +
        ". Você pode simular seu pedido e mandar pra lista de espera.";
    }
    av.hidden = false;
    av.className = "enc-aviso " + ag.estado;
    av.innerHTML = etiquetaHtml(ag.estado) + "<p>" + txt + ' <a href="agenda.html">ver agenda</a></p>';
  }

  function regras() {
    $("#regras").innerHTML = (P().regras || []).map(function (r, i) {
      return '<div class="regra"><b>0' + (i + 1) + "</b><span>" + esc(r) + "</span></div>";
    }).join("");
  }

  function renderTabela() {
    var t = P().tabela || {}, caixa = $("#tabela-dela"), url = urlSegura(t.img, true);
    if (!caixa) return;
    caixa.hidden = t.mostrar === false || !url;
    if (caixa.hidden) return;
    var im = $("#tabela-img");
    if (im.getAttribute("src") !== url) {
      im.src = url;
      if (t.w && t.h) { im.width = t.w; im.height = t.h; } else { im.removeAttribute("width"); im.removeAttribute("height"); }
    }
    $("#tabela-btn").setAttribute("data-lb-src", url);
    $("#tabela-legenda").textContent = t.legenda || "";
  }

  function render() {
    renderTabela();
    garantirRascunho();
    renderTipos();
    renderPacotes();
    renderOpcoes();
    renderRascunho();
    renderPedido();
    renderAviso();
    regras();
  }

  /* ===== cópia do resumo ===== */
  function copiar(txt) {
    return new Promise(function (ok, falha) {
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(ok, tentar);
      else tentar();
      function tentar() {
        var ta = document.createElement("textarea");
        ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
        document.body.appendChild(ta); ta.select();
        try { document.execCommand("copy"); ok(); } catch (e) { falha(e); }
        document.body.removeChild(ta);
      }
    });
  }

  function ligar() {
    document.addEventListener("click", function (e) {
      var op = e.target.closest(".opcao[data-grupo]");
      if (op) { rascunho[op.dataset.grupo] = op.dataset.id; render(); return; }
      var tp = e.target.closest(".enc-tipo[data-tipo]");
      if (tp) { tipo = tp.dataset.tipo; render(); return; }
      var pc = e.target.closest(".pacote[data-pacote]");
      if (pc) { pacoteSel = pc.dataset.pacote; render(); return; }
      var ac = e.target.closest(".pi [data-acao]");
      if (ac) {
        var id = Number(ac.closest(".pi").dataset.id);
        var item = pedido.itens.filter(function (i) { return i.id === id; })[0];
        if (ac.dataset.acao === "remover") pedido.itens = pedido.itens.filter(function (i) { return i.id !== id; });
        else if (item && ac.dataset.acao === "mais" && item.qtd < 20) item.qtd++;
        else if (item && ac.dataset.acao === "menos" && item.qtd > 1) item.qtd--;
        render();
      }
    });
    $("#pers-mais").addEventListener("click", function () { rascunho.pers++; render(); });
    $("#pers-menos").addEventListener("click", function () { rascunho.pers--; render(); });
    $("#qtd-mais").addEventListener("click", function () { if (rascunho.qtd < 20) { rascunho.qtd++; render(); } });
    $("#qtd-menos").addEventListener("click", function () { if (rascunho.qtd > 1) { rascunho.qtd--; render(); } });
    $("#add-item").addEventListener("click", function () {
      pedido.itens.push({ id: proximoId++, enq: rascunho.enq, acab: rascunho.acab, pers: rascunho.pers, fundo: rascunho.fundo, qtd: rascunho.qtd });
      rascunho.qtd = 1;
      render();
      var b = this;
      b.textContent = "Adicionado ✓"; b.classList.add("adicionado");
      setTimeout(function () { b.textContent = "Adicionar ao pedido"; b.classList.remove("adicionado"); }, 1400);
      /* no celular o pedido fica embaixo: rola até ele pra pessoa ver que entrou */
      if (window.innerWidth < 980) $("#pedido").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#add-idv").addEventListener("click", function () {
      if (!pacoteSel) return;
      /* um pacote de identidade por pedido: trocar o pacote substitui o anterior */
      pedido.itens = pedido.itens.filter(function (i) { return !ehIdv(i); });
      pedido.itens.push({ id: proximoId++, tipo: "idv", pacote: pacoteSel, qtd: 1 });
      render();
      var b = this;
      b.textContent = "Adicionado ✓"; b.classList.add("adicionado");
      setTimeout(function () { b.textContent = "Adicionar ao pedido"; b.classList.remove("adicionado"); }, 1400);
      if (window.innerWidth < 980) $("#pedido").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    $("#comercial").addEventListener("change", function (e) { pedido.comercial = e.target.checked; render(); });
    $("#copiar").addEventListener("click", function () {
      var b = this;
      if (pedido.itens.length === 0) { avisoSite("Monte seu pedido primeiro ✨"); return; }
      b.dataset.ocupado = "1";
      copiar(resumo()).then(function () {
        b.textContent = "Copiado!";
        if (contatoTemWhats()) avisoSite("Resumo copiado! É só colar na minha DM do Instagram ✨");
      }, function () { b.textContent = "Não deu pra copiar"; })
        .then(function () { setTimeout(function () { delete b.dataset.ocupado; renderPedido(); }, 1800); });
    });
    $("#fechar").addEventListener("click", function (e) {
      if (pedido.itens.length === 0) { e.preventDefault(); return; }
      if (!contatoTemWhats()) copiar(resumo()).catch(function () {});
    });

    /* barra do total aparece só enquanto a cena de encomendas está na tela */
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          $("#barra-total").classList.toggle("ativa", en.isIntersecting);
          $("#barra-total").setAttribute("aria-hidden", String(!en.isIntersecting));
        });
      }, { threshold: 0.08 }).observe($("#encomendas"));
    }
  }

  ligar();
  render();
  return { recarregar: render };
})();
