"use strict";

/*
 * Conteúdo padrão do site da Brunna (@_.brupater).
 *
 * REGRA: todo texto, preço, data, link, imagem, cor e fonte que a Brunna pode
 * mudar mora aqui dentro de PADRAO — nunca solto no HTML. O painel (admin.html)
 * edita uma cópia desse objeto e o js/loja.js guarda a cópia editada.
 * Assim, quando o conteúdo passar a vir de um banco de dados, só o loja.js muda.
 */
var PADRAO = {
  versao: 1,

  perfil: {
    nome: "Brunna Paternostro",
    apelido: "Bru",
    handle: "_.brupater",
    titulo: "RPG Character Creation",
    frase: "Colors and lines bring your ideas to life.",
    saudacao: "Hellooooo, little stars!",
    avatar: "assets/avatar.webp",
    instagram: "_.brupater",
    whatsapp: "",
    assinatura: "Beijokinhas de estrela",
    trilha: { texto: "Dar play na imersão", url: "" }
  },

  cenas: {
    /* topo da página inicial: as artes do carrossel vêm da galeria (destaque: true) */
    abertura: {
      kicker: "RPG Character Creation",
      legenda: "Personagens de RPG, OCs e heróis da sua mesa ganhando cor, traço e história."
    },
    interludio1: {
      img: "assets/obras/a-fuga.webp",
      foco: "50% 30%",
      frase: "Colors and lines bring your ideas to life.",
      credito: "interlúdio · estudo de cor"
    },
    paginas: {
      portfolio: { img: "assets/obras/catedral.webp", foco: "50% 35%", titulo: "Portfólio", sub: "Personagens, pôsteres, cenas e estudos." },
      agenda: { img: "assets/obras/caderno-alvar.webp", foco: "50% 50%", titulo: "Agenda", sub: "Quando abre, quantas vagas e como anda a fila." },
      encomendas: { img: "assets/obras/commissions-open.webp", foco: "50% 30%", titulo: "Encomendas", sub: "Crie seu personagem e veja o preço na hora." }
    },
    interludio2: {
      img: "assets/obras/caderno-de-campanha.webp",
      foco: "50% 50%",
      frase: "Toda campanha começa num rascunho.",
      credito: "interlúdio · caderno de campanha"
    }
  },

  sobre: {
    palavra: "SAVAGE",
    imagem: "assets/obras/hey.webp",
    retrato: "assets/avatar.webp",
    texto: "Sou a Bru, artista brasileira que desenha personagens de RPG, OCs e fichas que parecem pôster de filme. Meu traço mistura cartoon e concept, com muita cor, luz neon e um pezinho no gótico.",
    ficha: [
      { rotulo: "Bandas", valor: "Sabaton · Powerwolf · Brothers of Metal" },
      { rotulo: "Jogos", valor: "Cyberpunk · The Sims · Helldivers" },
      { rotulo: "Animes", valor: "Berserk · Fullmetal · Spy x Family" },
      { rotulo: "Filme", valor: "The Covenant" },
      { rotulo: "Série", valor: "Game of Thrones" },
      { rotulo: "Curiosidades", valor: "Adoro luz neon · Amo catedrais góticas · Louca da papelaria · RPG me relaxa · Pastel é melhor que pizza e é isso" }
    ],
    extra: { rotulo: "Curiosidade extra", valor: "Adoro filmes e jogos de guerra · War never changes" },
    lema: "Só existem dois gêneros: força e ódio. E eu sou os dois."
  },

  agenda: {
    /* Cada sessão é uma "agenda" com data de abertura e número de vagas.
       O estado é calculado sozinho (js/site.js → estadoAgenda):
         antes da data de abertura ........ fechada ("abre em X dias")
         aberta e com vaga sobrando ........ aberta
         todas as vagas preenchidas ......... esgotado
       A Bru só marca no painel cada vaga confirmada (pagou os 50%). */
    sessoes: [
      { nome: "Agenda de outubro", abre: "2026-10-01", vagas: 4, ocupadas: 4, encerrada: false, nota: "Busto, meio corpo e corpo inteiro." },
      { nome: "Agenda de novembro", abre: "2026-11-01", vagas: 4, ocupadas: 0, encerrada: false, nota: "Busto, meio corpo e corpo inteiro." },
      { nome: "Agenda de dezembro", abre: "2026-12-01", vagas: 3, ocupadas: 0, encerrada: false, nota: "Sessão curta antes da pausa de fim de ano." }
    ],
    /* true = fecha tudo na hora, mesmo com vaga (férias, imprevisto) */
    pausa: false,
    mostrarContagem: true,
    etiquetas: { aberta: "Commissions open", esgotado: "Esgotado", fechada: "Comms closed" },
    avisos: {
      aberta: "A agenda está aberta! Monte seu pedido e me chame na DM pra garantir sua vaga.",
      esgotado: "Todas as vagas desta agenda foram preenchidas. Obrigada, little stars! Fica de olho na próxima abertura.",
      fechada: "As encomendas estão fechadas enquanto eu finalizo os pedidos da fila. Acompanhe aqui quando a próxima agenda abre."
    },
    eventos: [
      { data: "2026-10-20", tipo: "entrega", titulo: "Entrega das encomendas de outubro", desc: "Últimos ajustes e envio dos arquivos finais." },
      { data: "2026-12-20", tipo: "fechamento", titulo: "Pausa de fim de ano", desc: "Pedidos novos voltam a andar em janeiro." }
    ],
    fila: [
      { nome: "Encomenda 01", detalhe: "Busto · Render", etapa: 4 },
      { nome: "Encomenda 02", detalhe: "Meio corpo · Flat color", etapa: 3 },
      { nome: "Encomenda 03", detalhe: "Corpo inteiro · Render", etapa: 2 },
      { nome: "Encomenda 04", detalhe: "Busto · Lineart + sombra", etapa: 1 },
      { nome: "Encomenda 05", detalhe: "Meio corpo · Render", etapa: 0 }
    ],
    etapas: ["Esboço", "Lineart", "Cor", "Render", "Entregue"]
  },

  precos: {
    enquadramentos: [
      { id: "busto", nome: "Busto", preco: 110, img: "assets/ex-busto.webp", desc: "Do peito pra cima. Ótimo pra ícone, token e ficha." },
      { id: "meio", nome: "Meio corpo", preco: 160, img: "assets/ex-meio.webp", desc: "Até a cintura, com espaço pra pose e acessórios." },
      { id: "inteiro", nome: "Corpo inteiro", preco: 220, img: "assets/ex-inteiro.webp", desc: "O personagem completo, da cabeça às botas." }
    ],
    acabamentos: [
      { id: "lineart", nome: "Lineart + sombra", fator: 1, img: "assets/ex-lineart.webp", desc: "Traço finalizado com sombra em tons de cinza." },
      { id: "flat", nome: "Flat color", fator: 1.25, img: "assets/ex-flat.webp", desc: "Cores chapadas com sombra simples." },
      { id: "render", nome: "Render", fator: 1.6, img: "assets/ex-render.webp", desc: "Pintura completa, com luz, volume e textura." }
    ],
    personagemExtraPct: 80,
    maxPersonagens: 4,
    fundos: [
      { id: "sem", nome: "Sem fundo", preco: 0, desc: "Fundo liso ou transparente." },
      { id: "simples", nome: "Fundo simples", preco: 30, desc: "Cor, textura ou elementos soltos." },
      { id: "cenario", nome: "Cenário", preco: 90, desc: "Ambiente desenhado, como uma cena de filme." }
    ],
    descontosVolume: [
      { min: 1, pct: 0 },
      { min: 3, pct: 5 },
      { min: 5, pct: 10 }
    ],
    comercialPct: 50,
    regras: [
      "50% adiantado para começar",
      "50% depois do esboço aprovado",
      "Pix (Brasil) ou PayPal (exterior)",
      "Sem reembolso ou cancelamento depois do pagamento"
    ]
  },

  /* destaque: true = aparece no carrossel do topo da página inicial (na ordem da lista).
     mini = versão menor usada na grade; img = versão grande da tela cheia. */
  galeria: [
    { img: "assets/obras/correnteza.webp", mini: "assets/obras/correnteza-g.webp", w: 1350, h: 1800, titulo: "Correnteza", tag: "Cenas", destaque: true, visivel: true },
    { img: "assets/obras/a-fuga.webp", mini: "assets/obras/a-fuga-g.webp", w: 1440, h: 1439, titulo: "A fuga", tag: "Cenas", destaque: true, visivel: true },
    { img: "assets/obras/catedral.webp", mini: "assets/obras/catedral-g.webp", w: 1350, h: 1800, titulo: "Catedral", tag: "Cenas", destaque: true, visivel: true },
    { img: "assets/obras/tiefling-cartas.webp", mini: "assets/obras/tiefling-cartas-g.webp", w: 1350, h: 1800, titulo: "Tiefling das cartas", tag: "Personagens", destaque: true, visivel: true },
    { img: "assets/obras/commissions-open.webp", mini: "assets/obras/commissions-open-g.webp", w: 1440, h: 1800, titulo: "Commissions Open", tag: "Pôsteres", destaque: true, visivel: true },
    { img: "assets/obras/sombra-dourada.webp", mini: "assets/obras/sombra-dourada-g.webp", w: 1440, h: 1439, titulo: "Sombra dourada", tag: "Cenas", destaque: true, visivel: true },
    { img: "assets/obras/brasa.webp", mini: "assets/obras/brasa-g.webp", w: 1080, h: 1080, titulo: "Brasa", tag: "Personagens", destaque: true, visivel: true },
    { img: "assets/obras/oasis.webp", mini: "assets/obras/oasis-g.webp", w: 1350, h: 1688, titulo: "Oásis", tag: "Pôsteres", destaque: false, visivel: true },
    { img: "assets/obras/elfa-das-aguas.webp", mini: "assets/obras/elfa-das-aguas-g.webp", w: 1080, h: 1080, titulo: "Elfa das águas", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/stand-up-and-fight.webp", mini: "assets/obras/stand-up-and-fight-g.webp", w: 1440, h: 1440, titulo: "Stand up and fight", tag: "Cenas", destaque: false, visivel: true },
    { img: "assets/obras/lamina-violeta.webp", mini: "assets/obras/lamina-violeta-g.webp", w: 1080, h: 1080, titulo: "Lâmina violeta", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/character.webp", mini: "assets/obras/character-g.webp", w: 1440, h: 1800, titulo: "Character", tag: "Pôsteres", destaque: false, visivel: true },
    { img: "assets/obras/guardiao-da-coruja.webp", mini: "assets/obras/guardiao-da-coruja-g.webp", w: 1350, h: 1688, titulo: "O guardião da coruja", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/gargantilha.webp", mini: "assets/obras/gargantilha-g.webp", w: 1440, h: 1800, titulo: "Gargantilha", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/o-bardo.webp", mini: "assets/obras/o-bardo-g.webp", w: 1080, h: 1080, titulo: "O bardo", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/cavaleiro-de-pelucia.webp", mini: "assets/obras/cavaleiro-de-pelucia-g.webp", w: 1440, h: 1800, titulo: "Cavaleiro de pelúcia", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/smile.webp", mini: "assets/obras/smile-g.webp", w: 1440, h: 1800, titulo: "Smile", tag: "Pôsteres", destaque: false, visivel: true },
    { img: "assets/obras/rosa-choque.webp", mini: "assets/obras/rosa-choque-g.webp", w: 1350, h: 1688, titulo: "Rosa choque", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/bandana.webp", mini: "assets/obras/bandana-g.webp", w: 1080, h: 1080, titulo: "Bandana", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/hey.webp", mini: "assets/obras/hey-g.webp", w: 1080, h: 1080, titulo: "Hey!", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/iris.webp", mini: "assets/obras/iris-g.webp", w: 1350, h: 1688, titulo: "Íris", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/estudo-de-luz.webp", mini: "assets/obras/estudo-de-luz-g.webp", w: 1350, h: 1688, titulo: "Estudo de luz", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/olhar.webp", mini: "assets/obras/olhar-g.webp", w: 1350, h: 1688, titulo: "Olhar", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/iris-azul.webp", mini: "assets/obras/iris-azul-g.webp", w: 1350, h: 1688, titulo: "Íris azul", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/dama-em-lineart.webp", mini: "assets/obras/dama-em-lineart-g.webp", w: 1351, h: 1800, titulo: "Dama em lineart", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/caderno-de-campanha.webp", mini: "assets/obras/caderno-de-campanha-g.webp", w: 1440, h: 1007, titulo: "Caderno de campanha", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/caderno-alvar.webp", mini: "assets/obras/caderno-alvar-g.webp", w: 1800, h: 1260, titulo: "Caderno: Alvar", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/alvar-acorrentado.webp", mini: "assets/obras/alvar-acorrentado-g.webp", w: 1800, h: 1264, titulo: "Alvar acorrentado", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/caderno-portao.webp", mini: "assets/obras/caderno-portao-g.webp", w: 1440, h: 1011, titulo: "Caderno: o portão", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/queda.webp", mini: "assets/obras/queda-g.webp", w: 1800, h: 1264, titulo: "Queda", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/processo.webp", mini: "assets/obras/processo-g.webp", w: 1350, h: 1800, titulo: "Processo", tag: "Estudos", destaque: false, visivel: true },
    { img: "assets/obras/rascunho.webp", mini: "assets/obras/rascunho-g.webp", w: 1350, h: 1800, titulo: "Rascunho no papel", tag: "Estudos", destaque: false, visivel: true }
  ],

  links: [
    { nome: "Instagram", desc: "Artes novas, estudos e avisos de abertura", url: "https://www.instagram.com/_.brupater/", icone: "instagram", visivel: true },
    { nome: "Threads", desc: "Conversas, bastidores e recadinhos", url: "https://www.threads.com/@_.brupater", icone: "threads", visivel: true },
    { nome: "Crie seu personagem", desc: "Monte sua encomenda e veja o preço na hora", url: "encomendas.html", icone: "dado", visivel: true },
    { nome: "Portfólio", desc: "Personagens, pôsteres, cenas e estudos", url: "portfolio.html", icone: "estrela", visivel: true },
    { nome: "Agenda de encomendas", desc: "Quando abre, quantas vagas e como anda a fila", url: "agenda.html", icone: "agenda", visivel: true }
  ],

  faq: [
    { p: "Como funciona o pagamento?", r: "50% adiantado para eu começar e 50% depois que você aprovar o esboço. Aceito Pix (Brasil) e PayPal (exterior)." },
    { p: "Posso cancelar ou pedir reembolso?", r: "Depois do pagamento não tem reembolso nem cancelamento, porque o seu horário na minha agenda já fica reservado. Por isso o esboço passa por você antes de qualquer cor." },
    { p: "O que você desenha?", r: "Personagens de RPG (D&D e afins), OCs, fichas e retratos no meu estilo cartoon/concept: busto, meio corpo ou corpo inteiro." },
    { p: "Qual a diferença dos acabamentos?", r: "Lineart + sombra é o traço finalizado em tons de cinza. Flat color tem cores chapadas com sombra simples. Render é a pintura completa, com luz, volume e textura." },
    { p: "Por que as encomendas fecham?", r: "Quando a fila enche, eu fecho as encomendas pra entregar todo mundo com calma e qualidade. A agenda aqui do site mostra quando abre de novo e quantas vagas vão ter." },
    { p: "Quanto tempo demora?", r: "Depende da fila e do acabamento. Eu combino a data com você antes de começar, direto na DM." }
  ],

  aparencia: {
    cores: {
      rosa: "#E8347F",
      poster: "#C94F7C",
      vinho: "#7E1F3E",
      violeta: "#C79BFF",
      teal: "#4FD1C1",
      papel: "#EFE6E1",
      noite: "#0E0A0F"
    },
    fontes: {
      cinema: "Oranienbaum",
      poster: "Montserrat",
      mao: "Gochi Hand"
    },
    grao: true,
    barras: true,
    movimento: "normal", // "normal" | "suave" | "desligado"
    tema: "claro"        // "auto" | "escuro" | "claro" — a Bru pediu o site sempre claro
  }
};

/* Fontes que o painel oferece em cada papel. Os nomes são exatamente os do
   Google Fonts (o tema.js monta o link a partir deles). */
var OPCOES_FONTES = {
  cinema: ["Oranienbaum", "Playfair Display", "Bodoni Moda", "Abril Fatface", "Cinzel", "Instrument Serif"],
  poster: ["Montserrat", "Archivo Black", "Anton", "Bebas Neue", "Oswald", "Poppins"],
  mao: ["Gochi Hand", "Caveat", "Permanent Marker", "Patrick Hand", "Kalam", "Indie Flower"]
};
