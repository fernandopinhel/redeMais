/* Orla Placar: painel do trimestre em foco. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'placar' })) return;

  const hero = document.getElementById('placar-hero');
  const lanes = document.getElementById('placar-tipos');
  const podio = document.getElementById('placar-podio');
  const paradas = document.getElementById('placar-paradas');
  const matriz = document.getElementById('placar-matriz');

  function render() {
    const q = P.temporada();
    const real = P.realizado(q);
    const meta = P.meta(q);
    const ritmo = P.ritmo(q.t, q.ano);
    const esperado = meta * ritmo;
    const negs = P.db.all('negociacoes');
    const finalizadas = negs.filter((n) => n.status === 'Finalizada' && P.noTrimestre(n.dataAssinatura, q.t, q.ano));
    const andamento = negs.filter((n) => n.status === 'Em negociação' || n.status === 'Aguardando assinatura');
    const limiteParada = DS.somaDias(DS.hoje(), -30);
    const semMovimento = andamento.filter((n) => n.atualizadoEm < limiteParada);
    const eficienciaMedia = finalizadas.length ? finalizadas.reduce((s, n) => s + P.eficiencia(n), 0) / finalizadas.length : 0;

    // Placar principal
    const medidor = DS.meter({ valor: real, max: meta, label: 'Atingimento da meta', tom: 'plain' });
    if (ritmo > 0 && ritmo < 1) {
      const mark = h('span', { class: 'meter__mark', title: 'Ritmo esperado para hoje' });
      mark.dataset.left = String(Math.round(ritmo * 100));
      medidor.querySelector('.meter__track').appendChild(mark);
    }
    let ritmoTexto;
    if (ritmo === 0) ritmoTexto = 'Esse trimestre ainda não começou. As metas já cadastradas aparecem aqui.';
    else if (ritmo === 1) ritmoTexto = real >= meta ? 'Trimestre fechado com a meta batida.' : 'Trimestre fechado abaixo da meta. Faltaram ' + fmt.money(meta - real) + '.';
    else if (real >= esperado) ritmoTexto = 'Acima do ritmo esperado para hoje (' + fmt.money(esperado) + '). A marca branca na barra mostra esse ponto.';
    else ritmoTexto = 'Abaixo do ritmo esperado para hoje (' + fmt.money(esperado) + '). A marca branca na barra mostra esse ponto.';

    const stat = (ic, rotulo, valor) => h('div', { class: 'scoreboard__stat' }, h('span', null, icon(ic), rotulo), h('strong', { text: valor }));
    DS.fill(hero,
      h('div', null,
        h('span', { class: 'eyebrow' }, icon('trophy'), 'Placar do ' + DS.rotuloTrimestre(q.t, q.ano)),
        h('h1', { id: 'pagina-titulo', text: 'Economia com aditivos' }),
        h('p', { class: 'scoreboard__big' },
          h('strong', { text: fmt.money(real) }),
          h('span', { text: meta ? 'de ' + fmt.money(meta) + ' de meta' : 'sem meta cadastrada' })),
        meta ? medidor : null,
        h('p', { class: 'scoreboard__pace', text: ritmoTexto })),
      h('div', { class: 'scoreboard__side' },
        stat('check-circle', 'Aditivos assinados', fmt.int(finalizadas.length)),
        stat('handshake', 'Negociações em andamento', fmt.int(andamento.length)),
        stat('percent', 'Eficiência média', fmt.pct(eficienciaMedia)),
        stat('hourglass', 'Paradas há mais de 30 dias', fmt.int(semMovimento.length)),
        h('div', { class: 'btn-row' },
          h('a', { class: 'btn btn--sm', href: 'negociacoes.html' }, 'Ver negociações'),
          h('a', { class: 'btn btn--sm', href: 'relatorios.html' }, 'Relatório do trimestre'))));
    DS.$$('[data-left]', hero).forEach((el) => { el.style.left = el.dataset.left + '%'; });

    // Um cartão por tipo de aditivo
    lanes.replaceChildren();
    P.TIPOS.forEach((tipo) => {
      const f = Object.assign({ tipo }, q);
      const rt = P.realizado(f);
      const mt = P.meta(f);
      const qtd = finalizadas.filter((n) => n.tipo === tipo).length;
      lanes.appendChild(h('li', { class: 'lane' },
        h('div', { class: 'lane__head' }, h('h3', { text: tipo }), h('span', { class: 'lane__icon', 'aria-hidden': 'true' }, icon(P.ICONE_TIPO[tipo]))),
        h('p', { class: 'lane__value' }, fmt.money(rt), h('small', { text: mt ? 'Meta de ' + fmt.money(mt) : 'Sem meta cadastrada' })),
        mt ? DS.meter({ valor: rt, max: mt, label: 'Atingimento' }) : null,
        h('div', { class: 'lane__foot' },
          h('span', { text: fmt.plural(qtd, 'aditivo assinado', 'aditivos assinados') }),
          h('a', { href: 'negociacoes.html?tipo=' + encodeURIComponent(tipo), 'aria-label': 'Ver negociações de ' + tipo }, 'Ver'))));
    });

    // Pódio das sucursais por atingimento
    const ranking = R.sucursais.map((s) => {
      const f = Object.assign({ sucursal: s.sigla }, q);
      const rt = P.realizado(f);
      const mt = P.meta(f);
      return { s, rt, mt, pct: mt ? rt / mt : 0 };
    }).sort((a, b) => b.pct - a.pct || b.rt - a.rt);
    podio.replaceChildren();
    ranking.forEach((x, i) => {
      podio.appendChild(h('li', null,
        h('span', { class: 'podium__pos', 'aria-hidden': 'true', text: String(i + 1) }),
        h('span', { class: 'podium__name' },
          h('strong', null, h('span', { class: 'visually-hidden', text: (i + 1) + 'º lugar: ' }), x.s.nome),
          DS.meter({ valor: x.rt, max: x.mt || 1 })),
        h('span', { class: 'podium__value' }, x.mt ? fmt.pct(x.pct) : 'Sem meta', h('small', { text: fmt.moneyShort(x.rt) + ' de ' + fmt.moneyShort(x.mt) }))));
    });

    // Negociações sem movimento
    paradas.replaceChildren();
    const lista = semMovimento.slice().sort((a, b) => a.atualizadoEm.localeCompare(b.atualizadoEm)).slice(0, 6);
    if (!lista.length) {
      paradas.appendChild(h('div', { class: 'empty' }, icon('check-circle'), h('strong', { text: 'Nenhuma negociação parada' }), h('p', { text: 'Todas tiveram movimento nos últimos 30 dias.' })));
    } else {
      const ul = h('ul', { class: 'podium podium--plain' });
      lista.forEach((n) => {
        const dias = DS.diasEntre(n.atualizadoEm, DS.hoje());
        ul.appendChild(h('li', null,
          h('span', { class: 'podium__pos', 'aria-hidden': 'true' }, icon('hourglass', 'icon--sm')),
          h('span', { class: 'podium__name' },
            h('a', { href: 'negociacao.html?id=' + n.id, text: P.nomePrestador(n.prestador) }),
            h('span', { class: 'cell-sub', text: n.tipo + ' · ' + n.grupo })),
          h('span', { class: 'podium__value' }, fmt.dias(dias), h('small', { text: 'sem movimento' }))));
      });
      paradas.appendChild(ul);
      if (semMovimento.length > lista.length) {
        paradas.appendChild(h('p', { class: 'muted' }, h('a', { href: 'negociacoes.html?paradas=1', text: 'Ver as ' + semMovimento.length + ' negociações paradas' })));
      }
    }

    // Matriz sucursal x tipo (a mesma informação do pódio, em tabela)
    const linhas = R.sucursais.map((s) => {
      const linha = { sucursal: s.nome };
      P.TIPOS.forEach((tipo) => {
        const f = Object.assign({ tipo, sucursal: s.sigla }, q);
        linha[tipo] = { rt: P.realizado(f), mt: P.meta(f) };
      });
      return linha;
    });
    const celula = (c) => h('span', null, fmt.money(c.rt), h('span', { class: 'cell-sub', text: c.mt ? fmt.pct(c.rt / c.mt) + ' da meta' : 'sem meta' }));
    DS.dataTable({
      container: matriz,
      caption: 'Economia por sucursal e tipo de aditivo no ' + DS.rotuloTrimestre(q.t, q.ano),
      columns: [{ key: 'sucursal', label: 'Sucursal' }].concat(P.TIPOS.map((t) => ({ key: t, label: t, num: true, render: (r) => celula(r[t]) }))),
      rows: linhas,
      paginate: false,
      compact: true
    });
    DS.aplicaLarguras(document);
  }

  render();
  document.addEventListener('temporada', () => {
    render();
    const q = P.temporada();
    DS.announce('Placar atualizado para o ' + DS.rotuloTrimestre(q.t, q.ano) + '.');
  });
  DS.pronto('Placar');
})();
