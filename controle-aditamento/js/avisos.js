/* Orla Placar: quem recebe os avisos por e-mail. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const R = window.REDE;
  if (!P.shell({ ativo: 'avisos', semTemporada: true })) return;

  const EVENTOS = ['Meta do trimestre atingida', 'Negociação parada há 30 dias', 'Importação com inconsistências', 'Fechamento do trimestre'];
  const sucursais = [{ value: '', label: 'Todas as sucursais' }].concat(R.sucursais.map((s) => ({ value: s.sigla, label: s.nome })));

  DS.crud({
    container: document.getElementById('lista'),
    db: P.db,
    colecao: 'avisos',
    singular: 'destinatário',
    plural: 'destinatários',
    novo: 'Cadastrar destinatário',
    arquivo: 'avisos.csv',
    rotulo: (r) => r.nome,
    busca: ['nome', 'email'],
    filtros: [{ key: 'evento', label: 'Evento', opcoes: EVENTOS, todos: 'Todos os eventos' }],
    campos: [
      { key: 'nome', label: 'Nome ou equipe', required: true, max: 80, span: 6 },
      { key: 'email', label: 'E-mail', tipo: 'email', required: true, rules: 'email', max: 120, span: 6, autocomplete: 'email' },
      { key: 'evento', label: 'Quando avisar', tipo: 'select', opcoes: EVENTOS, required: true, span: 6 },
      { key: 'sucursal', label: 'Sucursal', tipo: 'select', opcoes: sucursais.slice(1), vazio: 'Todas as sucursais', span: 6, dica: 'Deixe em "Todas" para receber de qualquer sucursal.' }
    ],
    colunas: [
      { key: 'nome', label: 'Nome ou equipe', sort: true },
      { key: 'email', label: 'E-mail', sort: true },
      { key: 'evento', label: 'Quando avisar', sort: true },
      { key: 'sucursal', label: 'Sucursal', sort: true, render: (r) => (r.sucursal ? R.sucursalNome(r.sucursal) : 'Todas'), csv: (r) => (r.sucursal ? R.sucursalNome(r.sucursal) : 'Todas') }
    ],
    unicos: [{ keys: ['email', 'evento', 'sucursal'], msg: 'Esse e-mail já recebe esse aviso para essa sucursal.' }]
  });

  DS.pronto('Avisos por e-mail');
})();
