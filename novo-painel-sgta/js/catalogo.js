/* Orla Mesa: catálogo de pacotes e tabelas de apoio, um esquema por tabela. */
(function () {
  'use strict';

  const M = window.MESA;
  const { h } = DS;
  const R = window.REDE;
  if (!M.shell({ ativo: 'catalogo' })) return;

  const prestadores = () => R.prestadores.map((p) => ({ value: p.codigo, label: p.nome + ' (' + p.codigo + ')' }));
  const ppsOpcoes = () => M.db.all('pps').map((p) => ({ value: p.codigo, label: p.codigo + ' · ' + p.nome }));
  const macros = () => M.TIPOS.reduce((a, t) => a.concat(M.MACROS[t].map((m) => ({ value: m, label: t + ' · ' + m }))), []);
  const tipoDoMacro = (m) => M.TIPOS.find((t) => M.MACROS[t].indexOf(m) >= 0);

  const ESQUEMAS = {
    pps: {
      titulo: 'Pacotes (PPs)',
      texto: 'Cada pacote pertence a um macrogrupo e a um grupo. É o código que aparece na mesa e nas autorizações.',
      singular: 'pacote', plural: 'pacotes', novo: 'Cadastrar pacote',
      rotulo: (r) => r.nome,
      busca: ['nome', 'codigo', 'grupo'],
      filtros: [{ key: 'tipo', label: 'Tipo', opcoes: M.TIPOS, todos: 'Todos os tipos' }],
      campos: [
        { key: 'codigo', label: 'Código do pacote', required: true, max: 8, mask: 'digits', inputmode: 'numeric', rules: 'pp', span: 4, dica: '8 números.' },
        { key: 'macro', label: 'Macrogrupo', tipo: 'select', opcoes: macros, required: true, span: 8 },
        { key: 'grupo', label: 'Grupo', required: true, max: 80, span: 6, dica: 'Ex.: Artrodese com UTI.' },
        { key: 'nome', label: 'Nome do pacote', required: true, max: 100, span: 6 },
        { key: 'ano', label: 'Ano de criação do modelo', tipo: 'number', required: true, min: 2015, maxValor: 2040, rules: 'ano', span: 4 }
      ],
      colunas: [
        { key: 'codigo', label: 'Código', sort: true, render: (r) => h('span', { class: 'mono', text: r.codigo }) },
        { key: 'nome', label: 'Pacote', sort: true },
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'macro', label: 'Macrogrupo', sort: true },
        { key: 'ano', label: 'Modelo', num: true, sort: true }
      ],
      antesSalvar: (d) => Object.assign(d, { tipo: tipoDoMacro(d.macro) }),
      unicos: [{ keys: ['codigo'], msg: 'Já existe um pacote com esse código.' }],
      podeExcluir: (r) => {
        const n = M.db.all('negociacoes').filter((x) => x.pp === r.codigo).length;
        return n ? 'O pacote está em ' + n + ' negociações da mesa.' : null;
      }
    },
    dePara: {
      titulo: 'De-para de grupos e PPA',
      texto: 'Indica a qual grupo hospitalar cada prestador pertence e se ele tem acordo de pacotes em grupo (PPA).',
      singular: 'vínculo', plural: 'vínculos', novo: 'Cadastrar vínculo',
      rotulo: (r) => M.nomePrestador(r.prestador),
      busca: ['grupo', 'prestador'],
      filtros: [{ key: 'ppa', label: 'PPA', opcoes: ['Sim', 'Não'], todos: 'Com e sem PPA' }],
      campos: [
        { key: 'prestador', label: 'Prestador', tipo: 'select', opcoes: prestadores, required: true, span: 12 },
        { key: 'grupo', label: 'Grupo hospitalar', required: true, max: 60, span: 6 },
        { key: 'ppa', label: 'Tem PPA?', tipo: 'radio', opcoes: ['Sim', 'Não'], required: true, span: 6 }
      ],
      colunas: [
        { key: 'prestador', label: 'Prestador', sort: (r) => M.nomePrestador(r.prestador), render: (r) => h('span', null, M.nomePrestador(r.prestador), h('span', { class: 'cell-sub', text: 'Código ' + r.prestador })), csv: (r) => M.nomePrestador(r.prestador) },
        { key: 'grupo', label: 'Grupo hospitalar', sort: true },
        { key: 'ppa', label: 'PPA', sort: true, render: (r) => DS.badge(r.ppa, r.ppa === 'Sim' ? 'signal' : '', true) }
      ],
      unicos: [{ keys: ['prestador'], msg: 'Esse prestador já tem um vínculo. Edite o existente.' }],
      aoMudar() {
        // O PPA do de-para vale para as negociações do prestador.
        M.db.all('dePara').forEach((v) => M.db.all('negociacoes').forEach((n) => { if (n.prestador === v.prestador) n.ppa = v.ppa === 'Sim'; }));
        M.db.save();
      }
    },
    colunaBuco: {
      titulo: 'Apoio coluna e buco',
      texto: 'Ponderação de cada pacote de coluna e buco-maxilo no cálculo do valor de referência.',
      singular: 'ponderação', plural: 'ponderações', novo: 'Cadastrar ponderação', feminino: true,
      rotulo: (r) => 'PP ' + r.pp,
      busca: ['pp', 'macro'],
      filtros: [{ key: 'tipo', label: 'Tipo', opcoes: ['Coluna', 'Buco-maxilo'], todos: 'Coluna e buco' }],
      campos: [
        { key: 'pp', label: 'Pacote', tipo: 'select', opcoes: () => M.db.all('pps').filter((p) => p.tipo === 'Coluna' || p.tipo === 'Buco-maxilo').map((p) => ({ value: p.codigo, label: p.codigo + ' · ' + p.nome })), required: true, span: 12 },
        { key: 'ponderacao', label: 'Ponderação', tipo: 'decimal', required: true, rules: 'percent', sufixo: '%', span: 6 },
        { key: 'valor', label: 'Valor fixo', tipo: 'money', opcional: true, span: 6, dica: 'Use só quando o pacote tiver preço fechado.' }
      ],
      colunas: [
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'macro', label: 'Macrogrupo', sort: true },
        { key: 'pp', label: 'Pacote', sort: true, render: (r) => h('span', { class: 'mono', text: r.pp }) },
        { key: 'ponderacao', label: 'Ponderação', num: true, sort: true, render: (r) => DS.fmt.decimal(r.ponderacao) + '%' },
        { key: 'valor', label: 'Valor fixo', num: true, sort: true, render: (r) => (r.valor ? DS.fmt.money(r.valor) : '—') }
      ],
      antesSalvar: (d) => { const p = M.db.all('pps').find((x) => x.codigo === d.pp); return Object.assign(d, { tipo: p.tipo, macro: p.macro }); },
      unicos: [{ keys: ['pp'], msg: 'Esse pacote já tem ponderação.' }]
    },
    naoListados: {
      titulo: 'Não listados',
      texto: 'Pacotes negociados fora da lista de referência, com a data em que migraram para a tabela padrão.',
      singular: 'item não listado', plural: 'itens não listados', novo: 'Cadastrar item',
      rotulo: (r) => r.ppNome,
      busca: ['ppNome', 'ppCodigo', 'prestador'],
      filtros: [{ key: 'migracao', label: 'Migração', opcoes: ['Sim', 'Não'], todos: 'Migrados e não migrados' }, { key: 'sucursal', label: 'Sucursal', opcoes: R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })), todos: 'Todas as sucursais' }],
      campos: [
        { key: 'prestador', label: 'Prestador', tipo: 'select', opcoes: prestadores, required: true, span: 12 },
        { key: 'ppCodigo', label: 'Pacote', tipo: 'select', opcoes: ppsOpcoes, required: true, span: 12 },
        { key: 'migracao', label: 'Já migrou para a tabela padrão?', tipo: 'radio', opcoes: ['Sim', 'Não'], required: true, padrao: 'Não', span: 6 },
        { key: 'dataMigracao', label: 'Data da migração', tipo: 'date', opcional: true, span: 6 }
      ],
      colunas: [
        { key: 'sucursal', label: 'Sucursal', sort: true },
        { key: 'prestador', label: 'Prestador', sort: (r) => M.nomePrestador(r.prestador), render: (r) => M.nomePrestador(r.prestador), csv: (r) => M.nomePrestador(r.prestador) },
        { key: 'ppNome', label: 'Pacote', sort: true, render: (r) => h('span', null, r.ppNome, h('span', { class: 'cell-sub mono', text: r.ppCodigo })) },
        { key: 'tipo', label: 'Tipo', sort: true },
        { key: 'migracao', label: 'Migração', sort: (r) => r.dataMigracao || '', render: (r) => (r.migracao === 'Sim' ? DS.badge('Migrado em ' + DS.fmt.date(r.dataMigracao), 'success') : DS.badge('Não migrado', 'warning')), csv: (r) => (r.migracao === 'Sim' ? DS.fmt.date(r.dataMigracao) : 'Não') }
      ],
      validar: (d, add) => {
        if (d.migracao === 'Sim' && !d.dataMigracao) add('dataMigracao', 'Informe quando o item migrou.');
        if (d.dataMigracao && d.dataMigracao > DS.hoje()) add('dataMigracao', 'A migração não pode estar no futuro.');
      },
      antesSalvar: (d) => {
        const pp = M.db.all('pps').find((x) => x.codigo === d.ppCodigo);
        return Object.assign(d, { sucursal: R.prestador(d.prestador).sucursal, ppNome: pp.nome, tipo: pp.tipo, dataMigracao: d.migracao === 'Sim' ? d.dataMigracao : '' });
      },
      unicos: [{ keys: ['prestador', 'ppCodigo'], msg: 'Esse pacote já está cadastrado como não listado para o prestador.' }]
    }
  };

  const chave = ESQUEMAS[DS.param('tabela')] ? DS.param('tabela') : 'pps';
  const esq = ESQUEMAS[chave];
  DS.fill(document.getElementById('catalogo-nav'), h('ul', null, Object.keys(ESQUEMAS).map((k) => h('li', null, h('a', { href: 'catalogo.html?tabela=' + k, 'aria-current': k === chave ? 'page' : null, text: ESQUEMAS[k].titulo })))));
  document.getElementById('pagina-titulo').textContent = esq.titulo;
  document.getElementById('pagina-texto').textContent = esq.texto;
  DS.crud(Object.assign({ container: document.getElementById('lista'), db: M.db, colecao: chave, arquivo: chave + '.csv' }, esq));
  DS.pronto(esq.titulo);
})();
