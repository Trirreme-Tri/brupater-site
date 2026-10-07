"use strict";

/* Página de apresentação: as partes que dependem do conteúdo atual (cores,
   fontes, preços) são lidas de SITE, então ela acompanha o que for mudado
   no painel. */
(function () {
  var $ = function (s) { return document.querySelector(s); };

  /* endereços completos, do jeito que vão aparecer no ar */
  var base = location.href.replace(/[^/]*([?#].*)?$/, "");
  $("#paginas-links").innerHTML = [["Início", ""], ["Portfólio", "portfolio.html"], ["Agenda", "agenda.html"], ["Encomendas", "encomendas.html"]].map(function (p) {
    var u = base + p[1];
    return '<li><b>' + p[0] + '</b><a class="url" href="' + esc(u) + '" target="_blank" rel="noopener">' + esc(u.replace(/^https?:\/\//, "")) + "</a></li>";
  }).join("");
  $("#url-painel").textContent = (base + "admin.html").replace(/^https?:\/\//, "");
  $("#url-painel").href = base + "admin.html";

  var ap = SITE.aparencia;
  var fontes = [
    { nome: ap.fontes.cinema, papel: "Fonte de cinema", uso: "Seu nome na abertura, títulos das cenas, preços, o \"FIM\". É alta e fina, como o COMMISSIONS do seu post.", amostra: "Brunna Paternostro", classe: "f-cinema" },
    { nome: ap.fontes.poster, papel: "Fonte de pôster", uso: "A ficha da personagem, a palavra gigante e os rótulos pequenos. Pesada, como o OÁSIS. Também é a letra dos textos do site.", amostra: "Força e ódio", classe: "f-poster" },
    { nome: ap.fontes.mao, papel: "Fonte de mão", uso: "A frase da abertura e as anotações, como o \"Savage!\" e o \"Hey!\" das suas artes.", amostra: "Colors and lines bring your ideas to life.", classe: "f-mao" }
  ];
  $("#fontes").innerHTML = fontes.map(function (f) {
    return '<div class="fonte"><p class="rotulo">' + esc(f.papel) + '</p><p class="fonte-amostra ' + f.classe + '">' + esc(f.amostra) + "</p>" +
      '<p class="fonte-nome">' + esc(f.nome) + "</p><p class=\"fonte-uso\">" + esc(f.uso) + "</p></div>";
  }).join("");

  var NOMES = {
    rosa: ["Rosa choque", "botões, etiquetas e destaques"],
    poster: ["Rosa do pôster", "títulos da ficha e números"],
    vinho: ["Vinho", "tons de fundo"],
    violeta: ["Violeta neon", "estrelas das vagas e brilho da agenda"],
    teal: ["Turquesa", "fila de produção e entregas"],
    papel: ["Papel", "fundo das seções impressas"],
    noite: ["Noite", "fundo das cenas de cinema"]
  };
  $("#cores").innerHTML = Object.keys(NOMES).map(function (k) {
    var hex = ap.cores[k];
    return '<div class="cor"><span class="amostra-cor" style="background:' + esc(hex) + '"></span><b>' + NOMES[k][0] + "</b><code>" + esc(String(hex).toUpperCase()) + "</code><small>" + NOMES[k][1] + "</small></div>";
  }).join("");

  /* exemplo com os preços atuais */
  var p = SITE.precos;
  var enq = p.enquadramentos[0], acab = p.acabamentos[p.acabamentos.length - 1], fundo = p.fundos[0];
  if (enq && acab && fundo) {
    var total = Number(enq.preco) * Number(acab.fator) + Number(fundo.preco);
    $("#exemplo").innerHTML = "Exemplo: <b>" + esc(enq.nome) + "</b> (" + esc(brl(enq.preco)) + ") com <b>" + esc(acab.nome) + "</b> (+" +
      Math.round((acab.fator - 1) * 100) + "%), 1 personagem, " + esc(fundo.nome.toLowerCase()) + " = <b>" + esc(brl(total)) + "</b>";
  }

  var pct = function (f) { return "+" + Math.round((Number(f) - 1) * 100) + "%"; };
  var itens = [];
  p.acabamentos.forEach(function (a) { if (Number(a.fator) !== 1) itens.push("Acréscimo do acabamento <b>" + esc(a.nome) + "</b>: " + pct(a.fator)); });
  itens.push("Cada personagem extra na mesma arte: <b>+" + p.personagemExtraPct + "%</b> (até " + p.maxPersonagens + " personagens)");
  p.fundos.forEach(function (f) { if (Number(f.preco) > 0) itens.push("Fundo <b>" + esc(f.nome.toLowerCase()) + "</b>: " + esc(brl(f.preco))); });
  var desc = p.descontosVolume.filter(function (d) { return d.pct > 0; }).map(function (d) { return d.pct + "% a partir de " + d.min + " artes"; });
  if (desc.length) itens.push("Desconto por quantidade: <b>" + esc(desc.join(" · ")) + "</b>");
  itens.push("Uso comercial: <b>+" + p.comercialPct + "%</b>");
  itens.push("As <b>agendas de outubro, novembro e dezembro</b>, as datas e a fila estão preenchidas com exemplos: troque pelas suas no painel");
  itens.push("O texto <b>\"Sobre você\"</b> e as respostas das perguntas foram escritos a partir dos seus posts: ajuste pra sua voz");
  $("#conferir").innerHTML = itens.map(function (t) { return "<li>" + t + "</li>"; }).join("");
})();
