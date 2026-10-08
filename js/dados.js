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
    titulo: "Illustrator & Graphic Design",
    frase: "Colors and lines bring your ideas to life.",
    saudacao: "Hellooooo, little stars!",
    avatar: "assets/avatar.webp",
    instagram: "_.brupater",
    whatsapp: "5511964881678",
    /* botão flutuante no cantinho da tela (todas as páginas) */
    whatsappFlutuante: true,
    whatsappBotao: "Fale comigo no WhatsApp",
    whatsappMensagem: "Oi, Bru! Vim pelo seu site ✨",
    assinatura: "Beijokinhas de estrela",
    trilha: { texto: "Dar play na imersão", url: "" }
  },

  cenas: {
    /* topo da página inicial: as artes do carrossel vêm da galeria (destaque: true) */
    abertura: {
      kicker: "Illustrator & Graphic Design",
      /* "fundo": a arte cobre a tela toda (padrão; use imagens deitadas,
         1920 x 1080). "inteira": a arte aparece inteira, sem corte, à direita */
      modo: "fundo",
      legenda: "Personagens, ilustrações e identidades visuais ganhando cor, traço e história."
    },
    interludio1: {
      img: "assets/obras/a-fuga.webp",
      foco: "50% 30%",
      frase: "Colors and lines bring your ideas to life.",
      credito: "estudo de cor"
    },
    paginas: {
      portfolio: { img: "assets/obras/catedral.webp", foco: "50% 35%", titulo: "Portfólio", sub: "Personagens, pôsteres, ilustrações e estudos." },
      agenda: { img: "assets/obras/caderno-alvar.webp", foco: "50% 50%", titulo: "Agenda", sub: "Quando abre, quantas vagas e como anda a fila." },
      encomendas: { img: "assets/obras/commissions-open.webp", foco: "50% 30%", titulo: "Encomendas", sub: "Crie seu personagem e veja o preço na hora." }
    },
    interludio2: {
      img: "assets/obras/caderno-de-campanha.webp",
      foco: "50% 50%",
      frase: "Toda campanha começa num rascunho.",
      credito: "caderno de campanha"
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
      { id: "cenario", nome: "Cenário", preco: 90, desc: "Ambiente desenhado por trás do personagem." }
    ],
    descontosVolume: [
      { min: 1, pct: 0 },
      { min: 3, pct: 5 },
      { min: 5, pct: 10 }
    ],
    comercialPct: 50,
    /* as duas categorias da área de encomendas */
    ilustracao: { titulo: "Crie sua Ilustração", sub: "Personagens, OCs e fichas" },
    identidade: {
      titulo: "Crie sua Identidade Visual",
      sub: "Pra sua marca, loja ou projeto",
      /* preco 0 = aparece "sob consulta" e o valor é combinado na conversa */
      pacotes: [
        { id: "basico", nome: "Básico", sub: "Identidade Essencial", preco: 0,
          itens: "Logo · Variações do logo · Paleta de cores · Tipografia · Arquivos finais" },
        { id: "completo", nome: "Completo", sub: "Identidade Visual", preco: 0,
          itens: "Tudo do Básico · Símbolo · Pattern · Elementos gráficos · 3 a 5 mockups" },
        { id: "premium", nome: "Premium", sub: "Identidade + Manual da Marca", preco: 0,
          itens: "Tudo do Completo · Manual da marca diagramado: aplicações, cores, tipografia, redução, área de proteção e usos incorretos" }
      ]
    },
    /* a tabela de comissões (imagem) embaixo da calculadora */
    tabela: { mostrar: true, img: "assets/tabela-comissoes.webp", w: 1350, h: 1688, legenda: "a tabela original, do jeitinho que ela aparece no Instagram ↗" },
    /* aparece com * logo abaixo do total */
    notaTotal: "Os valores podem variar de acordo com a complexidade da arte.",
    regras: [
      "50% adiantado para começar",
      "50% depois do esboço aprovado",
      "Pix (Brasil) ou PayPal (exterior)",
      "Sem reembolso ou cancelamento depois do pagamento"
    ]
  },

  /* Páginas de aviso: 404 (não existe), erro (algo deu errado) e manutenção (fora do ar) */
  paginasAviso: {
    naoEncontrada: { rotulo: "Erro 404", titulo: "Ops, essa página não existe", texto: "A página que você procurou não existe ou mudou de lugar. Mas tem muita arte te esperando no início.", botao: "Voltar ao início", img: "assets/obras/a-fuga.webp" },
    erro: { rotulo: "Corta!", titulo: "Algo saiu do roteiro", texto: "Alguma coisa deu errado ao abrir esta página. Tenta de novo daqui a pouquinho; se continuar, me chama no WhatsApp.", botao: "Tentar de novo", img: "assets/obras/queda.webp" },
    manutencao: { rotulo: "Bastidores", titulo: "Voltamos já", texto: "O site está passando por uns ajustes e volta em breve. Enquanto isso, me encontra no Instagram ou no WhatsApp.", botao: "Ir pro Instagram", img: "assets/obras/caderno-de-campanha.webp" }
  },

  /* Projetos = coleções. Na página inicial aparece só a capa; ao clicar abre
     projeto.html?p=<id> com o projeto inteiro (como no Behance/ArtStation).
     categoria vira filtro ("Ilustração", "Identidade visual"...). */
  secaoProjetos: {
    titulo: "Projetos",
    sub: "Coleções de ilustração e identidade visual. Toque na capa pra ver o projeto inteiro."
  },
  projetos: [
    {
      id: "personagens", titulo: "Personagens", categoria: "Ilustração", visivel: true,
      capa: "assets/obras/tiefling-cartas.webp", foco: "50% 25%",
      resumo: "Fichas e retratos de personagem.",
      texto: "Personagens de RPG, OCs e heróis de mesa: cada um com pose, roupa e personalidade próprias.",
      imagens: [
        { img: "assets/obras/tiefling-cartas.webp", legenda: "" },
        { img: "assets/obras/brasa.webp", legenda: "" },
        { img: "assets/obras/elfa-das-aguas.webp", legenda: "" },
        { img: "assets/obras/lamina-violeta.webp", legenda: "" },
        { img: "assets/obras/guardiao-da-coruja.webp", legenda: "" },
        { img: "assets/obras/gargantilha.webp", legenda: "" },
        { img: "assets/obras/o-bardo.webp", legenda: "" },
        { img: "assets/obras/cavaleiro-de-pelucia.webp", legenda: "" },
        { img: "assets/obras/rosa-choque.webp", legenda: "" },
        { img: "assets/obras/bandana.webp", legenda: "" },
        { img: "assets/obras/hey.webp", legenda: "" }
      ]
    },
    {
      id: "ilustracoes", titulo: "Ilustrações", categoria: "Ilustração", visivel: true,
      capa: "assets/obras/a-fuga.webp", foco: "50% 45%",
      resumo: "Aventura com luz, clima e movimento.",
      texto: "Ilustrações completas, com ambiente: luz, clima e movimento contando a história.",
      imagens: [
        { img: "assets/obras/a-fuga.webp", legenda: "" },
        { img: "assets/obras/correnteza.webp", legenda: "" },
        { img: "assets/obras/catedral.webp", legenda: "" },
        { img: "assets/obras/sombra-dourada.webp", legenda: "" },
        { img: "assets/obras/stand-up-and-fight.webp", legenda: "" }
      ]
    },
    {
      id: "posteres", titulo: "Pôsteres", categoria: "Ilustração", visivel: true,
      capa: "assets/obras/oasis.webp", foco: "50% 30%",
      resumo: "Ilustração + tipografia, como cartaz de cinema.",
      texto: "Pôsteres e fichas que juntam ilustração, tipografia e composição gráfica, no estilo de cartaz de cinema.",
      imagens: [
        { img: "assets/obras/oasis.webp", legenda: "" },
        { img: "assets/obras/character.webp", legenda: "" },
        { img: "assets/obras/smile.webp", legenda: "" },
        { img: "assets/obras/commissions-open.webp", legenda: "" }
      ]
    },
    {
      id: "caderno-de-campanha", titulo: "Caderno de campanha", categoria: "Ilustração", visivel: true,
      capa: "assets/obras/caderno-de-campanha.webp", foco: "50% 50%",
      resumo: "Esboços e estudos a lápis.",
      texto: "As páginas do caderno onde tudo começa: esboços, estudos de personagem e desenhos a lápis antes da cor.",
      imagens: [
        { img: "assets/obras/caderno-de-campanha.webp", legenda: "" },
        { img: "assets/obras/caderno-alvar.webp", legenda: "" },
        { img: "assets/obras/alvar-acorrentado.webp", legenda: "" },
        { img: "assets/obras/caderno-portao.webp", legenda: "" },
        { img: "assets/obras/queda.webp", legenda: "" },
        { img: "assets/obras/rascunho.webp", legenda: "" },
        { img: "assets/obras/processo.webp", legenda: "" }
      ]
    },
    {
      id: "retratos-e-estudos", titulo: "Retratos e estudos", categoria: "Ilustração", visivel: true,
      capa: "assets/obras/estudo-de-luz.webp", foco: "50% 35%",
      resumo: "Rosto, olhar e luz.",
      texto: "Estudos de rosto, olhar e luz, onde eu testo cor e acabamento.",
      imagens: [
        { img: "assets/obras/estudo-de-luz.webp", legenda: "" },
        { img: "assets/obras/iris.webp", legenda: "" },
        { img: "assets/obras/olhar.webp", legenda: "" },
        { img: "assets/obras/iris-azul.webp", legenda: "" },
        { img: "assets/obras/dama-em-lineart.webp", legenda: "" }
      ]
    }
  ],

  /* destaque: true = aparece no carrossel do topo da página inicial (na ordem da lista).
     foco = a parte da arte que fica visível no topo quando ela cobre a tela.
     mini = versão menor usada na grade; img = versão grande da tela cheia. */
  galeria: [
    { img: "assets/obras/correnteza.webp", mini: "assets/obras/correnteza-g.webp", w: 1350, h: 1800, titulo: "Correnteza", tag: "Ilustrações", destaque: true, visivel: true, foco: "50% 30%" },
    { img: "assets/obras/a-fuga.webp", mini: "assets/obras/a-fuga-g.webp", w: 1440, h: 1439, titulo: "A fuga", tag: "Ilustrações", destaque: true, visivel: true, foco: "45% 45%" },
    { img: "assets/obras/catedral.webp", mini: "assets/obras/catedral-g.webp", w: 1350, h: 1800, titulo: "Catedral", tag: "Ilustrações", destaque: true, visivel: true, foco: "50% 22%" },
    { img: "assets/obras/tiefling-cartas.webp", mini: "assets/obras/tiefling-cartas-g.webp", w: 1350, h: 1800, titulo: "Tiefling das cartas", tag: "Personagens", destaque: true, visivel: true, foco: "50% 28%" },
    { img: "assets/obras/commissions-open.webp", mini: "assets/obras/commissions-open-g.webp", w: 1440, h: 1800, titulo: "Commissions Open", tag: "Pôsteres", destaque: true, visivel: true, foco: "50% 32%" },
    { img: "assets/obras/sombra-dourada.webp", mini: "assets/obras/sombra-dourada-g.webp", w: 1440, h: 1439, titulo: "Sombra dourada", tag: "Ilustrações", destaque: true, visivel: true, foco: "40% 22%" },
    { img: "assets/obras/brasa.webp", mini: "assets/obras/brasa-g.webp", w: 1080, h: 1080, titulo: "Brasa", tag: "Personagens", destaque: true, visivel: true, foco: "60% 32%" },
    { img: "assets/obras/oasis.webp", mini: "assets/obras/oasis-g.webp", w: 1350, h: 1688, titulo: "Oásis", tag: "Pôsteres", destaque: false, visivel: true },
    { img: "assets/obras/elfa-das-aguas.webp", mini: "assets/obras/elfa-das-aguas-g.webp", w: 1080, h: 1080, titulo: "Elfa das águas", tag: "Personagens", destaque: false, visivel: true },
    { img: "assets/obras/stand-up-and-fight.webp", mini: "assets/obras/stand-up-and-fight-g.webp", w: 1440, h: 1440, titulo: "Stand up and fight", tag: "Ilustrações", destaque: false, visivel: true },
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
    { nome: "Portfólio", desc: "Personagens, pôsteres, ilustrações e estudos", url: "portfolio.html", icone: "estrela", visivel: true },
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
    /* cores de cada modo (o botão sol/lua troca entre eles). As cores acima
       (rosa, violeta...) são da marca e valem nos dois modos. */
    modos: {
      claro: { fundo: "#EFE6E1", secao: "#F6F1EE", texto: "#1A1218", textoSuave: "#5D4A53", barra: "#EFE6E1", barraTexto: "#1A1218", rodape: "#07050A", rodapeTexto: "#F6EDE9" },
      escuro: { fundo: "#0E0A0F", secao: "#1E0D16", texto: "#F6EDE9", textoSuave: "#BCA9B0", barra: "#0E0A0F", barraTexto: "#F6EDE9", rodape: "#07050A", rodapeTexto: "#F6EDE9" }
    },
    /* tela de carregamento com abertura de cinema */
    carregamento: true,
    fontes: {
      cinema: "Oranienbaum",
      poster: "Montserrat",
      mao: "Gochi Hand"
    },
    grao: true,
    barras: true,
    movimento: "normal", // "normal" | "suave" | "desligado"
    tema: "claro",       // tema inicial: "claro" | "escuro" | "auto" (segue o aparelho)
    botaoTema: true      // botão sol/lua no topo pra quem visita trocar entre claro e escuro
  }
};

/* Fontes que o painel oferece em cada papel. Os nomes são exatamente os do
   Google Fonts (o tema.js monta o link a partir deles). */
var OPCOES_FONTES = {
  cinema: ["Oranienbaum", "Playfair Display", "Bodoni Moda", "Abril Fatface", "Cinzel", "Instrument Serif"],
  poster: ["Montserrat", "Archivo Black", "Anton", "Bebas Neue", "Oswald", "Poppins"],
  mao: ["Gochi Hand", "Caveat", "Permanent Marker", "Patrick Hand", "Kalam", "Indie Flower"]
};

/* Tamanhos recomendados de imagem (aparecem no painel e na apresentação).
   Não é conteúdo editável: é a regra de cada lugar do site. */
var TAMANHOS_IMAGEM = [
  { onde: "Topo da página inicial (artes em destaque)", tamanho: "1920 × 1080 px", formato: "deitada (16:9)", dica: "A arte cobre a tela toda. Os textos ficam embaixo à esquerda: deixe o rosto/assunto no meio ou à direita. Mínimo 1600 × 900." },
  { onde: "Topo da página inicial no celular (opcional)", tamanho: "1080 × 1920 px", formato: "em pé (9:16)", dica: "Uma versão vertical da mesma arte, só pro celular. Os textos ficam na metade de baixo: deixe o assunto na metade de cima. Sem ela, o celular mostra o meio da arte deitada." },
  { onde: "Topo do Portfólio, da Agenda e das Encomendas", tamanho: "1920 × 1080 px", formato: "deitada (16:9)", dica: "O título fica à esquerda, sobre um degradê: deixe o assunto na metade da direita. A arte aparece inteira na altura." },
  { onde: "Faixas em tela cheia (interlúdios)", tamanho: "1920 × 1080 px", formato: "deitada (16:9)", dica: "A frase fica embaixo, então evite detalhes importantes no rodapé da arte." },
  { onde: "Capa de projeto", tamanho: "1600 × 1200 px", formato: "deitada (4:3)", dica: "Os dois primeiros projetos aparecem um pouco mais largos (16:10): deixe uma folguinha nas laterais." },
  { onde: "Imagens dentro de um projeto e do portfólio", tamanho: "1800 px no lado maior", formato: "qualquer formato", dica: "Cada arte aparece no formato dela, sem corte." },
  { onde: "Páginas de aviso (erro, fora do ar)", tamanho: "1800 px no lado maior", formato: "qualquer formato", dica: "A arte aparece inteira ao lado do texto." },
  { onde: "Foto de perfil (avatar)", tamanho: "500 × 500 px", formato: "quadrada", dica: "Aparece redonda: deixe o rosto no centro." }
];
