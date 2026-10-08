# Site da Brunna Paternostro (@_.brupater)

Portfólio, agenda e calculadora de encomendas da artista Brunna Paternostro
(RPG Character Creation). Site estático (HTML, CSS e JavaScript puro, sem build),
com painel de edição. Desenvolvido pela [TRIRREME](https://trirreme.com).

## Páginas

| Página | Arquivo | O que é |
|---|---|---|
| Início | `index.html` | Carrossel de destaques (fundo claro), projetos em coleções, links, ficha da personagem, interlúdios e chamadas para as outras páginas |
| Projeto | `projeto.html?p=<id>` | Um projeto inteiro (capa, texto e todas as imagens), como no Behance |
| Portfólio | `portfolio.html` | Galeria com filtros e tela cheia |
| Agenda | `agenda.html` | Situação atual, agendas por mês (vagas e ESGOTADO automático), calendário e fila |
| Encomendas | `encomendas.html` | Duas categorias (Ilustração e Identidade Visual), total estimado, pedido pelo WhatsApp e perguntas frequentes |
| Painel | `admin.html` | Edição de agenda, preços, galeria, cenas, perfil, links, perguntas, cores, fontes e backup |
| Apresentação | `apresentacao.html` | Documento temporário para a cliente: links, acesso, estilo, fontes, cores e fluxos |

## Estrutura

```
css/
  tokens.css        cores (tema claro e escuro); as 7 cores da marca são sobrescritas pelo painel
  base.css          tipografia, botões, etiqueta, grão de filme, rodapé, lightbox
  site.css          cenas da página pública
  admin.css         painel
  apresentacao.css  página de apresentação
js/
  dados.js          PADRAO: todo o conteúdo editável (textos, preços, agenda, galeria, cores, fontes)
  loja.js           onde o conteúdo fica salvo (hoje: localStorage) + utilidades (esc, brl)
  tema.js           aplica cores, fontes e efeitos; carrega SITE
  icones.js         ícones dos links
  layout.js         navegação, rodapé, lightbox e WhatsApp flutuante comuns às páginas públicas
  agenda.js         regras da agenda: estado de cada sessão (em breve, aberta, esgotado)
  cinema.js         barras de cinema, entrada ao rolar, tema, lightbox
  site.js           desenha as páginas públicas
  vitrine.js        carrossel do topo da página inicial (loop infinito, passa pro lado)
  projetos.js       projetos (coleções): grade de capas na inicial e a página projeto.html
  encomenda.js      calculadora de encomendas
  admin.js          painel
  apresentacao.js   partes dinâmicas da apresentação
assets/             imagens (.webp); portfólio em assets/obras/ (duas versões: -g.webp para a grade, .webp grande)
```

**Agenda:** cada sessão tem data de abertura e número de vagas. O estado é
calculado em `js/agenda.js`; a cliente só marca no painel cada vaga confirmada.

**Movimento:** nenhuma imagem se mexe sozinha (sem parallax, sem zoom contínuo,
grão de filme parado) — a versão anterior dava a sensação de imagem tremendo.

**Regra:** todo conteúdo que a cliente pode mudar mora em `PADRAO` (`js/dados.js`),
nunca solto no HTML. O painel edita uma cópia e salva pelo `js/loja.js`.

## Rodar localmente

```bash
python3 -m http.server
# abrir http://localhost:8000
```

## Limitações conhecidas (fase atual)

- O conteúdo editado no painel fica salvo **no navegador de quem editou** (localStorage).
  Para valer para todos os visitantes, o `js/loja.js` precisa passar a ler e gravar
  num banco (ex.: Supabase, como no site da Anne).
- O login do painel é verificado no próprio navegador (usuário e senha no código).
  Serve só para esta fase; o login definitivo deve ser feito pelo serviço do banco.
- As imagens do portfólio foram recortadas de capturas do Instagram (baixa resolução).
