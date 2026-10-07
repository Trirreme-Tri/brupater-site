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
 */
var Encomenda = (function () {
  var $ = function (s) { return document.querySelector(s); };
  var P = function () { return SITE.precos; };

  var proximoId = 1;
  var pedido = { itens: [], comercial: false };
  var rascunho = { enq: null, acab: null, pers: 1, fundo: null, qtd: 1 };

  function porId(lista, id) { return lista.filter(function (x) { return x.id === id; })[0]; }

  /* se o painel removeu a opção escolhida, volta pra primeira que existe */
  function garantirRascunho() {
    var p = P();
    if (!porId(p.enquadramentos, rascunho.enq)) rascunho.enq = (p.enquadramentos[0] || {}).id;
    if (!porId(p.acabamentos, rascunho.acab)) rascunho.acab = (p.acabamentos[0] || {}).id;
    if (!porId(p.fundos, rascunho.fundo)) rascunho.fundo = (p.fundos[0] || {}).id;
    rascunho.pers = Math.min(Math.max(1, rascunho.pers), maxPers());
    pedido.itens = pedido.itens.filter(function (i) {
      return porId(p.enquadramentos, i.enq) && porId(p.acabamentos, i.acab) && porId(p.fundos, i.fundo);
    });
  }
  function maxPers() { return Math.max(1, Number(P().maxPersonagens) || 1); }

  /* ===== cálculo ===== */
  function precoUnitario(item) {
    var p = P();
    var enq = porId(p.enquadramentos, item.enq), acab = porId(p.acabamentos, item.acab), fundo = porId(p.fundos, item.fundo);
    if (!enq || !acab || !fundo) return 0;
    var extras = (item.pers - 1) * (Number(p.personagemExtraPct) || 0) / 100;
    return Number(enq.preco) * (1 + extras) * Number(acab.fator) + Number(fundo.preco || 0);
  }
  function subtotal(item) { return precoUnitario(item) * item.qtd; }

  function calcular() {
    var faixas = (P().descontosVolume || []).slice().sort(function (a, b) { return a.min - b.min; });
    var qtdTotal = pedido.itens.reduce(function (t, i) { return t + i.qtd; }, 0);
    var bruto = pedido.itens.reduce(function (t, i) { return t + subtotal(i); }, 0);
    var faixa = faixas.reduce(function (m, f) { return qtdTotal >= f.min ? f : m; }, { min: 0, pct: 0 });
    var desconto = bruto * (Number(faixa.pct) || 0) / 100;
    var comercial = pedido.comercial ? (bruto - desconto) * (Number(P().comercialPct) || 0) / 100 : 0;
    var proxima = faixas.filter(function (f) { return f.min > qtdTotal && f.pct > (faixa.pct || 0); })[0];
    return { qtdTotal: qtdTotal, bruto: bruto, pct: Number(faixa.pct) || 0, desconto: desconto, comercial: comercial, total: bruto - desconto + comercial, proxima: proxima };
  }

  function descricao(item) {
    var p = P();
    var partes = [porId(p.enquadramentos, item.enq).nome, porId(p.acabamentos, item.acab).nome];
    if (item.pers > 1) partes.push(item.pers + " personagens");
    var fundo = porId(p.fundos, item.fundo);
    if (fundo && Number(fundo.preco) > 0) partes.push(fundo.nome.toLowerCase());
    return partes.join(" · ");
  }

  function aberta() { return SITE.agenda.status === "aberta"; }

  function resumo() {
    var c = calcular();
    var L = [aberta() ? "Oi, Bru! Montei um pedido no seu site ✨" : "Oi, Bru! Quero entrar na lista de espera com este pedido ✨", ""];
    pedido.itens.forEach(function (i) { L.push("• " + i.qtd + "x " + descricao(i) + " — " + brl(subtotal(i))); });
    L.push("");
    if (c.pct > 0) L.push("Desconto de volume: " + c.pct + "% (" + c.qtdTotal + " artes)");
    if (pedido.comercial) L.push("Uso comercial: +" + P().comercialPct + "%");
    L.push("Total: " + brl(c.total), "", "Te mando as referências do personagem por aqui!");
    return L.join("\n");
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

  function renderPedido() {
    var c = calcular(), vazio = pedido.itens.length === 0;
    $("#pedido-vazio").hidden = !vazio;
    $("#comercial-linha").hidden = vazio;
    $("#pedido-itens").innerHTML = pedido.itens.map(function (i) {
      return '<li class="pi" data-id="' + i.id + '"><span class="pi-desc">' + i.qtd + "x " + esc(descricao(i)) + '</span><span class="pi-valor">' + esc(brl(subtotal(i))) + "</span>" +
        '<span class="pi-acoes"><span class="stepper"><button type="button" data-acao="menos" aria-label="Diminuir"' + (i.qtd <= 1 ? " disabled" : "") + ">&minus;</button><output>" + i.qtd +
        '</output><button type="button" data-acao="mais" aria-label="Aumentar"' + (i.qtd >= 20 ? " disabled" : "") + '>+</button></span><button type="button" class="pi-rem" data-acao="remover">remover</button></span></li>';
    }).join("");

    var aviso = "";
    if (!vazio) {
      if (c.pct > 0) aviso = c.pct + "% de desconto aplicado (" + c.qtdTotal + " artes).";
      if (c.proxima) aviso += (aviso ? " " : "") + "Com " + c.proxima.min + " artes no pedido o desconto vai pra " + c.proxima.pct + "%.";
    }
    $("#pedido-desconto").textContent = aviso;
    $("#comercial-txt").textContent = "Pra revender, estampar produto ou usar em capa. Acrescenta " + (Number(P().comercialPct) || 0) + "% ao valor.";

    var linhas = [];
    if (!vazio) {
      linhas.push('<div class="row"><span>Subtotal (' + c.qtdTotal + (c.qtdTotal === 1 ? " arte" : " artes") + ")</span><span>" + esc(brl(c.bruto)) + "</span></div>");
      if (c.pct > 0) linhas.push('<div class="row"><span>Desconto de volume (' + c.pct + "%)</span><span>&minus; " + esc(brl(c.desconto)) + "</span></div>");
      if (pedido.comercial) linhas.push('<div class="row"><span>Uso comercial (+' + P().comercialPct + "%)</span><span>" + esc(brl(c.comercial)) + "</span></div>");
    }
    linhas.push('<div class="row total"><span class="rotulo">total</span><strong>' + esc(brl(c.total)) + "</strong></div>");
    $("#recibo").innerHTML = linhas.join("");

    var whats = contatoTemWhats();
    var cta = $("#fechar");
    cta.href = contatoLink(resumo());
    cta.setAttribute("aria-disabled", String(vazio));
    cta.textContent = aberta() ? (whats ? "Fechar no WhatsApp" : "Fechar na DM") : "Entrar na lista de espera";
    $("#pedido-nota").textContent = whats
      ? "O resumo já vai escrito na mensagem. 50% pra começar, 50% depois do esboço."
      : "A DM do Instagram não aceita texto pronto: o resumo é copiado sozinho, é só colar na conversa.";

    $("#barra-valor").textContent = brl(c.total);
  }

  function renderAviso() {
    var av = $("#enc-aviso");
    av.hidden = aberta();
    if (aberta()) return;
    var st = STATUS[SITE.agenda.status] || STATUS.fechada;
    var abre = dataLocal(SITE.agenda.proximaAbertura);
    av.innerHTML = '<span class="etiqueta ' + st.classe + '">' + esc(st.etiqueta) + "</span><p>" +
      (SITE.agenda.status === "espera"
        ? "As vagas desta sessão já foram preenchidas, mas a lista de espera está aberta. Monte seu pedido e entre na lista: você é avisada(o) primeiro."
        : "As encomendas estão fechadas agora" + (abre ? " (previsão de abertura: " + esc(dataExtenso(abre)) + ")" : "") + ". Você pode simular seu pedido e mandar pra lista de espera.") +
      ' <a href="#agenda" style="color:var(--rosa)">ver agenda</a></p>';
  }

  function regras() {
    $("#regras").innerHTML = (P().regras || []).map(function (r, i) {
      return '<div class="regra"><b>0' + (i + 1) + "</b><span>" + esc(r) + "</span></div>";
    }).join("");
  }

  function render() {
    garantirRascunho();
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
    $("#comercial").addEventListener("change", function (e) { pedido.comercial = e.target.checked; render(); });
    $("#copiar").addEventListener("click", function () {
      var b = this;
      copiar(resumo()).then(function () { b.textContent = "Copiado!"; }, function () { b.textContent = "Não deu pra copiar"; })
        .then(function () { setTimeout(function () { b.textContent = "Copiar resumo"; }, 1800); });
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
