"use client";

/*
 * Painel da Bru (/admin): login, abas de edição, prévia ao vivo e barra de
 * salvar. A estrutura fixa está aqui; o conteúdo das abas é montado pelo
 * motor (./motor.ts).
 */
import { useEffect } from "react";
import { iniciarPainel } from "./motor";

export function Painel() {
  useEffect(() => iniciarPainel(), []);

  return (
    <div className="admin-raiz em-login">
      {/* ===== login ===== */}
      <main className="login" id="login" hidden>
        <div className="login-arte" aria-hidden="true"></div>
        <form className="login-caixa" id="login-form" autoComplete="on">
          <img className="login-avatar" src="/assets/avatar.webp" width={150} height={150} alt="" />
          <p className="rotulo">área restrita</p>
          <h1 className="t-cinema">Painel da Bru</h1>
          <p className="login-sub">Entre pra editar o site: agenda, preços, galeria, textos, cores e fontes.</p>
          <label className="campo"><span>Usuário</span><input id="login-usuario" type="text" autoComplete="username" required /></label>
          <label className="campo"><span>Senha</span><input id="login-senha" type="password" autoComplete="current-password" required /></label>
          <p className="erro" id="login-erro" hidden>Usuário ou senha incorretos.</p>
          <button className="btn cheio" type="submit">Entrar</button>
          {/* link comum (recarrega): o painel e o site usam folhas de estilo diferentes */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a className="login-voltar" href="/">&#8592; voltar para o site</a>
        </form>
      </main>

      {/* ===== painel ===== */}
      <div className="painel" id="painel" hidden>
        <header className="topo">
          <div className="topo-marca">
            <img className="js-avatar" src="/assets/avatar.webp" width={150} height={150} alt="" />
            <div><p className="rotulo">painel</p><h1 className="t-cinema">Painel da Bru</h1></div>
          </div>
          <div className="topo-acoes">
            <button className="btn cheio" type="button" id="previa-btn" aria-pressed="false">&#128065; Prévia</button>
            <a className="btn" href="/" target="_blank" rel="noopener">Ver site &#8599;</a>
            <button className="btn" type="button" id="sair">Sair</button>
          </div>
        </header>

        <div className="painel-corpo">
          <nav className="abas" id="abas" aria-label="Seções do painel"></nav>
          <section className="aba" id="aba" aria-live="polite"></section>

          {/* prévia ao vivo: o site com as mudanças ainda não salvas */}
          <aside className="previa" id="previa" hidden aria-label="Prévia do site">
            <div className="previa-barra">
              <select id="previa-pagina" aria-label="Qual página ver" defaultValue="/">
                <option value="/">Início</option>
                <option value="/portfolio">Portfólio</option>
                <option value="/agenda">Agenda</option>
                <option value="/encomendas">Encomendas</option>
                <option value="/projeto?p=ilustracoes">Um projeto</option>
                <option value="/pagina-que-nao-existe">Aviso: página não existe</option>
                <option value="/erro">Aviso: erro</option>
                <option value="/manutencao">Aviso: fora do ar</option>
              </select>
              <span className="seg mini" role="group" aria-label="Modo">
                <button type="button" data-previa-tema="light" title="Modo claro">&#9728;</button>
                <button type="button" data-previa-tema="dark" title="Modo escuro">&#9790;</button>
              </span>
              <span className="seg mini" role="group" aria-label="Aparelho">
                <button type="button" data-previa-aparelho="celular" title="Celular">&#128241;</button>
                <button type="button" data-previa-aparelho="computador" title="Computador">&#128187;</button>
              </span>
              <button type="button" className="ico-btn" id="previa-fechar" aria-label="Fechar prévia">&times;</button>
            </div>
            <p className="previa-dica">Prévia com as mudanças ainda <b>não salvas</b>.</p>
            <div className="previa-tela" id="previa-tela"><iframe id="previa-frame" title="Prévia do site" loading="lazy"></iframe></div>
          </aside>
        </div>

        {/* escolher uma imagem entre as artes que já estão no site */}
        <dialog className="escolher" id="escolher" aria-labelledby="escolher-t">
          <div className="escolher-cab">
            <h2 className="t-cinema" id="escolher-t">Escolha uma arte</h2>
            <button type="button" className="ico-btn" data-fechar-escolha aria-label="Fechar">&times;</button>
          </div>
          <div className="escolher-grade" id="escolher-grade"></div>
        </dialog>
      </div>

      {/* barra de salvar: aparece quando há mudança não salva */}
      <div className="salvar" id="salvar" aria-hidden="true">
        <div className="salvar-in">
          <p><b>Alterações não salvas</b><span>O site só muda depois de salvar.</span></p>
          <div className="salvar-btns">
            <button className="btn" type="button" id="descartar">Descartar</button>
            <button className="btn cheio" type="button" id="salvar-btn">Salvar alterações</button>
          </div>
        </div>
      </div>

      <div className="aviso-flutuante" id="toast" role="status" aria-live="polite"></div>

      <footer className="rodape rodape-mini">
        <p className="trirreme">Site desenvolvido pela <a href="https://trirreme.com" target="_blank" rel="noopener">TRIRREME</a></p>
      </footer>
    </div>
  );
}
