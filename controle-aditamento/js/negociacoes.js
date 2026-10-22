/* Orla Placar: lista de negociações (listados e não listados). */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'negociacoes', semTemporada: true })) return;

  const form = document.getElementById('filtros');
  const resultado = document.getElementById('resultado');
  const info = document.getElementById('resultado-info');
  const memo = DS.lembrarFiltros(form, 'negociacoes');

  DS.selectOptions(form.tipo, P.TIPOS, 'Todos os tipos');
  DS.selectOptions(form.sucursal, R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), 'Todas as sucursais');
  DS.selectOptions(form.status, P.STATUS, 'Todos os status');
  DS.selectOptions(form.responsavel, R.pessoas.filter((p) => p.perfis.placar).map((p) => ({ value: p.matricula, label: p.nome })), 'Todas as pessoas');

  memo.restore();
  if (DS.param('tipo')) form.tipo.value = DS.param('tipo');
  if (DS.param('paradas')) form.paradas.checked = true;

  const limite = DS.somaDias(DS.hoje(), -30);
  const novaId = Number(DS.store.get('destaque', 0));
  DS.store.remove('destaque');

  function filtrar() {
    const f = memo.read();
    const termo = DS.normaliza(f.busca);
    return P.db.all('negociacoes').filter((n) => {
      const p = R.prestador(n.prestador);
      if (f.lista === 'listados' && !n.listado) return false;
      if (f.lista === 'nao-listados' && n.listado) return false;
      if (termo && DS.normaliza(p.nome + ' ' + p.codigo + ' ' + n.grupo).indexOf(termo) < 0) return false;
      if (f.tipo && n.tipo !== f.tipo) return false;
      if (f.sucursal && p.sucursal !== f.sucursal) return false;
      if (f.status && n.status !== f.status) return false;
      if (f.responsavel && n.responsavel !== f.responsavel) return false;
      if (f.paradas && !((n.status === 'Em negociação' || n.status === 'Aguardando assinatura') && n.atualizadoEm < limite)) return false;
      return true;
    });
  }

  const colunas = [
    { key: 'prestador', label: 'Prestador', sort: (r) => P.nomePrestador(r.prestador), render: (r) => h('span', null, h('a', { href: 'negociacao.html?id=' + r.id, text: P.nomePrestador(r.prestador) }), h('span', { class: 'cell-sub', text: 'Código ' + r.prestador + (r.listado ? '' : ' · não listado') })), csv: (r) => P.nomePrestador(r.prestador) },
    { key: 'tipo', label: 'Aditivo', sort: true, render: (r) => h('span', null, r.tipo, h('span', { class: 'cell-sub', text: r.grupo })), csv: (r) => r.tipo + ' / ' + r.grupo },
    { key: 'sucursal', label: 'Sucursal', sort: (r) => R.prestador(r.prestador).sucursal, render: (r) => R.prestador(r.prestador).sucursal, csv: (r) => R.sucursalNome(R.prestador(r.prestador).sucursal) },
    { key: 'status', label: 'Status', sort: true, render: (r) => P.statusBadge(r.status) },
    { key: 'sinistro', label: 'Sinistro base', num: true, sort: (r) => P.sinistro(r), render: (r) => fmt.money(P.sinistro(r)), csv: (r) => fmt.decimal(P.sinistro(r)) },
    { key: 'economia', label: 'Economia', num: true, sort: (r) => P.economia(r), render: (r) => (P.economia(r) ? fmt.money(P.economia(r)) : '—'), csv: (r) => fmt.decimal(P.economia(r)) },
    { key: 'atualizadoEm', label: 'Último movimento', sort: true, render: (r) => h('span', null, fmt.date(r.atualizadoEm), h('span', { class: 'cell-sub', text: fmt.ha(DS.diasEntre(r.atualizadoEm, DS.hoje())) })), csv: (r) => fmt.date(r.atualizadoEm) }
  ];

  const tabela = DS.dataTable({
    container: resultado,
    caption: 'Negociações',
    columns: colunas,
    rows: [],
    rowKey: (r) => r.id,
    sortKey: 'atualizadoEm',
    sortDir: 'desc',
    highlight: (r) => r.id === novaId,
    emptyTitle: 'Nenhuma negociação com esses filtros',
    emptyText: 'Tente outro tipo, sucursal ou status.'
  });

  function atualizar(anunciar) {
    const linhas = filtrar();
    tabela.update(linhas);
    const economia = linhas.reduce((s, n) => s + P.economia(n), 0);
    info.textContent = fmt.plural(linhas.length, 'negociação encontrada', 'negociações encontradas') + ', com ' + fmt.money(economia) + ' de economia acordada.';
    if (anunciar) DS.announce(info.textContent);
  }

  form.addEventListener('submit', (ev) => { ev.preventDefault(); memo.save(); atualizar(true); });
  form.addEventListener('change', (ev) => { if (ev.target.name === 'lista' || ev.target.name === 'paradas') { memo.save(); atualizar(true); } });
  document.getElementById('limpar').addEventListener('click', () => {
    form.reset();
    memo.clear();
    atualizar(true);
    form.busca.focus();
  });
  document.getElementById('exportar').addEventListener('click', () => DS.downloadCsv('negociacoes.csv', colunas, tabela.rows()));

  // Nova negociação: os itens vêm da base de sinistro do prestador.
  document.getElementById('nova').addEventListener('click', () => {
    DS.dialog({
      titulo: 'Abrir nova negociação',
      descricao: 'Os itens e o sinistro dos últimos 12 meses vêm da base do prestador. Depois é só registrar os valores negociados.',
      confirmar: 'Abrir negociação',
      wide: true,
      montar(corpo) {
        const grade = h('div', { class: 'form-grid' },
          DS.field({ id: 'n-prestador', label: 'Prestador', tipo: 'select', required: true, span: 12, opcoes: R.prestadores.map((p) => ({ value: p.codigo, label: p.nome + ' (' + p.codigo + ')' })) }),
          DS.field({ id: 'n-tipo', label: 'Tipo de aditivo', tipo: 'select', required: true, span: 6, opcoes: P.TIPOS }),
          DS.field({ id: 'n-grupo', label: 'Grupo ou especialidade', tipo: 'select', required: true, span: 6, opcoes: [], dica: 'Escolha o tipo primeiro.' }),
          DS.choiceGroup({ id: 'n-listado', name: 'listado', label: 'Os itens estão na lista de referência?', opcoes: [{ value: 'sim', label: 'Sim, são listados' }, { value: 'nao', label: 'Não listados' }], valor: 'sim', required: true, box: true }));
        corpo.appendChild(grade);
        const tipo = corpo.querySelector('#n-tipo');
        const grupo = corpo.querySelector('#n-grupo');
        tipo.addEventListener('change', () => {
          DS.fill(grupo, h('option', { value: '', text: 'Selecione' }));
          (P.GRUPOS[tipo.value] || []).forEach((g) => grupo.appendChild(h('option', { value: g, text: g })));
        });
      },
      aoConfirmar(f) {
        const prestador = f.querySelector('#n-prestador');
        const tipo = f.querySelector('#n-tipo');
        const grupo = f.querySelector('#n-grupo');
        const ok = DS.validateForm(f, {
          extra(addErro) {
            const aberta = P.db.all('negociacoes').find((n) => n.prestador === prestador.value && n.tipo === tipo.value && n.grupo === grupo.value && (n.status === 'Em negociação' || n.status === 'Aguardando assinatura'));
            if (aberta) addErro(grupo, 'Já existe uma negociação aberta para esse prestador, tipo e grupo. Continue por ela.');
          }
        });
        if (!ok) return false;
        return { prestador: prestador.value, tipo: tipo.value, grupo: grupo.value, listado: f.querySelector('input[name="listado"]:checked').value === 'sim' };
      }
    }).then((dados) => {
      if (!dados) return;
      const nova = P.db.insert('negociacoes', Object.assign(dados, novaBase(dados)));
      DS.flash('Negociação aberta. Registre os valores conforme a conversa com o prestador avançar.');
      window.location.href = 'negociacao.html?id=' + nova.id;
    });
  });

  function novaBase(d) {
    const r = DS.rand(Number(d.prestador) + d.tipo.length * 31 + d.grupo.length);
    const hj = DS.hoje();
    const faixa = { 'Quimioterapia': [1800, 9000, 12, 180], 'Ambulatório': [120, 900, 80, 1200], 'Materiais e medicamentos': [15, 600, 200, 4800], 'Diária global': [600, 4200, 50, 900] }[d.tipo];
    const nomes = { 'Quimioterapia': ['Aplicação de quimioterapia venosa', 'Taxa de sala de infusão', 'Consulta oncológica'], 'Ambulatório': ['Exame simples', 'Exame com sedação', 'Laudo complementar'], 'Materiais e medicamentos': ['Fios de sutura', 'Cateteres venosos', 'Contraste iodado'], 'Diária global': ['Diária de enfermaria', 'Diária de apartamento', 'Diária de UTI'] }[d.tipo];
    const u = DS.usuario();
    return {
      periodoBase: { ini: DS.somaDias(hj.slice(0, 7) + '-01', -365).slice(0, 7), fim: DS.somaDias(hj.slice(0, 7) + '-01', -1).slice(0, 7) },
      itens: nomes.map((desc) => ({ codigo: String(80000000 + r.int(1000000, 9999999)), descricao: desc, freq: r.int(faixa[2], faixa[3]), cm: r.money(faixa[0], faixa[1]), novo: null })),
      inicio: hj,
      status: 'Em negociação',
      dataNegociacao: null,
      dataAssinatura: null,
      responsavel: u.matricula,
      observacao: '',
      atualizadoEm: hj,
      historico: [{ quando: new Date().toISOString(), quem: u.nome, texto: 'Negociação aberta.' }]
    };
  }

  atualizar();
  DS.pronto('Negociações');
})();
