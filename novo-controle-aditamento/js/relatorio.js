/* Orla Esteira: relatório de tempo total da ficha, por fase. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!E.shell({ ativo: 'relatorio' })) return;

  const form = document.getElementById('filtros');
  const memo = DS.lembrarFiltros(form, 'relatorio');
  DS.selectOptions(form.sucursal, R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), 'Todas as sucursais');
  DS.selectOptions(form.prioridade, E.PRIORIDADES, 'Todas as prioridades');
  if (!form.de.value) form.de.value = DS.somaDias(DS.hoje(), -180);
  memo.restore();

  // Dias em cada fase, somando os movimentos (inclusive os que ainda estão abertos).
  function porFase(f) {
    const out = { distribuicao: 0, emissao: 0, assinatura: 0, implantacao: 0 };
    f.movimentos.forEach((m) => { out[E.etapa(m.etapa).fase] += DS.diasEntre(m.de, m.ate || DS.hoje()); });
    return out;
  }
  const total = (f) => DS.diasEntre(f.criadaEm, f.concluidaEm || DS.hoje());
  const prazoTotal = (f) => {
    const sla = E.db.all('sla');
    return E.ETAPAS.reduce((s, e) => s + sla[e.chave][f.prioridade], 0);
  };

  function filtrar() {
    const v = memo.read();
    return E.db.all('fichas').filter((f) => {
      if (v.de && f.criadaEm < v.de) return false;
      if (v.ate && f.criadaEm > v.ate) return false;
      if (v.sucursal && f.sucursal !== v.sucursal) return false;
      if (v.prioridade && f.prioridade !== v.prioridade) return false;
      if (v.situacao === 'concluidas' && f.etapa !== 'concluida') return false;
      if (v.situacao === 'abertas' && f.etapa === 'concluida') return false;
      return true;
    }).map((f) => Object.assign({ fases: porFase(f), dias: total(f), prazo: prazoTotal(f) }, f));
  }

  const cols = [
    { key: 'numero', label: 'Ficha', sort: true, render: (f) => h('a', { href: 'ficha.html?id=' + f.id, class: 'mono', text: f.numero }) },
    { key: 'prestador', label: 'Prestador', sort: (f) => E.nomePrestador(f.prestador), render: (f) => h('span', null, E.nomePrestador(f.prestador), h('span', { class: 'cell-sub', text: f.tipo + ' · ' + f.sucursal + ' · ' + f.prioridade })), csv: (f) => E.nomePrestador(f.prestador) },
    { key: 'criadaEm', label: 'Criada', sort: true, render: (f) => fmt.date(f.criadaEm), csv: (f) => fmt.date(f.criadaEm) },
    { key: 'concluidaEm', label: 'Concluída', sort: (f) => f.concluidaEm || '9', render: (f) => (f.concluidaEm ? fmt.date(f.concluidaEm) : DS.badge('Em aberto', 'info')), csv: (f) => fmt.date(f.concluidaEm) || 'Em aberto' },
    { key: 'd1', label: 'Distribuição', num: true, sort: (f) => f.fases.distribuicao, render: (f) => fmt.int(f.fases.distribuicao), csv: (f) => f.fases.distribuicao },
    { key: 'd2', label: 'Emissão', num: true, sort: (f) => f.fases.emissao, render: (f) => fmt.int(f.fases.emissao), csv: (f) => f.fases.emissao },
    { key: 'd3', label: 'Assinatura', num: true, sort: (f) => f.fases.assinatura, render: (f) => fmt.int(f.fases.assinatura), csv: (f) => f.fases.assinatura },
    { key: 'd4', label: 'Implantação', num: true, sort: (f) => f.fases.implantacao, render: (f) => fmt.int(f.fases.implantacao), csv: (f) => f.fases.implantacao },
    { key: 'dias', label: 'Total (dias)', num: true, sort: true, render: (f) => h('span', { class: 'cluster' }, fmt.int(f.dias), f.dias > f.prazo ? DS.badge('Acima de ' + f.prazo, 'danger') : null), csv: (f) => f.dias },
    { key: 'devolucoes', label: 'Devoluções', num: true, sort: true }
  ];
  const tabela = DS.dataTable({ container: document.getElementById('resultado'), caption: 'Tempo total de cada ficha, em dias por fase', columns: cols, rows: [], sortKey: 'dias', sortDir: 'desc', pageSize: 12, emptyTitle: 'Nenhuma ficha nesse período' });

  function atualizar(anunciar) {
    const linhas = filtrar();
    tabela.update(linhas);
    const media = (fn) => (linhas.length ? linhas.reduce((s, f) => s + fn(f), 0) / linhas.length : 0);
    const dentro = linhas.filter((f) => f.dias <= f.prazo).length;
    DS.fill(document.getElementById('kpis'),
      h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('file'), 'Fichas no período'), h('span', { class: 'kpi__value', text: fmt.int(linhas.length) }), h('span', { class: 'kpi__foot', text: fmt.plural(linhas.filter((f) => f.concluidaEm).length, 'concluída', 'concluídas') })),
      h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('clock'), 'Tempo médio total'), h('span', { class: 'kpi__value', text: fmt.dias(Math.round(media((f) => f.dias))) }), h('span', { class: 'kpi__foot', text: 'Da criação à implantação (ou até hoje)' })),
      h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('check-circle'), 'Dentro do prazo total'), h('span', { class: 'kpi__value', text: linhas.length ? fmt.pct(dentro / linhas.length) : '—' }), h('span', { class: 'kpi__foot', text: 'Soma dos prazos das etapas' })));
    const barras = document.getElementById('barras');
    DS.fill(barras, DS.bars(E.FASES.map((fa) => ({ label: fa.nome, valor: Math.round(media((f) => f.fases[fa.chave]) * 10) / 10 })), (v) => fmt.decimal(v) + ' dias'));
    DS.fill(document.getElementById('barras-texto'), 'Média de dias por fase: ' + E.FASES.map((fa) => fa.nome + ' ' + fmt.decimal(media((f) => f.fases[fa.chave]))).join(', ') + '.');
    DS.aplicaLarguras(barras);
    const info = fmt.plural(linhas.length, 'ficha encontrada', 'fichas encontradas') + '.';
    document.getElementById('resultado-info').textContent = info;
    if (anunciar) DS.announce(info);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = DS.validateForm(form, { extra: (add) => { if (form.de.value && form.ate.value && form.ate.value < form.de.value) add(form.ate, 'A data final precisa ser depois da inicial.'); } });
    if (!ok) return;
    memo.save();
    atualizar(true);
  });
  document.getElementById('limpar').addEventListener('click', () => { form.reset(); memo.clear(); DS.clearErrors(form); form.de.value = DS.somaDias(DS.hoje(), -180); atualizar(true); });

  document.getElementById('csv-analitico').addEventListener('click', () => DS.downloadCsv('tempo-fichas-analitico.csv', cols, tabela.rows()));
  document.getElementById('csv-sintetico').addEventListener('click', () => {
    const linhas = tabela.rows();
    const porSuc = R.sucursais.map((s) => {
      const l = linhas.filter((f) => f.sucursal === s.sigla);
      const m = (fn) => (l.length ? Math.round(l.reduce((a, f) => a + fn(f), 0) / l.length * 10) / 10 : 0);
      return { sucursal: s.nome, qtd: l.length, media: m((f) => f.dias), dist: m((f) => f.fases.distribuicao), emi: m((f) => f.fases.emissao), ass: m((f) => f.fases.assinatura), imp: m((f) => f.fases.implantacao), dentro: l.length ? fmt.pct(l.filter((f) => f.dias <= f.prazo).length / l.length) : '' };
    });
    DS.downloadCsv('tempo-fichas-sintetico.csv', [
      { label: 'Sucursal', key: 'sucursal' }, { label: 'Fichas', key: 'qtd' }, { label: 'Média total (dias)', key: 'media', csv: (r) => fmt.decimal(r.media) },
      { label: 'Distribuição', key: 'dist', csv: (r) => fmt.decimal(r.dist) }, { label: 'Emissão', key: 'emi', csv: (r) => fmt.decimal(r.emi) },
      { label: 'Assinatura', key: 'ass', csv: (r) => fmt.decimal(r.ass) }, { label: 'Implantação', key: 'imp', csv: (r) => fmt.decimal(r.imp) }, { label: 'Dentro do prazo', key: 'dentro' }
    ], porSuc);
  });

  atualizar();
  DS.pronto('Relatório de tempo');
})();
