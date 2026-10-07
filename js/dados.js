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
    abertura: {
      img: "assets/cena-cavaleira.webp",
      foco: "50% 40%",
      kicker: "RPG Character Creation",
      legenda: "Personagens de RPG, OCs e heróis da sua mesa ganhando cor, traço e história."
    },
    interludio1: {
      img: "assets/cena-agua.webp",
      foco: "50% 30%",
      frase: "Colors and lines bring your ideas to life.",
      credito: "interlúdio · estudo de cor"
    },
    interludio2: {
      img: "assets/caderno-1.webp",
      foco: "50% 50%",
      frase: "Toda campanha começa num rascunho.",
      credito: "interlúdio · caderno de campanha"
    }
  },

  sobre: {
    palavra: "SAVAGE",
    imagem: "assets/hey.webp",
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
    // "aberta" | "espera" | "fechada"
    status: "fechada",
    aviso: "As encomendas estão fechadas enquanto eu finalizo os pedidos da fila e termino meus estudos. Acompanhe aqui quando a agenda abre de novo!",
    proximaAbertura: "2026-12-01",
    mostrarContagem: true,
    vagas: { total: 5, ocupadas: 5 },
    eventos: [
      { data: "2026-10-20", tipo: "entrega", titulo: "Entrega das encomendas de outubro", desc: "Últimos ajustes e envio dos arquivos finais." },
      { data: "2026-11-15", tipo: "aviso", titulo: "Lista de espera abre", desc: "Quem entrar na lista recebe aviso primeiro quando as vagas abrirem." },
      { data: "2026-12-01", tipo: "abertura", titulo: "Abertura das encomendas", desc: "5 vagas para personagens: busto, meio corpo e corpo inteiro." },
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

  galeria: [
    { img: "assets/commissions-open.webp", titulo: "Commissions Open", tag: "Pôsteres", visivel: true },
    { img: "assets/galeria/g-tiefling-cartas.webp", titulo: "Tiefling das cartas", tag: "Personagens", visivel: true },
    { img: "assets/oasis.webp", titulo: "Oásis", tag: "Pôsteres", visivel: true },
    { img: "assets/galeria/g-espada-roxa.webp", titulo: "Lâmina violeta", tag: "Personagens", visivel: true },
    { img: "assets/cena-cavaleira.webp", titulo: "A fuga", tag: "Cenas", visivel: true },
    { img: "assets/galeria/g-janela-gotica.webp", titulo: "Catedral", tag: "Cenas", visivel: true },
    { img: "assets/galeria/g-character.webp", titulo: "Character", tag: "Pôsteres", visivel: true },
    { img: "assets/galeria/g-elfa-agua.webp", titulo: "Elfa das águas", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-menino-coruja.webp", titulo: "O guardião da coruja", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-cavaleiros.webp", titulo: "Stand up and fight", tag: "Cenas", visivel: true },
    { img: "assets/galeria/g-gargantilha.webp", titulo: "Gargantilha", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-casal.webp", titulo: "Promessa", tag: "Cenas", visivel: true },
    { img: "assets/galeria/g-cavaleiro-espada.webp", titulo: "Cavaleiro de pelúcia", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-armadura-fogo.webp", titulo: "Brasa", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-smile.webp", titulo: "Smile", tag: "Pôsteres", visivel: true },
    { img: "assets/galeria/g-guerreiro.webp", titulo: "Sombra dourada", tag: "Cenas", visivel: true },
    { img: "assets/galeria/g-bandana.webp", titulo: "Bandana", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-cabelo-rosa.webp", titulo: "Rosa choque", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-olho-azul.webp", titulo: "Íris", tag: "Estudos", visivel: true },
    { img: "assets/galeria/g-olhar-rosa.webp", titulo: "Olhar", tag: "Estudos", visivel: true },
    { img: "assets/galeria/g-ruivo.webp", titulo: "O bardo", tag: "Personagens", visivel: true },
    { img: "assets/galeria/g-rosto.webp", titulo: "Estudo de luz", tag: "Estudos", visivel: true },
    { img: "assets/galeria/g-queda.webp", titulo: "Queda", tag: "Estudos", visivel: true },
    { img: "assets/caderno-2.webp", titulo: "Caderno de campanha", tag: "Estudos", visivel: true },
    { img: "assets/galeria/g-little-sis.webp", titulo: "Welcome, little sis", tag: "Personagens", visivel: true }
  ],

  links: [
    { nome: "Instagram", desc: "Artes novas, estudos e avisos de abertura", url: "https://www.instagram.com/_.brupater/", icone: "instagram", visivel: true },
    { nome: "Threads", desc: "Conversas, bastidores e recadinhos", url: "https://www.threads.com/@_.brupater", icone: "threads", visivel: true },
    { nome: "Crie seu personagem", desc: "Monte sua encomenda e veja o preço na hora", url: "#encomendas", icone: "dado", visivel: true },
    { nome: "Agenda de encomendas", desc: "Quando abre, quantas vagas e como anda a fila", url: "#agenda", icone: "agenda", visivel: true }
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
    tema: "auto"         // "auto" | "escuro" | "claro"
  }
};

/* Fontes que o painel oferece em cada papel. Os nomes são exatamente os do
   Google Fonts (o tema.js monta o link a partir deles). */
var OPCOES_FONTES = {
  cinema: ["Oranienbaum", "Playfair Display", "Bodoni Moda", "Abril Fatface", "Cinzel", "Instrument Serif"],
  poster: ["Montserrat", "Archivo Black", "Anton", "Bebas Neue", "Oswald", "Poppins"],
  mao: ["Gochi Hand", "Caveat", "Permanent Marker", "Patrick Hand", "Kalam", "Indie Flower"]
};
