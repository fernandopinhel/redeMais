/* Orla Mesa: alçadas de aprovação por pacote, cluster e qualidade. */
(function () {
  'use strict';

  const M = window.MESA;
  const { fmt } = DS;
  const R = window.REDE;
  if (!M.shell({ ativo: 'alcadas' })) return;

  const macros = () => M.TIPOS.reduce((a, t) => a.concat(M.MACROS[t].map((m) => ({ value: m, label: t + ' · ' + m }))), []);

  DS.crud({
    container: document.getElementById('lista'),
    db: M.db,
    colecao: 'alcadas',
    singular: 'alçada', plural: 'alçadas', novo: 'Cadastrar alçada', feminino: true,
    arquivo: 'alcadas.csv',
    rotulo: (r) => r.macro + ' · ' + r.cluster + ' · ' + r.qualidade,
    busca: ['macro', 'tipo', 'cluster'],
    filtros: [
      { key: 'tipo', label: 'Tipo', opcoes: M.TIPOS, todos: 'Todos os tipos' },
      { key: 'cluster', label: 'Cluster', opcoes: R.clusters, todos: 'Todos os clusters' },
      { key: 'qualidade', label: 'Qualidade', opcoes: ['1 e 2', '3 e 4'], todos: 'Todas as qualidades' }
    ],
    campos: [
      { key: 'macro', label: 'Procedimento (macrogrupo)', tipo: 'select', opcoes: macros, required: true, span: 6 },
      { key: 'cluster', label: 'Cluster', tipo: 'select', opcoes: R.clusters, required: true, span: 6 },
      { key: 'rede', label: 'Rede', tipo: 'select', opcoes: ['Rede Prima', 'Rede Essencial'], required: true, span: 6, padrao: 'Rede Prima' },
      { key: 'qualidade', label: 'Qualidade', tipo: 'radio', opcoes: ['1 e 2', '3 e 4'], required: true, span: 6 },
      { key: 'sucursal', label: 'Alçada da sucursal', tipo: 'money', required: true, span: 6, dica: 'Até esse valor, a sucursal aprova sozinha.' },
      { key: 'matriz', label: 'Alçada da matriz', tipo: 'money', required: true, span: 6, dica: 'Acima dele, a diretoria precisa aprovar.' }
    ],
    colunas: [
      { key: 'tipo', label: 'Tipo', sort: true },
      { key: 'macro', label: 'Procedimento', sort: true },
      { key: 'cluster', label: 'Cluster', sort: true },
      { key: 'qualidade', label: 'Qualidade', sort: true },
      { key: 'sucursal', label: 'Alçada sucursal', num: true, sort: true, render: (r) => fmt.money(r.sucursal), csv: (r) => fmt.decimal(r.sucursal) },
      { key: 'matriz', label: 'Alçada matriz', num: true, sort: true, render: (r) => fmt.money(r.matriz), csv: (r) => fmt.decimal(r.matriz) }
    ],
    antesSalvar: (d) => Object.assign(d, { tipo: M.TIPOS.find((t) => M.MACROS[t].indexOf(d.macro) >= 0) }),
    unicos: [{ keys: ['macro', 'cluster', 'rede', 'qualidade'], msg: 'Já existe alçada para esse procedimento, cluster, rede e qualidade.' }],
    validar: (d, add) => { if (d.sucursal && d.matriz && d.matriz < d.sucursal) add('matriz', 'A alçada da matriz precisa ser igual ou maior que a da sucursal.'); },
    podeExcluir: (r) => {
      const usos = M.db.all('negociacoes').filter((n) => { const a = M.alcadaDe(n); return a && a.id === r.id; }).length;
      return usos ? 'Essa alçada é a referência de ' + usos + ' negociações na mesa. Ajuste os valores em vez de excluir.' : null;
    }
  });
  DS.pronto('Alçadas');
})();
