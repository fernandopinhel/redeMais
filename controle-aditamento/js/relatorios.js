/* Orla Placar: relatórios do trimestre, ranking, prazo de assinatura e congelamento. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'relatorios' })) return;

  const negs = () => P.db.all('negociacoes');
  const nomeQ = (q) => DS.rotuloTrimestre(q.t, q.ano);

  /* ------------------------------------------------ Relatório de controle */
  function linhasControle(q) {
    const out = [];
    R.sucursais.forEach((s) => {
      P.TIPOS.forEach((tipo) => {
        const f = { t: q.t, ano: q.ano, tipo, sucursal: s.sigla };
        const daSucursal = negs().filter((n) => n.tipo === tipo && R.prestador(n.prestador).sucursal === s.sigla);
        out.push({
          id: s.sigla + tipo,
          sucursal: s.nome,
          tipo,
          meta: P.meta(f),
          realizado: P.realizado(f),
          assinados: daSucursal.filter((n) => n.status === 'Finalizada' && P.noTrimestre(n.dataAssinatura, q.t, q.ano)).length,
          andamento: daSucursal.filter((n) => n.status === 'Em negociação' || n.status === 'Aguardando assinatura').length
        });
      });
    });
    return out;
  }

  const colsControle = [
    { key: 'sucursal', label: 'Sucursal', sort: true },
    { key: 'tipo', label: 'Tipo de aditivo', sort: true },
    { key: 'meta', label: 'Meta', num: true, sort: true, render: (r) => fmt.money(r.meta), csv: (r) => fmt.decimal(r.meta) },
    { key: 'realizado', label: 'Realizado', num: true, sort: true, render: (r) => fmt.money(r.realizado), csv: (r) => fmt.decimal(r.realizado) },
    { key: 'ating', label: 'Atingimento', num: true, sort: (r) => (r.meta ? r.realizado / r.meta : 0), render: (r) => (r.meta ? fmt.pct(r.realizado / r.meta) : '—'), csv: (r) => (r.meta ? fmt.pct(r.realizado / r.meta) : '') },
    { key: 'assinados', label: 'Aditivos assinados', num: true, sort: true },
    { key: 'andamento', label: 'Em andamento', num: true, sort: true }
  ];

  const controleEl = document.getElementById('controle-tabela');
  let tabelaControle;
  function renderControle() {
    const q = P.temporada();
    const linhas = linhasControle(q);
    document.getElementById('controle-titulo-q').textContent = nomeQ(q);
    const totalMeta = linhas.reduce((s, l) => s + l.meta, 0);
    const totalReal = linhas.reduce((s, l) => s + l.realizado, 0);
    document.getElementById('controle-resumo').textContent = 'Meta de ' + fmt.money(totalMeta) + ', realizado de ' + fmt.money(totalReal) + (totalMeta ? ' (' + fmt.pct(totalReal / totalMeta) + ').' : '.');
    const rodape = () => h('tfoot', null, h('tr', null,
      h('th', { scope: 'row', colspan: '2', text: 'Total' }),
      h('td', { class: 'num', text: fmt.money(totalMeta) }),
      h('td', { class: 'num', text: fmt.money(totalReal) }),
      h('td', { class: 'num', text: totalMeta ? fmt.pct(totalReal / totalMeta) : '—' }),
      h('td', { class: 'num', text: fmt.int(linhas.reduce((s, l) => s + l.assinados, 0)) }),
      h('td', { class: 'num', text: fmt.int(linhas.reduce((s, l) => s + l.andamento, 0)) })));
    if (!tabelaControle) {
      tabelaControle = DS.dataTable({ container: controleEl, caption: 'Relatório de controle por sucursal e tipo', columns: colsControle, rows: linhas, pageSize: 32, paginate: false, compact: true, footer: rodape });
    } else {
      tabelaControle.update(linhas);
    }
  }
  document.getElementById('controle-csv').addEventListener('click', () => {
    const q = P.temporada();
    DS.downloadCsv('controle-' + q.t + 't' + q.ano + '.csv', colsControle, tabelaControle.rows());
  });
  document.getElementById('controle-imprimir').addEventListener('click', () => window.print());

  /* --------------------------------------------------- Ranking de prestadores */
  const rankingEl = document.getElementById('ranking-tabela');
  const rankingBarras = document.getElementById('ranking-barras');
  const periodo = document.getElementById('ranking-periodo');
  let tabelaRanking;
  function renderRanking() {
    const q = P.temporada();
    const anual = periodo.querySelector('input:checked').value === 'ano';
    const dentro = (n) => n.status === 'Finalizada' && (anual ? DS.trimestre(n.dataAssinatura).ano === q.ano : P.noTrimestre(n.dataAssinatura, q.t, q.ano));
    const mapa = new Map();
    negs().filter(dentro).forEach((n) => {
      const x = mapa.get(n.prestador) || { id: n.prestador, codigo: n.prestador, economia: 0, sinistro: 0, qtd: 0 };
      x.economia += P.economia(n);
      x.sinistro += P.sinistro(n);
      x.qtd += 1;
      mapa.set(n.prestador, x);
    });
    const linhas = Array.from(mapa.values()).sort((a, b) => b.economia - a.economia).slice(0, 15).map((x, i) => Object.assign(x, { pos: i + 1 }));
    document.getElementById('ranking-legenda').textContent = 'Os 15 prestadores com mais economia em aditivos assinados ' + (anual ? 'em ' + q.ano : 'no ' + nomeQ(q)) + '.';
    DS.fill(rankingBarras, DS.bars(linhas.slice(0, 8).map((l) => ({ label: R.prestador(l.codigo).nome, valor: l.economia })), fmt.moneyShort));
    const cols = [
      { key: 'pos', label: 'Posição', sort: true, render: (r) => r.pos + 'º' },
      { key: 'nome', label: 'Prestador', sort: (r) => R.prestador(r.codigo).nome, render: (r) => h('span', null, R.prestador(r.codigo).nome, h('span', { class: 'cell-sub', text: R.prestador(r.codigo).cidade + ' / ' + R.prestador(r.codigo).uf })), csv: (r) => R.prestador(r.codigo).nome },
      { key: 'sucursal', label: 'Sucursal', render: (r) => R.prestador(r.codigo).sucursal, csv: (r) => R.prestador(r.codigo).sucursal },
      { key: 'qtd', label: 'Aditivos', num: true, sort: true },
      { key: 'economia', label: 'Economia', num: true, sort: true, render: (r) => fmt.money(r.economia), csv: (r) => fmt.decimal(r.economia) },
      { key: 'efic', label: 'Eficiência', num: true, sort: (r) => r.economia / r.sinistro, render: (r) => fmt.pct(r.economia / r.sinistro), csv: (r) => fmt.pct(r.economia / r.sinistro) }
    ];
    if (!tabelaRanking) {
      tabelaRanking = DS.dataTable({ container: rankingEl, caption: 'Ranking de prestadores por economia', columns: cols, rows: linhas, paginate: false, sortKey: 'pos', emptyTitle: 'Nenhum aditivo assinado nesse período', emptyText: 'Escolha outro trimestre na faixa do topo.' });
      document.getElementById('ranking-csv').addEventListener('click', () => DS.downloadCsv('ranking-prestadores.csv', cols, tabelaRanking.rows()));
    } else {
      tabelaRanking.update(linhas);
    }
    DS.aplicaLarguras(rankingBarras);
  }
  periodo.addEventListener('change', () => { renderRanking(); DS.announce('Ranking atualizado.'); });

  /* ----------------------------------------------- Prazo de assinatura (SLA) */
  const PRAZO = 30;
  const slaEl = document.getElementById('sla-tabela');
  let tabelaSla;
  function renderSla() {
    const q = P.temporada();
    const linhas = R.sucursais.map((s) => {
      const lista = negs().filter((n) => n.status === 'Finalizada' && P.noTrimestre(n.dataAssinatura, q.t, q.ano) && R.prestador(n.prestador).sucursal === s.sigla);
      const dias = lista.map((n) => DS.diasEntre(n.dataNegociacao, n.dataAssinatura));
      const media = dias.length ? dias.reduce((a, b) => a + b, 0) / dias.length : 0;
      return { id: s.sigla, sucursal: s.nome, qtd: dias.length, media, dentro: dias.filter((d) => d <= PRAZO).length, maior: dias.length ? Math.max.apply(null, dias) : 0 };
    });
    const cols = [
      { key: 'sucursal', label: 'Sucursal', sort: true },
      { key: 'qtd', label: 'Aditivos assinados', num: true, sort: true },
      { key: 'media', label: 'Tempo médio', num: true, sort: true, render: (r) => (r.qtd ? fmt.dias(Math.round(r.media)) : '—'), csv: (r) => Math.round(r.media) },
      { key: 'dentro', label: 'Dentro do prazo', num: true, sort: (r) => (r.qtd ? r.dentro / r.qtd : 0), render: (r) => (r.qtd ? h('span', { class: 'cluster' }, fmt.pct(r.dentro / r.qtd), DS.badge(r.dentro / r.qtd >= .8 ? 'No alvo' : 'Atenção', r.dentro / r.qtd >= .8 ? 'success' : 'warning')) : '—'), csv: (r) => (r.qtd ? fmt.pct(r.dentro / r.qtd) : '') },
      { key: 'maior', label: 'Maior tempo', num: true, sort: true, render: (r) => (r.qtd ? fmt.dias(r.maior) : '—') }
    ];
    if (!tabelaSla) {
      tabelaSla = DS.dataTable({ container: slaEl, caption: 'Tempo entre o acordo e a assinatura do aditivo, por sucursal', columns: cols, rows: linhas, paginate: false });
      document.getElementById('sla-csv').addEventListener('click', () => DS.downloadCsv('prazo-assinatura.csv', cols, tabelaSla.rows()));
    } else {
      tabelaSla.update(linhas);
    }
  }

  /* ------------------------------------------------------------ Congelamentos */
  const congEl = document.getElementById('congelamentos');
  function renderCongelamentos() {
    const q = P.temporada();
    const lista = P.db.all('congelamentos').slice().sort((a, b) => b.quando.localeCompare(a.quando));
    document.getElementById('congelar').textContent = '';
    document.getElementById('congelar').append(icon('snowflake'), 'Congelar o ' + nomeQ(q));
    if (!lista.length) {
      DS.fill(congEl, h('div', { class: 'empty' }, icon('snowflake'), h('strong', { text: 'Nenhum relatório congelado ainda' }), h('p', { text: 'Congele um trimestre para guardar uma foto dos números que não muda mais.' })));
      return;
    }
    const cols = [
      { key: 'tri', label: 'Trimestre', render: (r) => nomeQ(r) },
      { key: 'versao', label: 'Versão', render: (r) => 'Versão ' + r.versao },
      { key: 'quando', label: 'Congelado em', render: (r) => fmt.dateTime(r.quando) },
      { key: 'quem', label: 'Por' },
      { key: 'real', label: 'Realizado congelado', num: true, render: (r) => fmt.money(r.linhas.reduce((s, l) => s + l.realizado, 0)) },
      {
        key: '_acoes', label: 'Ações', srOnly: true, class: 'col-actions', render: (r) => h('div', { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn--sm', onClick: () => verVersao(r) }, 'Comparar'),
          h('button', { type: 'button', class: 'btn btn--ghost btn--sm', onClick: () => descongelar(r) }, 'Descongelar'))
      }
    ];
    DS.dataTable({ container: congEl, caption: 'Relatórios congelados', columns: cols, rows: lista, paginate: false });
  }

  document.getElementById('congelar').addEventListener('click', async () => {
    const q = P.temporada();
    const versoes = P.db.all('congelamentos').filter((c) => c.t === q.t && c.ano === q.ano);
    const aberto = DS.hoje() <= P.fimTrimestre(q.t, q.ano);
    const ok = await DS.confirmDialog({
      titulo: 'Congelar o relatório do ' + nomeQ(q) + '?',
      icone: 'snowflake',
      descricao: (aberto ? 'Esse trimestre ainda não terminou, então a foto pode ficar diferente do fechamento. ' : '') +
        'Os números de hoje viram a versão ' + (versoes.length + 1) + ' e não mudam mais, mesmo que alguém edite uma negociação ou meta depois.',
      confirmar: 'Congelar relatório'
    });
    if (!ok) return;
    P.db.insert('congelamentos', { t: q.t, ano: q.ano, versao: versoes.length + 1, quando: new Date().toISOString(), quem: DS.usuario().nome, linhas: linhasControle(q) });
    renderCongelamentos();
    DS.toast('Relatório do ' + nomeQ(q) + ' congelado como versão ' + (versoes.length + 1) + '.');
  });

  function verVersao(c) {
    const atuais = linhasControle(c);
    const totalC = c.linhas.reduce((s, l) => s + l.realizado, 0);
    const totalA = atuais.reduce((s, l) => s + l.realizado, 0);
    DS.dialog({
      titulo: nomeQ(c) + ', versão ' + c.versao,
      wide: true,
      somenteOk: true,
      confirmar: 'Fechar',
      montar(corpo) {
        const dif = totalA - totalC;
        corpo.appendChild(h('div', { class: 'alert ' + (Math.abs(dif) < 1 ? 'alert--success' : 'alert--info') }, icon('info'),
          h('div', { class: 'alert__body' }, h('p', { text: Math.abs(dif) < 1 ? 'Os números de hoje são iguais aos da versão congelada.' : 'Desde o congelamento, o realizado mudou ' + (dif > 0 ? 'para mais' : 'para menos') + ' em ' + fmt.money(Math.abs(dif)) + '.' }))));
        const div = h('div');
        corpo.appendChild(div);
        const porSuc = R.sucursais.map((s) => ({
          id: s.sigla,
          sucursal: s.nome,
          congelado: c.linhas.filter((l) => l.sucursal === s.nome).reduce((a, l) => a + l.realizado, 0),
          hoje: atuais.filter((l) => l.sucursal === s.nome).reduce((a, l) => a + l.realizado, 0)
        }));
        DS.dataTable({
          container: div,
          caption: 'Realizado congelado e realizado hoje, por sucursal',
          paginate: false,
          compact: true,
          rows: porSuc,
          columns: [
            { key: 'sucursal', label: 'Sucursal' },
            { key: 'congelado', label: 'Congelado', num: true, render: (r) => fmt.money(r.congelado) },
            { key: 'hoje', label: 'Hoje', num: true, render: (r) => fmt.money(r.hoje) },
            { key: 'dif', label: 'Diferença', num: true, render: (r) => (Math.abs(r.hoje - r.congelado) < 1 ? '—' : fmt.money(r.hoje - r.congelado)) }
          ]
        });
      }
    });
  }

  async function descongelar(c) {
    const ok = await DS.confirmDialog({
      titulo: 'Descongelar a versão ' + c.versao + ' do ' + nomeQ(c) + '?',
      descricao: 'A foto dos números é apagada. As metas desse trimestre voltam a aceitar alterações e exclusões.',
      confirmar: 'Descongelar',
      tomBotao: 'danger'
    });
    if (!ok) return;
    P.db.remove('congelamentos', c.id);
    renderCongelamentos();
    DS.toast('Versão ' + c.versao + ' do ' + nomeQ(c) + ' descongelada.');
    document.getElementById('congelar').focus();
  }

  /* -------------------------------------------------------------- Montagem */
  function renderTudo() {
    renderControle();
    renderRanking();
    renderSla();
    renderCongelamentos();
  }
  DS.tabs(document.getElementById('relatorios'));
  renderTudo();
  document.addEventListener('temporada', () => {
    renderTudo();
    DS.announce('Relatórios atualizados para o ' + nomeQ(P.temporada()) + '.');
  });
  DS.pronto('Relatórios');
})();
