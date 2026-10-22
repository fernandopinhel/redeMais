/* Orla Mesa: economia potencial, negociada e implantada, com memória de cálculo. */
(function () {
  'use strict';

  const M = window.MESA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!M.shell({ ativo: 'economia' })) return;

  const form = document.getElementById('filtros');
  const memo = DS.lembrarFiltros(form, 'economia');
  DS.selectOptions(form.tipo, M.TIPOS, 'Todos os tipos');
  DS.selectOptions(form.sucursal, R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), 'Todas as sucursais');
  memo.restore();

  const linhas = () => {
    const f = memo.read();
    return M.db.all('negociacoes').filter((n) => (!f.tipo || n.tipo === f.tipo) && (!f.sucursal || R.prestador(n.prestador).sucursal === f.sucursal))
      .map((n) => Object.assign({ c: M.calcular(n) }, n));
  };

  function memoria(n) {
    DS.dialog({
      titulo: 'Memória de cálculo',
      icone: 'calculator',
      wide: true,
      somenteOk: true,
      confirmar: 'Fechar',
      descricao: M.nomePrestador(n.prestador) + ', ' + n.grupo + '.',
      montar(corpo) {
        corpo.appendChild(h('ol', { class: 'calc' }, n.c.passos.map((s) => h('li', { class: s.r ? 'is-result' : '' },
          h('span', { class: 'calc__what' }, h('span', { text: s.o }), h('small', { text: s.d })),
          h('span', { class: 'calc__value', text: s.v })))));
        corpo.appendChild(h('p', { class: 'mt' }, h('a', { href: 'mesa.html?id=' + n.id, text: 'Abrir a negociação na mesa' })));
      }
    });
  }

  const colsTipo = [
    { key: 'tipo', label: 'Tipo de negociação', sort: true },
    { key: 'qtd', label: 'Negociações', num: true, sort: true },
    { key: 'potencial', label: 'Potencial', num: true, sort: true, render: (r) => fmt.money(r.potencial), csv: (r) => fmt.decimal(r.potencial) },
    { key: 'negociada', label: 'Negociada', num: true, sort: true, render: (r) => fmt.money(r.negociada), csv: (r) => fmt.decimal(r.negociada) },
    { key: 'implantada', label: 'Implantada', num: true, sort: true, render: (r) => fmt.money(r.implantada), csv: (r) => fmt.decimal(r.implantada) },
    { key: 'conv', label: 'Do potencial ao implantado', num: true, sort: (r) => (r.potencial ? r.implantada / r.potencial : 0), render: (r) => (r.potencial ? fmt.pct(r.implantada / r.potencial) : '—'), csv: (r) => (r.potencial ? fmt.pct(r.implantada / r.potencial) : '') }
  ];
  const colsNeg = [
    { key: 'prestador', label: 'Prestador', sort: (n) => M.nomePrestador(n.prestador), render: (n) => h('span', null, h('a', { href: 'mesa.html?id=' + n.id, text: M.nomePrestador(n.prestador) }), h('span', { class: 'cell-sub', text: n.grupo })), csv: (n) => M.nomePrestador(n.prestador) + ' / ' + n.grupo },
    { key: 'situacao', label: 'Situação', sort: (n) => M.situacao(n).t, render: M.situacaoBadge, csv: (n) => M.situacao(n).t },
    { key: 'potencial', label: 'Potencial', num: true, sort: (n) => n.c.potencial, render: (n) => fmt.money(n.c.potencial), csv: (n) => fmt.decimal(n.c.potencial) },
    { key: 'negociada', label: 'Negociada', num: true, sort: (n) => n.c.negociada, render: (n) => fmt.money(n.c.negociada), csv: (n) => fmt.decimal(n.c.negociada) },
    { key: 'implantada', label: 'Implantada', num: true, sort: (n) => n.c.implantada, render: (n) => fmt.money(n.c.implantada), csv: (n) => fmt.decimal(n.c.implantada) },
    { key: '_m', label: 'Memória de cálculo', srOnly: true, class: 'col-actions', render: (n) => h('button', { type: 'button', class: 'btn btn--sm', 'aria-label': 'Memória de cálculo de ' + M.nomePrestador(n.prestador) + ', ' + n.grupo, onClick: () => memoria(n) }, icon('calculator'), 'Memória') }
  ];
  let tTipo;
  let tNeg;

  function render(anunciar) {
    const ls = linhas();
    const soma = (k) => ls.reduce((s, n) => s + n.c[k], 0);
    const pot = soma('potencial');
    const neg = soma('negociada');
    const imp = soma('implantada');
    DS.fill(document.getElementById('funil'),
      h('li', null, h('span', { text: 'Economia potencial' }), h('strong', { text: fmt.money(pot) }), h('small', { text: fmt.plural(ls.length, 'negociação', 'negociações') })),
      h('li', null, h('span', { text: 'Economia negociada' }), h('strong', { text: fmt.money(neg) }), h('small', { text: pot ? fmt.pct(neg / pot) + ' do potencial' : '' })),
      h('li', null, h('span', { text: 'Economia implantada' }), h('strong', { text: fmt.money(imp) }), h('small', { text: neg ? fmt.pct(imp / neg) + ' do negociado' : '' })));

    const porTipo = M.TIPOS.map((t) => {
      const l = ls.filter((n) => n.tipo === t);
      return { id: t, tipo: t, qtd: l.length, potencial: l.reduce((s, n) => s + n.c.potencial, 0), negociada: l.reduce((s, n) => s + n.c.negociada, 0), implantada: l.reduce((s, n) => s + n.c.implantada, 0) };
    }).filter((x) => x.qtd);
    const barras = document.getElementById('barras');
    DS.fill(barras, DS.bars(porTipo.slice().sort((a, b) => b.negociada - a.negociada).map((x) => ({ label: x.tipo, valor: x.negociada })), fmt.moneyShort));
    DS.aplicaLarguras(barras);

    if (!tTipo) tTipo = DS.dataTable({ container: document.getElementById('por-tipo'), caption: 'Economia por tipo de negociação', columns: colsTipo, rows: porTipo, paginate: false, sortKey: 'negociada', sortDir: 'desc' });
    else tTipo.update(porTipo);
    if (!tNeg) tNeg = DS.dataTable({ container: document.getElementById('por-negociacao'), caption: 'Economia por negociação', columns: colsNeg, rows: ls, sortKey: 'potencial', sortDir: 'desc', pageSize: 10 });
    else tNeg.update(ls);
    if (anunciar) DS.announce('Economia recalculada: ' + fmt.money(neg) + ' negociados.');
  }

  form.addEventListener('change', () => { memo.save(); render(true); });
  form.addEventListener('submit', (ev) => ev.preventDefault());
  document.getElementById('csv-tipo').addEventListener('click', () => DS.downloadCsv('economia-por-tipo.csv', colsTipo, tTipo.rows()));
  document.getElementById('csv-neg').addEventListener('click', () => DS.downloadCsv('economia-por-negociacao.csv', colsNeg.filter((c) => c.key !== '_m'), tNeg.rows()));

  render();
  DS.pronto('Economia');
})();
