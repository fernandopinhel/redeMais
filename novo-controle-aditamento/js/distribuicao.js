/* Orla Esteira: carga por pessoa, fila de distribuição e troca de emissor em lote. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  const u = E.shell({ ativo: 'distribuicao' });
  if (!u) return;

  const fichas = () => E.db.all('fichas');
  const abertas = () => fichas().filter((f) => f.etapa !== 'concluida');
  let destaque = [];

  /* -------------------------------------------------------- Carga por pessoa */
  let tabCarga;
  function renderCarga() {
    const pessoas = R.pessoas.filter((p) => p.perfis.esteira);
    const linhas = pessoas.map((p) => {
      const minhas = abertas().filter((f) => f.responsavel === p.matricula);
      return {
        id: p.matricula, nome: p.nome, equipe: p.equipe, total: minhas.length,
        prima: minhas.filter((f) => f.prioridade === 'Rede Prima').length,
        atrasadas: minhas.filter((f) => E.relogio(f).estado === 'late').length
      };
    });
    const max = Math.max.apply(null, linhas.map((l) => l.total).concat([1]));
    const cols = [
      { key: 'nome', label: 'Pessoa', sort: true, render: (l) => h('span', { class: 'cluster' }, h('span', { class: 'avatar avatar--sm', 'aria-hidden': 'true', text: DS.iniciais(l.nome) }), l.nome) },
      { key: 'equipe', label: 'Equipe', sort: true },
      { key: 'total', label: 'Fichas em aberto', sort: true, render: (l) => h('div', { class: 'load' }, DS.meter({ valor: l.total, max, tom: l.total / max > .8 ? 'warning' : 'plain' }), h('span', { class: 'num', text: String(l.total) })), csv: (l) => l.total },
      { key: 'prima', label: 'Rede Prima', num: true, sort: true },
      { key: 'atrasadas', label: 'Fora do prazo', num: true, sort: true, render: (l) => (l.atrasadas ? DS.badge(String(l.atrasadas), 'danger') : '0'), csv: (l) => l.atrasadas }
    ];
    if (!tabCarga) tabCarga = DS.dataTable({ container: document.getElementById('carga'), caption: 'Carga de fichas por pessoa', columns: cols, rows: linhas, sortKey: 'total', sortDir: 'desc', paginate: false, compact: true });
    else tabCarga.update(linhas, true);
    DS.aplicaLarguras(document.getElementById('carga'));
  }

  /* -------------------------------------------------------------- Fila */
  const filaInfo = document.getElementById('fila-info');
  const filaAcoes = document.getElementById('fila-acoes');
  const tabFila = DS.dataTable({
    container: document.getElementById('fila'),
    caption: 'Fichas aguardando distribuição',
    rows: [],
    rowKey: (f) => f.id,
    rowLabel: (f) => f.numero,
    selectable: true,
    sortKey: 'prazo',
    highlight: (f) => destaque.indexOf(f.id) >= 0,
    onSelect(ids) { filaAcoes.hidden = !ids.length; document.getElementById('fila-sel').textContent = fmt.plural(ids.length, 'ficha selecionada', 'fichas selecionadas'); },
    emptyIcon: 'check-circle',
    emptyTitle: 'Fila vazia',
    emptyText: 'Todas as fichas novas já foram distribuídas.',
    columns: [
      { key: 'numero', label: 'Ficha', sort: true, render: (f) => h('a', { href: 'ficha.html?id=' + f.id, class: 'mono', text: f.numero }) },
      { key: 'prestador', label: 'Prestador', sort: (f) => E.nomePrestador(f.prestador), render: (f) => E.nomePrestador(f.prestador) },
      { key: 'sucursal', label: 'Sucursal', sort: true },
      { key: 'prioridade', label: 'Prioridade', sort: true, render: (f) => E.prioBadge(f.prioridade) },
      { key: 'prazo', label: 'Prazo', sort: (f) => E.relogio(f).dias, render: (f) => E.clock(f) }
    ]
  });
  function renderFila() {
    const lista = fichas().filter((f) => f.etapa === 'aguardando-distribuicao');
    tabFila.update(lista);
    filaInfo.textContent = fmt.plural(lista.length, 'ficha esperando', 'fichas esperando') + ' para ir à conferência.';
  }

  document.getElementById('distribuir').addEventListener('click', async () => {
    const ids = tabFila.selected();
    const d = await DS.dialog({
      titulo: 'Distribuir ' + fmt.plural(ids.length, 'ficha', 'fichas'),
      descricao: 'As fichas vão para "Em conferência" com a pessoa escolhida.',
      confirmar: 'Distribuir',
      montar(c) {
        const carga = (m) => abertas().filter((f) => f.responsavel === m).length;
        c.appendChild(DS.field({ id: 'dist-resp', label: 'Quem confere', tipo: 'select', required: true, opcoes: E.pessoasDa('Distribuição').map((p) => ({ value: p.matricula, label: p.nome + ' (' + fmt.plural(carga(p.matricula), 'ficha', 'fichas') + ')' })) }));
      },
      aoConfirmar(form) { return DS.validateForm(form) ? form.querySelector('#dist-resp').value : false; }
    });
    if (!d) return;
    ids.forEach((id) => E.mover(E.db.get('fichas', id), 'conferencia', d, 'Distribuída por ' + u.nome + '.'));
    destaque = ids;
    tabFila.clearSelection();
    renderTudo();
    DS.toast(fmt.plural(ids.length, 'ficha distribuída', 'fichas distribuídas') + ' para ' + E.nomePessoa(d) + '.');
  });

  /* ------------------------------------------------------- Troca de emissor */
  const selEmissor = document.getElementById('emissor-atual');
  const trocaAcoes = document.getElementById('troca-acoes');
  DS.selectOptions(selEmissor, E.pessoasDa('Emissão').map((p) => ({ value: p.matricula, label: p.nome })), 'Selecione o emissor atual');
  const tabTroca = DS.dataTable({
    container: document.getElementById('troca'),
    caption: 'Fichas em emissão do emissor escolhido',
    rows: [],
    rowKey: (f) => f.id,
    rowLabel: (f) => f.numero,
    selectable: true,
    sortKey: 'numero',
    onSelect(ids) { trocaAcoes.hidden = !ids.length; document.getElementById('troca-sel').textContent = fmt.plural(ids.length, 'ficha selecionada', 'fichas selecionadas'); },
    emptyIcon: 'users',
    emptyTitle: 'Escolha um emissor',
    emptyText: 'Aparecem aqui as fichas em emissão ou no comitê com essa pessoa.',
    columns: [
      { key: 'numero', label: 'Ficha', sort: true, render: (f) => h('a', { href: 'ficha.html?id=' + f.id, class: 'mono', text: f.numero }) },
      { key: 'prestador', label: 'Prestador', sort: (f) => E.nomePrestador(f.prestador), render: (f) => E.nomePrestador(f.prestador) },
      { key: 'etapa', label: 'Etapa', render: (f) => E.etapa(f.etapa).nome },
      { key: 'prazo', label: 'Prazo', render: (f) => E.clock(f) }
    ]
  });
  function renderTroca() {
    const m = selEmissor.value;
    tabTroca.update(m ? abertas().filter((f) => E.etapa(f.etapa).fase === 'emissao' && f.responsavel === m) : []);
  }
  selEmissor.addEventListener('change', () => { renderTroca(); DS.announce(tabTroca.rows().length + ' fichas com ' + (selEmissor.value ? E.nomePessoa(selEmissor.value) : 'ninguém') + '.'); });

  document.getElementById('trocar').addEventListener('click', async () => {
    const ids = tabTroca.selected();
    const d = await DS.dialog({
      titulo: 'Trocar o emissor de ' + fmt.plural(ids.length, 'ficha', 'fichas'),
      confirmar: 'Trocar emissor',
      montar(c) {
        c.appendChild(DS.field({ id: 'novo-emissor', label: 'Novo emissor', tipo: 'select', required: true, opcoes: E.pessoasDa('Emissão').filter((p) => p.matricula !== selEmissor.value).map((p) => ({ value: p.matricula, label: p.nome })) }));
        c.appendChild(DS.field({ id: 'troca-just', label: 'Justificativa', tipo: 'textarea', required: true, max: 300, rows: 3, dica: 'Fica no histórico de cada ficha.' }));
      },
      aoConfirmar(form) { return DS.validateForm(form) ? { m: form.querySelector('#novo-emissor').value, j: form.querySelector('#troca-just').value.trim() } : false; }
    });
    if (!d) return;
    ids.forEach((id) => {
      const f = E.db.get('fichas', id);
      f.historico = f.historico || [];
      f.historico.push({ quando: new Date().toISOString(), quem: u.nome, titulo: 'Emissor trocado: ' + E.nomePessoa(f.responsavel) + ' para ' + E.nomePessoa(d.m), nota: d.j });
      f.responsavel = d.m;
      f.emissor = d.m;
      const aberto = f.movimentos[f.movimentos.length - 1];
      if (aberto && !aberto.ate) aberto.quem = d.m;
    });
    E.db.save();
    tabTroca.clearSelection();
    renderTudo();
    DS.toast(fmt.plural(ids.length, 'ficha passou', 'fichas passaram') + ' para ' + E.nomePessoa(d.m) + '.');
    selEmissor.focus();
  });

  function renderTudo() { renderCarga(); renderFila(); renderTroca(); }
  renderTudo();
  DS.pronto('Distribuição');
})();
