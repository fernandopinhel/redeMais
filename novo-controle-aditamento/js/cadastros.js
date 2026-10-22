/* Orla Esteira: cadastros de apoio (um esquema por cadastro, mesma tela). */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon } = DS;
  if (!E.shell({ ativo: 'cadastros' })) return;

  const vigente = (r) => !r.fim || r.fim >= DS.hoje();
  const ESQUEMAS = {
    tiposAditivo: {
      titulo: 'Tipos de aditivo',
      texto: 'Os tipos vigentes aparecem na criação de fichas. Para tirar um tipo de uso, informe o fim da vigência.',
      singular: 'tipo de aditivo', plural: 'tipos de aditivo', novo: 'Cadastrar tipo',
      rotulo: (r) => r.descricao,
      busca: ['descricao'],
      filtros: [{ key: 'vig', label: 'Vigência', opcoes: ['Vigentes', 'Encerrados'], valor: (r) => (vigente(r) ? 'Vigentes' : 'Encerrados'), todos: 'Todas as vigências' }, { key: 'grupo', label: 'Grupo', opcoes: () => E.db.all('grupos').map((g) => g.nome), todos: 'Todos os grupos' }],
      campos: [
        { key: 'descricao', label: 'Descrição', required: true, max: 80, span: 8 },
        { key: 'grupo', label: 'Grupo', tipo: 'select', opcoes: () => E.db.all('grupos').map((g) => ({ value: g.nome, label: g.nome + ' · ' + g.descricao })), required: true, span: 4 },
        { key: 'rede', label: 'Rede', tipo: 'radio', opcoes: ['Rede Prima', 'Rede Essencial'], required: true, span: 12 },
        { key: 'inicio', label: 'Início da vigência', tipo: 'date', required: true, span: 6 },
        { key: 'fim', label: 'Fim da vigência', tipo: 'date', opcional: true, span: 6 }
      ],
      colunas: [
        { key: 'descricao', label: 'Descrição', sort: true },
        { key: 'grupo', label: 'Grupo', sort: true },
        { key: 'rede', label: 'Rede', sort: true },
        { key: 'inicio', label: 'Vigência', sort: true, render: (r) => DS.fmt.date(r.inicio) + (r.fim ? ' a ' + DS.fmt.date(r.fim) : ' em diante'), csv: (r) => DS.fmt.date(r.inicio) + ' a ' + (DS.fmt.date(r.fim) || '') },
        { key: 'situacao', label: 'Situação', sort: (r) => vigente(r), render: (r) => DS.badge(vigente(r) ? 'Vigente' : 'Encerrado', vigente(r) ? 'success' : ''), csv: (r) => (vigente(r) ? 'Vigente' : 'Encerrado') }
      ],
      unicos: [{ keys: ['descricao'], msg: 'Já existe um tipo de aditivo com essa descrição.' }],
      validar: (d, add) => { if (d.fim && d.inicio && d.fim < d.inicio) add('fim', 'O fim da vigência precisa ser depois do início.'); },
      podeExcluir: (r) => {
        const usos = E.db.all('fichas').filter((f) => f.aditivos.some((a) => a.tipo === r.descricao)).length;
        return usos ? 'Esse tipo aparece em ' + usos + ' fichas. Para tirar de uso, informe o fim da vigência.' : null;
      }
    },
    grupos: {
      titulo: 'Grupos de tipo de aditivo',
      texto: 'O grupo diz se o aditivo precisa passar pelo comitê executivo.',
      singular: 'grupo', plural: 'grupos', novo: 'Cadastrar grupo',
      rotulo: (r) => 'Grupo ' + r.nome,
      busca: ['nome', 'descricao'],
      campos: [
        { key: 'nome', label: 'Nome', required: true, max: 10, span: 4, mask: 'upper', dica: 'Use algarismos romanos, como IV.' },
        { key: 'descricao', label: 'Descrição', required: true, max: 80, span: 8 },
        { key: 'exigeComite', label: 'Passa pelo comitê executivo?', tipo: 'radio', opcoes: ['Sim', 'Não'], required: true }
      ],
      colunas: [{ key: 'nome', label: 'Grupo', sort: true }, { key: 'descricao', label: 'Descrição', sort: true }, { key: 'exigeComite', label: 'Comitê', sort: true }],
      unicos: [{ keys: ['nome'], msg: 'Já existe um grupo com esse nome.' }],
      podeExcluir: (r) => {
        const n = E.db.all('tiposAditivo').filter((t) => t.grupo === r.nome).length;
        return n ? 'Há ' + n + ' tipos de aditivo nesse grupo. Mude o grupo deles antes de excluir.' : null;
      }
    },
    equipes: {
      titulo: 'Equipes',
      texto: 'Cada etapa da esteira pertence a uma equipe. A caixa de e-mail recebe os avisos de prazo.',
      singular: 'equipe', plural: 'equipes', novo: 'Cadastrar equipe', feminino: true,
      rotulo: (r) => r.nome,
      busca: ['nome', 'lider'],
      campos: [
        { key: 'nome', label: 'Nome da equipe', required: true, max: 60, span: 6 },
        { key: 'lider', label: 'Liderança', required: true, max: 80, span: 6 },
        { key: 'email', label: 'E-mail da equipe', tipo: 'email', rules: 'email', required: true, max: 120 }
      ],
      colunas: [{ key: 'nome', label: 'Equipe', sort: true }, { key: 'lider', label: 'Liderança', sort: true }, { key: 'email', label: 'E-mail', sort: true }],
      unicos: [{ keys: ['nome'], msg: 'Já existe uma equipe com esse nome.' }],
      podeExcluir: (r) => (E.ETAPAS.some((e) => e.equipe === r.nome) ? 'A equipe ' + r.nome + ' cuida de etapas da esteira e não pode ser excluída.' : null)
    },
    grandesGrupos: {
      titulo: 'Grandes grupos',
      texto: 'Classificação dos prestadores usada nos relatórios gerenciais.',
      singular: 'grande grupo', plural: 'grandes grupos', novo: 'Cadastrar grande grupo',
      rotulo: (r) => r.nome,
      busca: ['nome', 'descricao'],
      campos: [{ key: 'nome', label: 'Nome', required: true, max: 60, span: 6 }, { key: 'descricao', label: 'Descrição', required: true, max: 120, span: 6 }],
      colunas: [{ key: 'nome', label: 'Grande grupo', sort: true }, { key: 'descricao', label: 'Descrição', sort: true }],
      unicos: [{ keys: ['nome'], msg: 'Já existe um grande grupo com esse nome.' }]
    },
    procedimentos: {
      titulo: 'Procedimentos',
      texto: 'Procedimentos que podem entrar nos aditivos, com o código da tabela da operadora.',
      singular: 'procedimento', plural: 'procedimentos', novo: 'Cadastrar procedimento',
      rotulo: (r) => r.nome,
      busca: ['nome', 'codigo'],
      filtros: [{ key: 'ativo', label: 'Situação', opcoes: ['Ativo', 'Inativo'], todos: 'Todas as situações' }, { key: 'tipo', label: 'Tipo', opcoes: E.TIPOS_ADITIVO, todos: 'Todos os tipos' }],
      campos: [
        { key: 'codigo', label: 'Código', required: true, max: 8, span: 4, mask: 'digits', inputmode: 'numeric', rules: 'pp', dica: '8 números.' },
        { key: 'nome', label: 'Nome', required: true, max: 100, span: 8 },
        { key: 'tipo', label: 'Tipo de aditivo', tipo: 'select', opcoes: E.TIPOS_ADITIVO, required: true, span: 6 },
        { key: 'ativo', label: 'Situação', tipo: 'radio', opcoes: ['Ativo', 'Inativo'], required: true, padrao: 'Ativo', span: 6 }
      ],
      colunas: [
        { key: 'codigo', label: 'Código', sort: true, render: (r) => h('span', { class: 'mono', text: r.codigo }) },
        { key: 'nome', label: 'Procedimento', sort: true },
        { key: 'tipo', label: 'Tipo de aditivo', sort: true },
        { key: 'ativo', label: 'Situação', sort: true, render: (r) => DS.badge(r.ativo, r.ativo === 'Ativo' ? 'success' : '') }
      ],
      unicos: [{ keys: ['codigo'], msg: 'Já existe um procedimento com esse código.' }]
    }
  };

  const chave = ESQUEMAS[DS.param('tipo')] ? DS.param('tipo') : 'tiposAditivo';
  const esq = ESQUEMAS[chave];

  const nav = document.getElementById('cadastros-nav');
  DS.fill(nav, h('ul', null, Object.keys(ESQUEMAS).map((k) => h('li', null, h('a', { href: 'cadastros.html?tipo=' + k, 'aria-current': k === chave ? 'page' : null, text: ESQUEMAS[k].titulo })))));
  document.getElementById('pagina-titulo').textContent = esq.titulo;
  document.getElementById('pagina-texto').textContent = esq.texto;

  DS.crud(Object.assign({ container: document.getElementById('lista'), db: E.db, colecao: chave, arquivo: chave + '.csv' }, esq));
  DS.pronto(esq.titulo);
})();
