/* Orla Placar: metas de economia por tipo de aditivo, trimestre e sucursal. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'metas' })) return;

  const cobertura = document.getElementById('cobertura');
  const rotuloQ = (r) => r.t + 'º tri/' + r.ano;
  const atual = DS.trimestre(DS.hoje());
  const trimestres = () => {
    const lista = [];
    for (let k = 6; k >= 1; k--) lista.push(P.trimestreAnterior(atual.t, atual.ano, k));
    let q = { t: atual.t, ano: atual.ano };
    lista.push(q);
    for (let i = 0; i < 2; i++) { q = q.t === 4 ? { t: 1, ano: q.ano + 1 } : { t: q.t + 1, ano: q.ano }; lista.push(q); }
    return lista;
  };
  const congelado = (t, ano) => P.db.all('congelamentos').some((c) => c.t === t && c.ano === ano);

  function pintaCobertura() {
    const q = P.temporada();
    const metas = P.db.all('metas').filter((m) => m.t === q.t && m.ano === q.ano);
    const faltam = [];
    P.TIPOS.forEach((tipo) => R.sucursais.forEach((s) => {
      if (!metas.some((m) => m.tipo === tipo && m.sucursal === s.sigla)) faltam.push({ tipo, sucursal: s.sigla });
    }));
    const total = metas.reduce((s, m) => s + m.valor, 0);
    const real = P.realizado(q);
    DS.fill(cobertura, 
      h('ul', { class: 'kpis' },
        h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('target'), 'Meta do ' + q.t + 'º trimestre'), h('span', { class: 'kpi__value', text: fmt.money(total) }), h('span', { class: 'kpi__foot', text: fmt.plural(metas.length, 'meta cadastrada', 'metas cadastradas') + ' de 32 possíveis' })),
        h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('trophy'), 'Realizado até agora'), h('span', { class: 'kpi__value', text: fmt.money(real) }), h('span', { class: 'kpi__foot', text: total ? fmt.pct(real / total) + ' da meta' : 'Sem meta para comparar' })),
        h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon('snowflake'), 'Relatório'), h('span', { class: 'kpi__value', text: congelado(q.t, q.ano) ? 'Congelado' : 'Aberto' }), h('span', { class: 'kpi__foot', text: congelado(q.t, q.ano) ? 'Já existe uma versão congelada.' : 'Ainda pode ser congelado em Relatórios.' }))),
      faltam.length ? h('div', { class: 'alert alert--warning' }, icon('alert'),
        h('div', { class: 'alert__body' },
          h('p', { class: 'alert__title', text: 'Faltam ' + fmt.plural(faltam.length, 'meta', 'metas') + ' no ' + DS.rotuloTrimestre(q.t, q.ano) + '.' }),
          h('p', { text: 'Sem meta, a sucursal não aparece no pódio. Dá para copiar as do trimestre anterior com um reajuste e depois ajustar uma a uma.' }),
          h('p', null, h('button', { type: 'button', class: 'btn btn--sm', onClick: () => copiar(faltam, q) }, icon('copy'), 'Copiar do trimestre anterior')))) : null);
  }

  async function copiar(faltam, q) {
    const ant = P.trimestreAnterior(q.t, q.ano);
    const valor = await DS.dialog({
      titulo: 'Copiar metas do ' + DS.rotuloTrimestre(ant.t, ant.ano),
      descricao: 'Vamos criar as ' + faltam.length + ' metas que faltam usando os valores do trimestre anterior. Onde não houver valor anterior, usamos R$ 15.000,00.',
      confirmar: 'Criar metas',
      montar(c) { c.appendChild(DS.field({ id: 'reajuste', label: 'Reajuste sobre o trimestre anterior', tipo: 'decimal', valor: 5, sufixo: '%', required: true, rules: 'percent', dica: 'Use 0 para copiar os valores iguais.' })); },
      aoConfirmar(f) { return DS.validateForm(f) ? DS.parseMoney(f.querySelector('#reajuste').value) : false; }
    });
    if (valor === null || valor === false) return;
    faltam.forEach((x) => {
      const antiga = P.db.all('metas').find((m) => m.tipo === x.tipo && m.sucursal === x.sucursal && m.t === ant.t && m.ano === ant.ano);
      const base = antiga ? antiga.valor : 15000;
      P.db.insert('metas', { tipo: x.tipo, sucursal: x.sucursal, t: q.t, ano: q.ano, valor: Math.round(base * (1 + valor / 100) / 100) * 100, criadoPor: DS.usuario().nome });
    });
    crud.atualizar();
    pintaCobertura();
    DS.toast(faltam.length + ' metas criadas para o ' + DS.rotuloTrimestre(q.t, q.ano) + '.');
  }

  const opcoesTri = () => trimestres().map((q) => ({ value: q.t + '/' + q.ano, label: q.t + 'º trimestre de ' + q.ano }));
  const q0 = P.temporada();

  const crud = DS.crud({
    container: document.getElementById('lista'),
    db: P.db,
    colecao: 'metas',
    singular: 'meta',
    plural: 'metas',
    feminino: true,
    novo: 'Cadastrar meta',
    arquivo: 'metas.csv',
    rotulo: (r) => r.tipo + ' · ' + r.sucursal + ' · ' + rotuloQ(r),
    busca: ['tipo', 'sucursal'],
    filtros: [
      { key: 'tri', label: 'Trimestre', opcoes: opcoesTri, valor: (r) => r.t + '/' + r.ano, inicial: q0.t + '/' + q0.ano, todos: 'Todos os trimestres' },
      { key: 'tipo', label: 'Tipo', opcoes: P.TIPOS, todos: 'Todos os tipos' },
      { key: 'sucursal', label: 'Sucursal', opcoes: R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), todos: 'Todas as sucursais' }
    ],
    campos: [
      { key: 'tipo', label: 'Tipo de aditivo', tipo: 'select', opcoes: P.TIPOS, required: true, span: 6 },
      { key: 'sucursal', label: 'Sucursal', tipo: 'select', opcoes: R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), required: true, span: 6 },
      { key: 't', label: 'Trimestre', tipo: 'select', opcoes: [1, 2, 3, 4].map((t) => ({ value: String(t), label: t + 'º trimestre' })), required: true, span: 4, padrao: () => String(P.temporada().t) },
      { key: 'ano', label: 'Ano', tipo: 'number', required: true, span: 3, min: 2015, maxValor: 2040, rules: 'ano', padrao: () => P.temporada().ano },
      { key: 'valor', label: 'Meta de economia', tipo: 'money', required: true, span: 5, dica: 'Valor em reais para o trimestre.' }
    ],
    colunas: [
      { key: 'tipo', label: 'Tipo de aditivo', sort: true },
      { key: 'tri', label: 'Trimestre', sort: (r) => r.ano * 10 + r.t, render: rotuloQ, csv: rotuloQ },
      { key: 'sucursal', label: 'Sucursal', sort: true, render: (r) => R.sucursalNome(r.sucursal), csv: (r) => R.sucursalNome(r.sucursal) },
      { key: 'valor', label: 'Meta', num: true, sort: true, render: (r) => fmt.money(r.valor), csv: (r) => fmt.decimal(r.valor) },
      { key: 'real', label: 'Realizado', num: true, sort: (r) => P.realizado(r), render: (r) => fmt.money(P.realizado(r)), csv: (r) => fmt.decimal(P.realizado(r)) },
      { key: 'ating', label: 'Atingimento', sort: (r) => P.realizado(r) / r.valor, render: (r) => h('span', null, fmt.pct(P.realizado(r) / r.valor), DS.meter({ valor: P.realizado(r), max: r.valor })), csv: (r) => fmt.pct(P.realizado(r) / r.valor) }
    ],
    sortKey: 'tipo',
    antesSalvar: (d) => Object.assign(d, { t: Number(d.t), ano: Number(d.ano) }),
    unicos: [{ keys: ['tipo', 'sucursal', 't', 'ano'], msg: 'Já existe meta para esse tipo, sucursal e trimestre. Edite a que já existe.' }],
    validar(d, addErro, registro) {
      if (congelado(Number(d.t), Number(d.ano)) && (!registro || registro.valor !== d.valor)) {
        addErro('valor', 'O relatório desse trimestre já foi congelado. A meta pode mudar, mas a versão congelada não muda junto. Para seguir, descongele o relatório em Relatórios.');
      }
    },
    podeExcluir: (r) => (congelado(r.t, r.ano) ? 'O relatório do ' + DS.rotuloTrimestre(r.t, r.ano) + ' foi congelado com essa meta. Para excluir, descongele o relatório primeiro.' : null),
    aoMudar: pintaCobertura
  });

  pintaCobertura();
  document.addEventListener('temporada', pintaCobertura);
  DS.pronto('Metas');
})();
