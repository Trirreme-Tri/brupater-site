/*
 * Formato do conteúdo do site. É o mesmo objeto que o painel edita e que a
 * camada de dados (src/lib/loja.ts) guarda. Quando o conteúdo for para o
 * Firestore, este é o formato do documento (ver o guia do banco de dados).
 *
 * Regras de formato (valem para o banco também):
 *  - preços em número, em reais (110 = R$ 110,00); 0 = "sob consulta"
 *  - percentuais em número inteiro (50 = 50%)
 *  - datas em texto "AAAA-MM-DD"
 *  - cores em texto "#RRGGBB"
 *  - imagens: só o endereço (caminho "assets/..." ou URL https), nunca o arquivo
 *  - foco de imagem em texto "X% Y%"
 */

export type PaginaInterna = "portfolio" | "agenda" | "encomendas";
export type EstadoAgendaNome = "aberta" | "esgotado" | "fechada";
export type TipoEvento = "abertura" | "fechamento" | "entrega" | "aviso";
export type PapelFonte = "cinema" | "poster" | "mao";
export type ModoCor = "claro" | "escuro";

export interface Trilha {
  mostrar: boolean;
  rotulo: string;
  url: string;
  /** volume inicial, de 0 a 100 */
  volume: number;
}

export interface Perfil {
  nome: string;
  apelido: string;
  handle: string;
  titulo: string;
  frase: string;
  saudacao: string;
  avatar: string;
  instagram: string;
  /** só dígitos, com país e DDD (ex.: 5511964881678) */
  whatsapp: string;
  whatsappFlutuante: boolean;
  whatsappBotao: string;
  whatsappMensagem: string;
  assinatura: string;
  trilha: Trilha;
}

export interface Faixa {
  img: string;
  foco?: string;
  frase: string;
  credito: string;
}

export interface TopoPagina {
  img: string;
  foco?: string;
  titulo: string;
  sub: string;
}

/* "cenas" é só o nome interno da chave (mantido para não perder dados já salvos) */
export interface Cenas {
  abertura: { kicker: string; modo: "fundo" | "inteira"; legenda: string };
  interludio1: Faixa;
  paginas: Record<PaginaInterna, TopoPagina>;
  interludio2: Faixa;
}

export interface ItemFicha {
  rotulo: string;
  valor: string;
}

export interface Sobre {
  palavra: string;
  imagem: string;
  retrato: string;
  texto: string;
  ficha: ItemFicha[];
  extra: ItemFicha;
  lema: string;
}

export interface Sessao {
  nome: string;
  /** "AAAA-MM-DD" */
  abre: string;
  vagas: number;
  ocupadas: number;
  encerrada: boolean;
  nota: string;
}

export interface EventoAgenda {
  data: string;
  tipo: TipoEvento;
  titulo: string;
  desc: string;
}

export interface ItemFila {
  nome: string;
  detalhe: string;
  etapa: number;
}

export interface Agenda {
  sessoes: Sessao[];
  pausa: boolean;
  mostrarContagem: boolean;
  etiquetas: Record<EstadoAgendaNome, string>;
  avisos: Record<EstadoAgendaNome, string>;
  eventos: EventoAgenda[];
  fila: ItemFila[];
  etapas: string[];
}

export interface Enquadramento {
  id: string;
  nome: string;
  preco: number;
  img: string;
  desc: string;
}

export interface Acabamento {
  id: string;
  nome: string;
  /** multiplicador: 1 = preço base, 1.25 = +25% */
  fator: number;
  img: string;
  desc: string;
}

export interface Fundo {
  id: string;
  nome: string;
  preco: number;
  desc: string;
}

export interface DescontoVolume {
  min: number;
  pct: number;
}

export interface Pacote {
  id: string;
  nome: string;
  sub: string;
  /** 0 = "sob consulta" */
  preco: number;
  /** itens separados por " · " */
  itens: string;
}

export interface Precos {
  enquadramentos: Enquadramento[];
  acabamentos: Acabamento[];
  personagemExtraPct: number;
  maxPersonagens: number;
  fundos: Fundo[];
  descontosVolume: DescontoVolume[];
  comercialPct: number;
  ilustracao: { titulo: string; sub: string };
  identidade: { titulo: string; sub: string; pacotes: Pacote[] };
  tabela: { mostrar: boolean; img: string; w?: number; h?: number; legenda: string };
  notaTotal: string;
  regras: string[];
}

export interface PaginaAviso {
  rotulo: string;
  titulo: string;
  texto: string;
  botao: string;
  img: string;
}

export type TipoAviso = "naoEncontrada" | "erro" | "manutencao";

export interface ImagemProjeto {
  img: string;
  legenda: string;
}

export interface Projeto {
  /** vira o endereço: /projeto?p=<id>. Minúsculas, sem acento, com hífen. */
  id: string;
  titulo: string;
  categoria: string;
  visivel: boolean;
  capa: string;
  foco: string;
  resumo: string;
  texto: string;
  imagens: ImagemProjeto[];
}

export interface Obra {
  img: string;
  /** versão menor para a grade */
  mini?: string;
  w?: number;
  h?: number;
  titulo: string;
  tag: string;
  /** aparece no carrossel do topo da página inicial */
  destaque?: boolean;
  visivel?: boolean;
  foco?: string;
  /** versão em pé, só para o celular, no topo da página inicial */
  imgCelular?: string;
}

export interface LinkSite {
  nome: string;
  desc: string;
  url: string;
  icone: string;
  visivel: boolean;
}

export interface Pergunta {
  p: string;
  r: string;
}

export interface CoresMarca {
  rosa: string;
  poster: string;
  vinho: string;
  violeta: string;
  teal: string;
  papel: string;
  noite: string;
}

export interface CoresModo {
  fundo: string;
  secao: string;
  texto: string;
  textoSuave: string;
  barra: string;
  barraTexto: string;
  rodape: string;
  rodapeTexto: string;
}

export interface Aparencia {
  cores: CoresMarca;
  modos: Record<ModoCor, CoresModo>;
  carregamento: boolean;
  fontes: Record<PapelFonte, string>;
  grao: boolean;
  barras: boolean;
  movimento: "normal" | "suave" | "desligado";
  tema: "claro" | "escuro" | "auto";
  botaoTema: boolean;
}

export interface Site {
  versao: number;
  perfil: Perfil;
  cenas: Cenas;
  sobre: Sobre;
  agenda: Agenda;
  precos: Precos;
  paginasAviso: Record<TipoAviso, PaginaAviso>;
  secaoProjetos: { titulo: string; sub: string };
  projetos: Projeto[];
  galeria: Obra[];
  links: LinkSite[];
  faq: Pergunta[];
  aparencia: Aparencia;
  /** ids das migrações de formato que já rodaram nestes dados */
  migracoes?: string[];
}

export interface TamanhoImagem {
  onde: string;
  tamanho: string;
  formato: string;
  dica: string;
}
