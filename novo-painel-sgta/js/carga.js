/* Orla Mesa: carga da base de negociações da Rede Prima (simulada no navegador). */
(function () {
  'use strict';

  const M = window.MESA;
  const { h, icon, fmt } = DS;
  if (!M.shell({ ativo: 'carga' })) return;

  const form = document.getElementById('carga-form');
  const arquivo = document.getElementById('arquivo');
  const enviar = form.querySelector('[type="submit"]');
  let destaque = null;

  const tabela = DS.dataTable({
    container: document.getElementById('historico'),
    caption: 'Cargas da base',
    rows: M.db.all('cargas'),
    rowKey: (r) => r.id,
    sortKey: 'quando',
    sortDir: 'desc',
    highlight: (r) => r.id === destaque,
    columns: [
      { key: 'protocolo', label: 'Protocolo', sort: true, render: (r) => h('span', { class: 'mono', text: r.protocolo }) },
      { key: 'quando', label: 'Data', sort: true, render: (r) => fmt.dateTime(r.quando) },
      { key: 'arquivo', label: 'Arquivo', sort: true, render: (r) => h('span', null, r.arquivo, h('span', { class: 'cell-sub', text: 'Versão ' + r.versao.slice(1) })) },
      { key: 'linhas', label: 'Linhas lidas', num: true, sort: true, render: (r) => fmt.int(r.linhas) },
      { key: 'novas', label: 'Negociações novas', num: true, sort: true },
      { key: 'usuario', label: 'Enviado por', sort: true }
    ]
  });

  arquivo.addEventListener('change', () => {
    const f = arquivo.files[0];
    document.getElementById('arquivo-nome').textContent = f ? f.name : 'Nenhum arquivo escolhido.';
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = arquivo.files[0];
    const ok = DS.validateForm(form, {
      extra(add) {
        if (!f) add(arquivo, 'Escolha a planilha da base da Rede Prima.');
        else if (!/\.(xlsx|xls|csv)$/i.test(f.name)) add(arquivo, 'Use uma planilha .xlsx, .xls ou .csv.');
        else if (M.db.all('cargas').some((c) => c.arquivo === f.name)) add(arquivo, 'Um arquivo com esse nome já foi carregado. Renomeie com a nova versão.');
      }
    });
    if (!ok) return;
    enviar.disabled = true;
    form.setAttribute('aria-busy', 'true');
    DS.fill(enviar, icon('hourglass'), 'Carregando…');
    DS.announce('Carregando a base.');
    window.setTimeout(() => {
      const r = DS.rand(f.size + f.name.length * 7);
      const versao = 'v' + (M.db.all('cargas').length + 1);
      const nova = M.db.insert('cargas', {
        protocolo: 'CRG-' + (2040 + M.db.all('cargas').length),
        quando: new Date().toISOString(),
        versao,
        arquivo: f.name,
        usuario: DS.usuario().nome,
        linhas: r.int(150, 400),
        novas: r.int(0, 12)
      });
      destaque = nova.id;
      tabela.update(M.db.all('cargas'));
      enviar.disabled = false;
      form.removeAttribute('aria-busy');
      DS.fill(enviar, icon('upload'), 'Carregar base');
      form.reset();
      document.getElementById('arquivo-nome').textContent = 'Nenhum arquivo escolhido.';
      DS.toast('Base carregada: protocolo ' + nova.protocolo + ', ' + nova.linhas + ' linhas lidas.');
    }, 1100);
  });

  DS.pronto('Carga da base');
})();
