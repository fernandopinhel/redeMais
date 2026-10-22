/* Orla Placar: importação da base de sinistro (simulada: o arquivo não sai do navegador). */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  if (!P.shell({ ativo: 'importacoes', semTemporada: true })) return;

  const form = document.getElementById('importar-form');
  const arquivo = document.getElementById('arquivo');
  const tipo = document.getElementById('tipo');
  const enviar = form.querySelector('[type="submit"]');
  let destaque = null;

  DS.selectOptions(tipo, P.TIPOS, 'Selecione');
  tipo.options[0].textContent = 'Selecione';

  const situacao = (r) => (r.inconsistencias.length ? DS.badge(fmt.plural(r.inconsistencias.length, 'aviso', 'avisos'), 'warning') : DS.badge('Processada', 'success'));
  const colunas = [
    { key: 'protocolo', label: 'Protocolo', sort: true, render: (r) => h('span', { class: 'mono', text: r.protocolo }) },
    { key: 'quando', label: 'Data', sort: true, render: (r) => fmt.dateTime(r.quando), csv: (r) => fmt.dateTime(r.quando) },
    { key: 'arquivo', label: 'Arquivo', sort: true, render: (r) => h('span', null, r.arquivo, h('span', { class: 'cell-sub', text: r.tipo + ' · ' + r.versao })) },
    { key: 'usuario', label: 'Enviado por', sort: true },
    { key: 'atualizados', label: 'Prestadores atualizados', num: true, sort: true },
    { key: 'sit', label: 'Situação', sort: (r) => r.inconsistencias.length, render: situacao, csv: (r) => (r.inconsistencias.length ? r.inconsistencias.length + ' avisos' : 'Processada') },
    { key: '_acao', label: 'Ações', srOnly: true, class: 'col-actions', render: (r) => h('button', { type: 'button', class: 'btn btn--sm', onClick: () => detalhes(r), 'aria-label': 'Ver detalhes da importação ' + r.protocolo }, 'Detalhes') }
  ];
  const tabela = DS.dataTable({
    container: document.getElementById('historico'),
    caption: 'Importações enviadas',
    columns: colunas,
    rows: P.db.all('importacoes'),
    rowKey: (r) => r.id,
    sortKey: 'quando',
    sortDir: 'desc',
    highlight: (r) => r.id === destaque,
    emptyTitle: 'Nenhuma importação ainda'
  });

  function detalhes(r) {
    DS.dialog({
      titulo: 'Importação ' + r.protocolo,
      wide: true,
      somenteOk: true,
      confirmar: 'Fechar',
      montar(corpo) {
        corpo.appendChild(h('dl', { class: 'facts' },
          h('div', null, h('dt', { text: 'Arquivo' }), h('dd', { text: r.arquivo })),
          h('div', null, h('dt', { text: 'Tipo de aditivo' }), h('dd', { text: r.tipo })),
          h('div', null, h('dt', { text: 'Enviado em' }), h('dd', { text: fmt.dateTime(r.quando) })),
          h('div', null, h('dt', { text: 'Prestadores atualizados' }), h('dd', { text: fmt.int(r.atualizados) }))));
        if (!r.inconsistencias.length) {
          corpo.appendChild(h('div', { class: 'alert alert--success' }, icon('check-circle'), h('div', { class: 'alert__body' }, h('p', { text: 'Tudo certo: nenhuma linha com problema.' }))));
          return;
        }
        corpo.appendChild(h('div', { class: 'alert alert--warning' }, icon('alert'), h('div', { class: 'alert__body' }, h('p', { text: 'Essas linhas foram ignoradas. Corrija na planilha e envie de novo; as outras linhas já valem.' }))));
        const div = h('div');
        corpo.appendChild(div);
        DS.dataTable({
          container: div,
          caption: 'Linhas com problema',
          paginate: false,
          compact: true,
          rows: r.inconsistencias,
          columns: [{ key: 'aba', label: 'Aba' }, { key: 'linha', label: 'Linha', num: true }, { key: 'texto', label: 'O que aconteceu' }]
        });
      }
    });
  }

  arquivo.addEventListener('change', () => {
    const f = arquivo.files[0];
    document.getElementById('arquivo-nome').textContent = f ? 'Pronto para processar: ' + f.name + ' (' + Math.max(1, Math.round(f.size / 1024)) + ' KB).' : '';
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const f = arquivo.files[0];
    const ok = DS.validateForm(form, {
      extra(addErro) {
        if (!f) addErro(arquivo, 'Escolha a planilha da base de sinistro.');
        else if (!/\.(xlsx|xls|csv)$/i.test(f.name)) addErro(arquivo, 'Use uma planilha .xlsx, .xls ou .csv.');
        else if (f.size > 10 * 1024 * 1024) addErro(arquivo, 'O arquivo passa de 10 MB. Divida a planilha por sucursal.');
      }
    });
    if (!ok) return;

    // Simula o processamento: o arquivo não é lido nem enviado.
    enviar.disabled = true;
    form.setAttribute('aria-busy', 'true');
    DS.fill(enviar, icon('hourglass'), 'Processando…');
    DS.announce('Processando a planilha.');
    window.setTimeout(() => {
      const r = DS.rand(f.size + f.name.length);
      const avisos = r.chance(.45) ? r.int(1, 3) : 0;
      const sucursais = window.REDE.sucursais;
      const agora = new Date().toISOString();
      const versao = 'v' + (P.db.all('importacoes').filter((i) => i.tipo === tipo.value).length + 1);
      const novo = P.db.insert('importacoes', {
        protocolo: 'IMP-' + DS.hoje().replace(/-/g, '').slice(2) + '-' + r.int(100, 999),
        quando: agora,
        arquivo: f.name,
        tipo: tipo.value,
        usuario: DS.usuario().nome,
        versao,
        atualizados: r.int(4, 30),
        inconsistencias: Array.from({ length: avisos }, (_, j) => ({ aba: r.pick(sucursais).nome, linha: r.int(3, 120), texto: ['Código de prestador não encontrado na rede.', 'Frequência zerada para um item com custo.', 'Período base com mais de 12 meses.'][j % 3] }))
      });
      destaque = novo.id;
      tabela.update(P.db.all('importacoes'));
      enviar.disabled = false;
      form.removeAttribute('aria-busy');
      DS.fill(enviar, icon('upload'), 'Processar planilha');
      form.reset();
      document.getElementById('arquivo-nome').textContent = '';
      DS.toast(avisos ? 'Planilha processada com ' + fmt.plural(avisos, 'aviso', 'avisos') + '. Veja os detalhes no protocolo ' + novo.protocolo + '.' : 'Planilha processada. ' + novo.atualizados + ' prestadores atualizados.', avisos ? 'error' : null);
    }, 1200);
  });

  DS.pronto('Importações');
})();
