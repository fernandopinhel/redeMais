# Política de segurança

Este repositório é um **protótipo navegável estático** (HTML, CSS e JavaScript). Ele não tem
back-end, banco de dados nem autenticação real, e não deve ser usado com dados reais de
beneficiários, prestadores ou empresas.

## Reportando uma vulnerabilidade

Se encontrar um problema de segurança, abra um
[security advisory privado](https://github.com/fernandopinhel/redeMais/security/advisories/new)
em vez de uma issue pública.

## Medidas adotadas

- Content Security Policy via `<meta>` em todas as páginas (`script-src 'self'` e `style-src`
  sem `'unsafe-inline'`). Não há `<script>`, `<style>`, `style=` ou `onclick=` escrito no HTML.
- Nenhuma biblioteca de terceiros no runtime: só o código do Orla DS e dos produtos.
- Todo texto entra na página como `textContent`, nunca como HTML.
- Nada é enviado a servidor. A sessão e os dados ficam só no `sessionStorage` do navegador e
  somem ao fechar a aba, ao sair ou ao restaurar os dados de exemplo. As planilhas escolhidas nas
  telas de importação não são lidas.
- A exportação para CSV neutraliza valores que começam com `=`, `+`, `-` ou `@`, evitando injeção
  de fórmulas ao abrir o arquivo numa planilha.
