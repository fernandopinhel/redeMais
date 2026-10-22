/* Orla DS: exemplos vivos da página de documentação. */
(function () {
  'use strict';

  const { h, icon, fmt } = DS;

  const swatch = (nome, cor, texto) => {
    const c = h('span', { class: 'swatch__color' });
    c.style.background = cor;
    return h('li', { class: 'swatch' }, c, h('span', { class: 'swatch__info' }, h('strong', { text: nome }), h('code', { text: texto || cor })));
  };

  DS.fill(document.getElementById('neutros'),
    swatch('Fundo', '#f4f6f8'), swatch('Superfície', '#ffffff'), swatch('Texto', '#1f2a33'), swatch('Texto suave', '#56636e'),
    swatch('Borda de campo', '#7b8792'), swatch('Sucesso', '#1a7444'), swatch('Atenção', '#8a5300'), swatch('Erro', '#b42318'), swatch('Informação', '#1d5fa8'));

  const TEMAS = [
    { nome: 'Orla Placar', cores: [['50', '#f2faf7'], ['100', '#e3f5ef'], ['200', '#bfe8dc'], ['600', '#12806a'], ['700', '#0e6b57'], ['900', '#073b30'], ['signal', '#8f5600']] },
    { nome: 'Orla Esteira', cores: [['50', '#f4f3fe'], ['100', '#e7e6fc'], ['200', '#c7c4f6'], ['600', '#4f46e5'], ['700', '#4338ca'], ['900', '#2a2479'], ['signal', '#b4361f']] },
    { nome: 'Orla Mesa', cores: [['50', '#fdf5f0'], ['100', '#fbe9df'], ['200', '#f3cdb8'], ['600', '#b8501f'], ['700', '#a8431c'], ['900', '#632715'], ['signal', '#1f5f7a']] }
  ];
  DS.fill(document.getElementById('temas'), TEMAS.map((t) => h('div', { class: 'theme-row' },
    h('h3', { text: t.nome }),
    h('ul', { class: 'swatches', 'aria-label': 'Escala de cor do ' + t.nome }, t.cores.map(([n, c]) => swatch(n, c))))));

  // Botões
  DS.fill(document.getElementById('ex-botoes'),
    h('button', { type: 'button', class: 'btn btn--primary' }, icon('check'), 'Primário'),
    h('button', { type: 'button', class: 'btn' }, 'Secundário'),
    h('button', { type: 'button', class: 'btn btn--soft' }, icon('plus'), 'Suave'),
    h('button', { type: 'button', class: 'btn btn--ghost' }, 'Fantasma'),
    h('button', { type: 'button', class: 'btn btn--danger' }, icon('trash'), 'Perigo'),
    h('button', {
      type: 'button',
      class: 'btn',
      onClick: () => DS.dialog({ titulo: 'Diálogo nativo', icone: 'info', descricao: 'Prende o foco, fecha com Esc e devolve o foco ao botão que abriu.', confirmar: 'Entendi', somenteOk: true })
    }, icon('layout'), 'Abrir diálogo'),
    h('button', { type: 'button', class: 'btn', onClick: () => DS.toast('O toast também é lido pelos leitores de tela.') }, icon('send'), 'Mostrar toast'));

  // Selos
  DS.fill(document.getElementById('ex-selos'),
    DS.badge('Neutro'), DS.badge('Sucesso', 'success'), DS.badge('Atenção', 'warning'), DS.badge('Erro', 'danger'),
    DS.badge('Informação', 'info'), DS.badge('Destaque', 'accent'), DS.badge('Apoio', 'signal'), DS.badge('Sem ponto', 'accent', true),
    h('span', { class: 'chip' }, icon('clock'), 'Chip'), h('span', { class: 'avatar', 'aria-hidden': 'true', text: 'LF' }));

  // Formulário
  const form = document.getElementById('ex-form');
  form.appendChild(h('div', { 'data-summary-anchor': '' }));
  form.appendChild(h('div', { class: 'form-grid' },
    DS.field({ id: 'ex-nome', label: 'Nome do prestador', required: true, span: 6 }),
    DS.field({ id: 'ex-cnpj', label: 'CNPJ', required: true, rules: 'cnpj', mask: 'cnpj', inputmode: 'numeric', span: 6, dica: 'Os dígitos verificadores são conferidos.' }),
    DS.field({ id: 'ex-valor', label: 'Valor negociado', tipo: 'money', required: true, span: 6 }),
    DS.field({ id: 'ex-tipo', label: 'Tipo', tipo: 'select', opcoes: ['Credenciamento', 'Manutenção'], required: true, span: 6 }),
    DS.choiceGroup({ id: 'ex-prio', name: 'prio', label: 'Prioridade', opcoes: ['Alta', 'Normal'], required: true, box: true, span: 12 })));
  form.appendChild(h('div', { class: 'btn-row mt' }, h('button', { type: 'submit', class: 'btn btn--primary', text: 'Validar' }), h('button', { type: 'button', class: 'btn', text: 'Limpar', onClick: () => { form.reset(); DS.clearErrors(form); } })));
  DS.applyMasks(form);
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (DS.validateForm(form)) DS.toast('Tudo certo com o formulário.');
  });

  // Avisos
  const aviso = (tom, ic, titulo, texto) => h('div', { class: 'alert alert--' + tom }, icon(ic), h('div', { class: 'alert__body' }, h('p', { class: 'alert__title', text: titulo }), h('p', { text: texto })));
  DS.fill(document.getElementById('ex-avisos'),
    aviso('info', 'info', 'Informação', 'Contexto que ajuda a decidir.'),
    aviso('success', 'check-circle', 'Sucesso', 'A ação deu certo.'),
    aviso('warning', 'alert', 'Atenção', 'Algo pede cuidado antes de seguir.'),
    aviso('error', 'x-circle', 'Erro', 'Explica o que aconteceu e como corrigir.'));

  // KPIs, medidores e barras
  const kpi = (ic, l, v, p) => h('li', { class: 'kpi' }, h('span', { class: 'kpi__label' }, icon(ic), l), h('span', { class: 'kpi__value', text: v }), h('span', { class: 'kpi__foot', text: p }));
  DS.fill(document.getElementById('ex-kpis'), kpi('trophy', 'Economia', fmt.moneyShort(2480000), 'No trimestre'), kpi('clock', 'Fora do prazo', '12', '8% das fichas'), kpi('percent', 'Eficiência', fmt.pct(.106), 'Média'));
  DS.fill(document.getElementById('ex-medidores'),
    h('div', { class: 'stack-sm' }, DS.meter({ valor: 92, max: 100, label: 'Meta batida' }), DS.meter({ valor: 74, max: 100, label: 'Perto da meta' }), DS.meter({ valor: 38, max: 100, label: 'Longe da meta' })),
    DS.bars([{ label: 'Distribuição', valor: 3.2 }, { label: 'Emissão', valor: 7.9 }, { label: 'Assinatura', valor: 11.4 }, { label: 'Implantação', valor: 2.6 }], (v) => fmt.decimal(v) + ' dias'));
  DS.aplicaLarguras(document);

  DS.tabs(document.getElementById('ex-abas'));

  // Tabela
  const linhas = window.Array.from({ length: 23 }, (_, i) => ({ id: i + 1, nome: ['Hospital Aurora do Vale', 'Clínica Mirante Azul', 'Instituto Serra Dourada', 'Policlínica Farol'][i % 4] + ' ' + (i + 1), cidade: ['Recife', 'Curitiba', 'Belém', 'Niterói'][i % 3], valor: 1000 * ((i * 37) % 90 + 10) }));
  const info = h('p', { class: 'hint', 'aria-live': 'polite', text: 'Nenhuma linha selecionada.' });
  const alvo = document.getElementById('ex-tabela');
  const caixa = h('div');
  alvo.append(info, caixa);
  DS.dataTable({
    container: caixa,
    caption: 'Prestadores de exemplo',
    rows: linhas,
    rowKey: (r) => r.id,
    rowLabel: (r) => r.nome,
    selectable: true,
    sortKey: 'nome',
    pageSize: 6,
    onSelect: (ids) => { info.textContent = ids.length ? fmt.plural(ids.length, 'linha selecionada', 'linhas selecionadas') + '.' : 'Nenhuma linha selecionada.'; },
    columns: [
      { key: 'nome', label: 'Prestador', sort: true },
      { key: 'cidade', label: 'Cidade', sort: true },
      { key: 'valor', label: 'Valor', num: true, sort: true, render: (r) => fmt.money(r.valor) }
    ]
  });

  DS.fill(document.getElementById('ex-timeline'),
    h('li', { class: 'is-now' }, h('p', { class: 'timeline__title', text: 'Aditivo assinado' }), h('p', { class: 'timeline__meta', text: 'Hoje, por Lívia Arruda Fontes' })),
    h('li', { class: 'is-late' }, h('p', { class: 'timeline__title', text: 'Com o prestador para assinar' }), h('p', { class: 'timeline__meta', text: '12 dias, passou do prazo' })),
    h('li', null, h('p', { class: 'timeline__title', text: 'Ficha criada' }), h('p', { class: 'timeline__meta', text: 'Há 30 dias' }), h('p', { class: 'timeline__note', text: 'Observações aparecem assim.' })));

  // Referência da API
  const API = [
    ['DS.app({ chave })', 'Configura o produto: nome, página inicial e prefixo dos dados.'],
    ['DS.createDb(gerar)', 'Banco de exemplo por produto no sessionStorage, criado pelo gerador determinístico.'],
    ['DS.h(tag, props, ...filhos)', 'Monta elementos sem innerHTML. Todo texto entra como textContent.'],
    ['DS.field / DS.choiceGroup', 'Campos com rótulo visível, dica e área de erro ligadas por aria-describedby.'],
    ['DS.validateForm(form, { extra })', 'Validação declarativa pelo HTML, regras de negócio e resumo de erros com links.'],
    ['DS.dataTable(op)', 'Tabela com ordenação (aria-sort), seleção, paginação e destaque do registro salvo.'],
    ['DS.crud(op)', 'Lista com busca, filtros, exportação e cadastro em diálogo a partir de um esquema.'],
    ['DS.dialog / DS.confirmDialog', 'Diálogo modal nativo que prende e devolve o foco.'],
    ['DS.tabs(raiz)', 'Abas acessíveis com teclado, lembradas durante a sessão.'],
    ['DS.meter / DS.bars', 'Medidores e barras, sempre com o número visível.'],
    ['DS.toast / DS.announce / DS.flash', 'Mensagens visuais e para leitores de tela, inclusive depois de mudar de página.'],
    ['DS.loginPage / DS.requireLogin', 'Login de demonstração e sessão compartilhada pela suíte.'],
    ['DS.appSwitcher / DS.userBox / DS.drawer', 'Peças de estrutura que cada produto encaixa no seu layout.'],
    ['DS.downloadCsv', 'Exportação em CSV com proteção contra injeção de fórmulas.']
  ];
  DS.dataTable({
    container: document.getElementById('api'),
    caption: 'Funções do ds.js',
    paginate: false,
    compact: true,
    rows: API.map(([f, d], i) => ({ id: i, f, d })),
    columns: [{ key: 'f', label: 'Função', render: (r) => h('code', { text: r.f }) }, { key: 'd', label: 'Para que serve' }]
  });

  document.title = 'Orla DS | Suíte Orla';
})();
