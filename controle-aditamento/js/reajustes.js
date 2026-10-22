/* Orla Placar: manutenção do mês de reajuste dos prestadores. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'reajustes', semTemporada: true })) return;

  const form = document.getElementById('filtros');
  const memo = DS.lembrarFiltros(form, 'reajustes');
  const info = document.getElementById('resultado-info');
  const lote = document.getElementById('lote');
  const loteInfo = document.getElementById('lote-info');
  const mesAtual = DS.hoje().slice(0, 7);
  let destaque = null;

  DS.selectOptions(form.sucursal, R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), 'Todas as sucursais');
  DS.selectOptions(form.uf, Array.from(new Set(R.prestadores.map((p) => p.uf))).sort(), 'Todas as UFs');
  DS.selectOptions(form.indice, ['IPCA', 'IGP-M', 'Livre negociação'], 'Todos os índices');
  memo.restore();

  const mesesAte = (ym) => {
    const [a, m] = ym.split('-').map(Number);
    const [ah, mh] = mesAtual.split('-').map(Number);
    return (a - ah) * 12 + (m - mh);
  };
  function quando(ym) {
    const n = mesesAte(ym);
    if (n < 0) return DS.badge('Atrasado', 'danger');
    if (n === 0) return DS.badge('Neste mês', 'warning');
    if (n <= 2) return DS.badge('Em ' + n + (n === 1 ? ' mês' : ' meses'), 'info');
    return null;
  }

  const colunas = [
    { key: 'nome', label: 'Prestador', sort: (r) => R.prestador(r.codigo).nome, render: (r) => h('span', null, R.prestador(r.codigo).nome, h('span', { class: 'cell-sub', text: 'Código ' + r.codigo })), csv: (r) => R.prestador(r.codigo).nome },
    { key: 'cidade', label: 'Cidade', sort: (r) => R.prestador(r.codigo).cidade, render: (r) => R.prestador(r.codigo).cidade + ' / ' + R.prestador(r.codigo).uf, csv: (r) => R.prestador(r.codigo).cidade + '/' + R.prestador(r.codigo).uf },
    { key: 'sucursal', label: 'Sucursal', sort: (r) => R.prestador(r.codigo).sucursal, render: (r) => R.prestador(r.codigo).sucursal, csv: (r) => R.sucursalNome(R.prestador(r.codigo).sucursal) },
    { key: 'indice', label: 'Índice', sort: true },
    { key: 'ultimo', label: 'Último reajuste', sort: true, render: (r) => h('span', null, fmt.competencia(r.ultimo), h('span', { class: 'cell-sub', text: fmt.decimal(r.percentual) + '%' })), csv: (r) => fmt.competencia(r.ultimo) + ' (' + fmt.decimal(r.percentual) + '%)' },
    { key: 'proximo', label: 'Próximo reajuste', sort: true, render: (r) => h('span', { class: 'cluster nowrap' }, fmt.competencia(r.proximo), quando(r.proximo)), csv: (r) => fmt.competencia(r.proximo) },
    { key: '_acao', label: 'Ações', srOnly: true, class: 'col-actions', render: (r) => h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--sm', 'aria-label': 'Alterar reajuste de ' + R.prestador(r.codigo).nome, onClick: () => alterar([r.id]) }, icon('edit')) }
  ];

  const tabela = DS.dataTable({
    container: document.getElementById('resultado'),
    caption: 'Datas de reajuste dos prestadores',
    columns: colunas,
    rows: [],
    rowKey: (r) => r.id,
    rowLabel: (r) => R.prestador(r.codigo).nome,
    selectable: true,
    sortKey: 'proximo',
    highlight: (r) => destaque && destaque.indexOf(r.id) >= 0,
    onSelect(ids) {
      lote.hidden = !ids.length;
      loteInfo.textContent = fmt.plural(ids.length, 'prestador selecionado', 'prestadores selecionados');
    },
    emptyTitle: 'Nenhum prestador com esses filtros'
  });

  function filtrar() {
    const f = memo.read();
    const termo = DS.normaliza(f.busca);
    return P.db.all('reajustes').filter((r) => {
      const p = R.prestador(r.codigo);
      if (termo && DS.normaliza(p.nome + ' ' + p.codigo + ' ' + p.cidade).indexOf(termo) < 0) return false;
      if (f.sucursal && p.sucursal !== f.sucursal) return false;
      if (f.uf && p.uf !== f.uf) return false;
      if (f.indice && r.indice !== f.indice) return false;
      if (f.de && r.proximo < f.de) return false;
      if (f.ate && r.proximo > f.ate) return false;
      return true;
    });
  }

  function atualizar(anunciar) {
    const linhas = filtrar();
    tabela.update(linhas, !!destaque);
    const proximos = linhas.filter((r) => mesesAte(r.proximo) >= 0 && mesesAte(r.proximo) <= 2).length;
    info.textContent = fmt.plural(linhas.length, 'prestador', 'prestadores') + '. ' + fmt.plural(proximos, 'reajuste', 'reajustes') + ' nos próximos 3 meses.';
    if (anunciar) DS.announce(info.textContent);
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (form.de.value && form.ate.value && form.ate.value < form.de.value) {
      DS.validateForm(form, { extra: (add) => add(form.ate, 'O fim do período precisa ser depois do início.') });
      return;
    }
    DS.clearErrors(form);
    memo.save();
    atualizar(true);
  });
  document.getElementById('limpar').addEventListener('click', () => { form.reset(); memo.clear(); DS.clearErrors(form); atualizar(true); form.busca.focus(); });

  async function alterar(ids) {
    const registros = ids.map((id) => P.db.get('reajustes', id));
    const um = registros.length === 1 ? registros[0] : null;
    const dados = await DS.dialog({
      titulo: um ? 'Alterar reajuste de ' + R.prestador(um.codigo).nome : 'Alterar reajuste de ' + registros.length + ' prestadores',
      descricao: 'O mês informado vira a próxima data de reajuste e entra nos relatórios.',
      confirmar: 'Salvar',
      montar(c) {
        c.appendChild(h('div', { class: 'form-grid' },
          DS.field({ id: 'r-mes', label: 'Próximo reajuste', tipo: 'month', required: true, span: 6, valor: um ? um.proximo : '', min: mesAtual, placeholder: 'AAAA-MM', dica: 'Mês e ano. Não pode ser antes de ' + fmt.competencia(mesAtual) + '.' }),
          DS.field({ id: 'r-indice', label: 'Índice', tipo: 'select', span: 6, opcoes: ['IPCA', 'IGP-M', 'Livre negociação'], valor: um ? um.indice : '', vazio: um ? 'Selecione' : 'Manter o atual de cada um' })));
      },
      aoConfirmar(f) {
        const mes = f.querySelector('#r-mes');
        const ok = DS.validateForm(f, { extra: (add) => { if (mes.value && mes.value < mesAtual) add(mes, 'Escolha este mês ou um mês futuro.'); } });
        if (!ok) return false;
        return { proximo: mes.value, indice: f.querySelector('#r-indice').value };
      }
    });
    if (!dados) return;
    registros.forEach((r) => P.db.update('reajustes', r.id, { proximo: dados.proximo, indice: dados.indice || r.indice }));
    destaque = ids;
    tabela.clearSelection();
    atualizar();
    DS.toast(um ? 'Reajuste de ' + R.prestador(um.codigo).nome + ' marcado para ' + fmt.competencia(dados.proximo) + '.' : registros.length + ' prestadores com reajuste em ' + fmt.competencia(dados.proximo) + '.');
  }

  document.getElementById('alterar-lote').addEventListener('click', () => alterar(tabela.selected()));
  document.getElementById('limpar-selecao').addEventListener('click', () => { tabela.clearSelection(); DS.announce('Seleção limpa.'); });

  document.getElementById('rel-interno').addEventListener('click', () => {
    DS.downloadCsv('reajustes-interno.csv', colunas.filter((c) => c.key !== '_acao'), tabela.rows());
  });
  document.getElementById('rel-ans').addEventListener('click', () => {
    const cols = [
      { label: 'CNPJ', csv: (r) => R.prestador(r.codigo).cnpj },
      { label: 'Razão social', csv: (r) => R.prestador(r.codigo).nome },
      { label: 'UF', csv: (r) => R.prestador(r.codigo).uf },
      { label: 'Mês do reajuste', csv: (r) => r.proximo.split('-').reverse().join('/') },
      { label: 'Índice', csv: (r) => r.indice },
      { label: 'Último percentual', csv: (r) => fmt.decimal(r.percentual) }
    ];
    DS.downloadCsv('reajustes-agencia-reguladora.csv', cols, tabela.rows());
  });

  atualizar();
  DS.pronto('Reajustes');
})();
