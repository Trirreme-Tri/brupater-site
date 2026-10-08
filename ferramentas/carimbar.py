"""
Carimba uma versão nos arquivos .css e .js que as páginas carregam
(ex.: js/site.js?v=20261008-1450).

Por quê: o GitHub Pages deixa o navegador guardar os arquivos por um tempo
(cache). Sem o carimbo, quem já tinha aberto o site pode receber a página
nova com scripts antigos, e aí nada funciona direito (imagem não aparece,
botão some). Mudando o carimbo, o navegador é obrigado a baixar de novo.

Uso (rodar antes de cada push que mexa em css/js):
    python3 ferramentas/carimbar.py
"""
import pathlib, re, time

raiz = pathlib.Path(__file__).resolve().parent.parent
versao = time.strftime("%Y%m%d-%H%M")
padrao = re.compile(r'((?:href|src)="(?:css|js)/[\w.-]+\.(?:css|js))(?:\?v=[\w-]+)?"')
for pagina in sorted(raiz.glob("*.html")):
    texto = pagina.read_text(encoding="utf-8")
    novo, n = padrao.subn(lambda m: f'{m.group(1)}?v={versao}"', texto)
    if n:
        pagina.write_text(novo, encoding="utf-8")
        print(f"{pagina.name}: {n} arquivos carimbados com v={versao}")
