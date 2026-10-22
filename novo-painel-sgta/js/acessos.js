/* Orla Mesa: perfis, funcionalidades de cada perfil e perfil de cada pessoa. */
(function () {
  'use strict';

  const M = window.MESA;
  const { h, icon } = DS;
  const R = window.REDE;
  if (!M.shell({ ativo: 'acessos' })) return;

  const FUNCS = M.db.all('FUNCS');
  const perfis = () => M.db.all('perfis');

  /* ------------------------------------------------- Matriz de funcionalidades */
  const form = document.getElementById('painel-matriz');
  const sujo = DS.guardDirty(form);
  function pintaMatriz() {
    const cab = h('tr', null, h('th', { scope: 'col', text: 'Funcionalidade' }), perfis().map((p) => h('th', { scope: 'col', text: p.nome })));
    const corpo = h('tbody');
    FUNCS.forEach((f) => {
      corpo.appendChild(h('tr', null, h('th', { scope: 'row', text: f }), perfis().map((p) => h('td', null, h('input', {
        type: 'checkbox',
        'data-perfil': String(p.id),
        'data-func': f,
        'aria-label': f + ' para o perfil ' + p.nome,
        checked: p.funcionalidades.indexOf(f) >= 0
      })))));
    });
    DS.fill(document.getElementById('matriz'), h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': 'matriz-cap', tabindex: '0' },
      h('table', { class: 'table table--compact matrix' }, h('caption', { class: 'visually-hidden', id: 'matriz-cap', text: 'Funcionalidades liberadas para cada perfil' }), h('thead', null, cab), corpo)));
  }

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const semNada = perfis().filter((p) => !DS.$$('input[data-perfil="' + p.id + '"]:checked', form).length);
    const gestaoSemAcesso = !DS.$$('input[data-func="Acessos"]:checked', form).length;
    const alerta = document.getElementById('matriz-erro');
    const msgs = [];
    if (semNada.length) msgs.push('O perfil ' + semNada.map((p) => p.nome).join(', ') + ' ficaria sem nenhuma funcionalidade.');
    if (gestaoSemAcesso) msgs.push('Pelo menos um perfil precisa ter "Acessos", senão ninguém consegue mudar esta tela.');
    if (msgs.length) {
      DS.fill(alerta, icon('alert'), h('div', { class: 'alert__body' }, h('p', { class: 'alert__title', text: 'Não deu para salvar:' }), h('ul', null, msgs.map((m) => h('li', { text: m })))));
      alerta.hidden = false;
      alerta.focus();
      DS.announce(msgs.join(' '));
      return;
    }
    alerta.hidden = true;
    perfis().forEach((p) => { p.funcionalidades = DS.$$('input[data-perfil="' + p.id + '"]:checked', form).map((el) => el.dataset.func); });
    M.db.save();
    sujo.clean();
    DS.toast('Permissões salvas.');
  });

  /* ------------------------------------------------------------- Perfis */
  DS.crud({
    container: document.getElementById('perfis'),
    db: M.db,
    colecao: 'perfis',
    singular: 'perfil', plural: 'perfis', novo: 'Cadastrar perfil',
    rotulo: (r) => r.nome,
    busca: ['nome'],
    campos: [{ key: 'nome', label: 'Nome do perfil', required: true, max: 40 }],
    colunas: [
      { key: 'nome', label: 'Perfil', sort: true },
      { key: 'qtd', label: 'Funcionalidades', num: true, sort: (r) => (r.funcionalidades || []).length, render: (r) => String((r.funcionalidades || []).length) },
      { key: 'pessoas', label: 'Pessoas', num: true, render: (r) => String(M.db.all('usuarios').filter((u) => u.perfil === r.nome).length) }
    ],
    antesSalvar: (d, reg) => {
      if (reg && reg.nome !== d.nome) M.db.all('usuarios').forEach((u) => { if (u.perfil === reg.nome) u.perfil = d.nome; });
      return Object.assign(d, { funcionalidades: reg ? reg.funcionalidades : ['Cálculo de economia'] });
    },
    unicos: [{ keys: ['nome'], msg: 'Já existe um perfil com esse nome.' }],
    podeExcluir: (r) => { const n = M.db.all('usuarios').filter((u) => u.perfil === r.nome).length; return n ? n + ' pessoas usam esse perfil. Mude o perfil delas antes.' : null; },
    aoMudar: () => { pintaMatriz(); usuarios.atualizar(); }
  });

  /* ---------------------------------------------------------- Pessoas */
  const usuarios = DS.crud({
    container: document.getElementById('usuarios'),
    db: M.db,
    colecao: 'usuarios',
    singular: 'pessoa', plural: 'pessoas', novo: 'Dar acesso a uma pessoa', feminino: true,
    rotulo: (r) => (R.pessoa(r.matricula) || { nome: r.matricula }).nome,
    busca: ['matricula', 'perfil'],
    filtros: [{ key: 'perfil', label: 'Perfil', opcoes: () => perfis().map((p) => p.nome), todos: 'Todos os perfis' }],
    campos: [
      { key: 'matricula', label: 'Pessoa', tipo: 'select', opcoes: R.pessoas.map((p) => ({ value: p.matricula, label: p.nome + ' (' + p.matricula + ')' })), required: true, span: 6 },
      { key: 'perfil', label: 'Perfil', tipo: 'select', opcoes: () => perfis().map((p) => p.nome), required: true, span: 6 }
    ],
    colunas: [
      { key: 'matricula', label: 'Pessoa', sort: (r) => (R.pessoa(r.matricula) || {}).nome, render: (r) => h('span', null, (R.pessoa(r.matricula) || { nome: '—' }).nome, h('span', { class: 'cell-sub', text: 'Matrícula ' + r.matricula })), csv: (r) => (R.pessoa(r.matricula) || {}).nome },
      { key: 'perfil', label: 'Perfil', sort: true }
    ],
    unicos: [{ keys: ['matricula'], msg: 'Essa pessoa já tem acesso. Edite o perfil dela na lista.' }],
    podeExcluir: (r) => (r.matricula === DS.usuario().matricula ? 'Você não pode tirar o próprio acesso.' : null)
  });

  pintaMatriz();
  DS.tabs(document.getElementById('abas'));
  DS.pronto('Acessos');
})();
