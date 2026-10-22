/* Orla Esteira: quadro das fichas por fase, com relógio de prazo. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  const u = E.shell({ ativo: 'esteira' });
  if (!u) return;

  const form = document.getElementById('filtros');
  const memo = DS.lembrarFiltros(form, 'esteira');
  const quadro = document.getElementById('quadro');
  const kpis = document.getElementById('kpis');
  const info = document.getElementById('resultado-info');

  DS.selectOptions(form.sucursal, R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), 'Todas as sucursais');
  DS.selectOptions(form.prioridade, E.PRIORIDADES, 'Todas as prioridades');
  DS.selectOptions(form.tipo, ['Credenciamento', 'Manutenção'], 'Todos os tipos');
  memo.restore();

  const LIMITE_CARTOES = 8;
  const ORDEM = { late: 0, soon: 1, ok: 2, done: 3 };

  function filtrar() {
    const f = memo.read();
    const termo = DS.normaliza(f.busca);
    const hj = DS.hoje();
    return E.db.all('fichas').filter((x) => {
      if (x.etapa === 'concluida' && DS.diasEntre(x.concluidaEm, hj) > 30) return false;
      if (termo && DS.normaliza(x.numero + ' ' + E.nomePrestador(x.prestador) + ' ' + x.prestador).indexOf(termo) < 0) return false;
      if (f.sucursal && x.sucursal !== f.sucursal) return false;
      if (f.prioridade && x.prioridade !== f.prioridade) return false;
      if (f.tipo && x.tipo !== f.tipo) return false;
      if (f.minhas && x.responsavel !== u.matricula) return false;
      if (f.atrasadas && E.relogio(x).estado !== 'late') return false;
      return true;
    }).sort((a, b) => ORDEM[E.relogio(a).estado] - ORDEM[E.relogio(b).estado] || (E.relogio(a).dias || 0) - (E.relogio(b).dias || 0));
  }

  function cartao(x) {
    const classe = x.prioridade === 'Rede Prima' ? ' ticket--prima' : x.prioridade === 'Prioridade' ? ' ticket--prioridade' : '';
    return h('li', { class: 'ticket' + classe },
      h('div', { class: 'ticket__top' }, h('span', { class: 'mono', text: x.numero }), E.prioBadge(x.prioridade)),
      h('h3', { class: 'ticket__title' }, h('a', { href: 'ficha.html?id=' + x.id, text: E.nomePrestador(x.prestador) })),
      h('p', { class: 'ticket__step', text: E.etapa(x.etapa === 'devolvida' ? x.devolvidaDe : x.etapa).nome + ' · ' + x.tipo }),
      h('div', { class: 'ticket__foot' },
        E.clock(x),
        h('span', { class: 'cluster' }, h('span', { class: 'avatar avatar--sm', 'aria-hidden': 'true', text: DS.iniciais(E.nomePessoa(x.responsavel)) }), h('span', { class: 'visually-hidden', text: 'Responsável: ' + E.nomePessoa(x.responsavel) }))));
  }

  function coluna(id, titulo, ic, lista, classe, vazio) {
    const ul = h('ul', { class: 'lane__list', 'aria-labelledby': id });
    lista.slice(0, LIMITE_CARTOES).forEach((x) => ul.appendChild(cartao(x)));
    const atrasadas = lista.filter((x) => E.relogio(x).estado === 'late').length;
    return h('section', { class: 'lane ' + (classe || ''), 'aria-labelledby': id },
      h('div', { class: 'lane__head' },
        h('h2', { id }, icon(ic), titulo),
        h('span', { class: 'lane__count', 'aria-label': fmt.plural(lista.length, 'ficha', 'fichas') + (atrasadas ? ', ' + atrasadas + ' atrasadas' : ''), text: String(lista.length) })),
      lista.length ? ul : h('p', { class: 'lane__more muted', text: vazio }),
      lista.length > LIMITE_CARTOES ? h('p', { class: 'lane__more' }, h('a', { href: '#lista', 'data-ver-lista': '', text: 'Ver as outras ' + (lista.length - LIMITE_CARTOES) + ' na lista' })) : null);
  }

  let tabela;
  function renderLista(linhas) {
    const cols = [
      { key: 'numero', label: 'Ficha', sort: true, render: (x) => h('a', { href: 'ficha.html?id=' + x.id, class: 'mono', text: x.numero }) },
      { key: 'prestador', label: 'Prestador', sort: (x) => E.nomePrestador(x.prestador), render: (x) => h('span', null, E.nomePrestador(x.prestador), h('span', { class: 'cell-sub', text: x.tipo + ' · ' + x.sucursal })), csv: (x) => E.nomePrestador(x.prestador) },
      { key: 'prioridade', label: 'Prioridade', sort: true, render: (x) => E.prioBadge(x.prioridade) },
      { key: 'etapa', label: 'Etapa', sort: (x) => E.ETAPAS.findIndex((e) => e.chave === x.etapa), render: (x) => E.etapa(x.etapa).nome, csv: (x) => E.etapa(x.etapa).nome },
      { key: 'responsavel', label: 'Responsável', sort: (x) => E.nomePessoa(x.responsavel), render: (x) => E.nomePessoa(x.responsavel), csv: (x) => E.nomePessoa(x.responsavel) },
      { key: 'prazo', label: 'Prazo', sort: (x) => ORDEM[E.relogio(x).estado] * 1000 + (E.relogio(x).dias || 0), render: (x) => E.clock(x), csv: (x) => E.relogio(x).texto }
    ];
    if (!tabela) tabela = DS.dataTable({ container: document.getElementById('lista'), caption: 'Fichas em andamento', columns: cols, rows: linhas, sortKey: 'prazo', pageSize: 15, emptyTitle: 'Nenhuma ficha com esses filtros' });
    else tabela.update(linhas);
    document.getElementById('exportar').onclick = () => DS.downloadCsv('fichas.csv', cols, tabela.rows());
  }

  function render(anunciar) {
    const todas = E.db.all('fichas');
    const abertas = todas.filter((x) => x.etapa !== 'concluida');
    const atrasadas = abertas.filter((x) => E.relogio(x).estado === 'late');
    const vencendo = abertas.filter((x) => E.relogio(x).estado === 'soon' && x.etapa !== 'devolvida');
    const mes = DS.hoje().slice(0, 7);
    const concluidasMes = todas.filter((x) => x.concluidaEm && x.concluidaEm.slice(0, 7) === mes).length;
    const minhas = abertas.filter((x) => x.responsavel === u.matricula).length;
    const kpi = (ic, rotulo, valor, pe) => h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon(ic), rotulo), h('span', { class: 'kpi__value', text: valor }), h('span', { class: 'kpi__foot', text: pe }));
    DS.fill(kpis,
      kpi('kanban', 'Fichas em andamento', fmt.int(abertas.length), fmt.plural(minhas, 'está com você', 'estão com você')),
      kpi('alert', 'Fora do prazo', fmt.int(atrasadas.length), abertas.length ? fmt.pct(atrasadas.length / abertas.length) + ' das fichas abertas' : ''),
      kpi('hourglass', 'Vencem até amanhã', fmt.int(vencendo.length), 'Bom momento para priorizar'),
      kpi('check-circle', 'Concluídas no mês', fmt.int(concluidasMes), 'Aditivos já implantados'));

    const linhas = filtrar();
    const fase = (chave) => linhas.filter((x) => E.etapa(x.etapa).fase === chave);
    DS.fill(quadro,
      E.FASES.map((f) => coluna('fase-' + f.chave, f.nome, f.icone, fase(f.chave), '', 'Nenhuma ficha nesta fase.')),
      coluna('fase-devolvida', 'Devolvidas', 'undo', linhas.filter((x) => x.etapa === 'devolvida'), 'lane--back', 'Nenhuma ficha devolvida.'),
      coluna('fase-concluida', 'Concluídas (30 dias)', 'check-circle', linhas.filter((x) => x.etapa === 'concluida'), 'lane--done', 'Nada concluído nos últimos 30 dias.'));
    const abertasFiltradas = linhas.filter((x) => x.etapa !== 'concluida');
    info.textContent = fmt.plural(abertasFiltradas.length, 'ficha em andamento', 'fichas em andamento') + ' com os filtros atuais, ' + abertasFiltradas.filter((x) => E.relogio(x).estado === 'late').length + ' fora do prazo.';
    renderLista(linhas);
    DS.$$('[data-ver-lista]', quadro).forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); visao('lista', true); }));
    if (anunciar) DS.announce(info.textContent);
  }

  // Quadro ou lista
  const botoesVisao = DS.$$('[data-visao]');
  function visao(qual, foco) {
    botoesVisao.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.visao === qual)));
    document.getElementById('painel-quadro').hidden = qual !== 'quadro';
    document.getElementById('painel-lista').hidden = qual !== 'lista';
    DS.store.set('visao', qual);
    if (foco) {
      const alvo = document.querySelector('#lista .table-wrap');
      if (alvo) alvo.focus();
    }
  }
  botoesVisao.forEach((b) => b.addEventListener('click', () => { visao(b.dataset.visao); DS.announce('Mostrando em ' + b.textContent.trim().toLowerCase() + '.'); }));

  form.addEventListener('submit', (ev) => { ev.preventDefault(); memo.save(); render(true); });
  form.addEventListener('change', (ev) => { if (ev.target.type === 'checkbox' || ev.target.tagName === 'SELECT') { memo.save(); render(true); } });
  document.getElementById('limpar').addEventListener('click', () => { form.reset(); memo.clear(); render(true); form.busca.focus(); });

  render();
  visao(DS.store.get('visao', 'quadro'));
  DS.pronto('Esteira');
})();
