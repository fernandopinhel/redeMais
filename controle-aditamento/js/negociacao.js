/* Orla Placar: detalhe de uma negociação, valores por item e registro do acordo. */
(function () {
  'use strict';

  const P = window.PLACAR;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  if (!P.shell({ ativo: 'negociacoes', semTemporada: true })) return;

  const main = document.getElementById('conteudo');
  const neg = P.db.get('negociacoes', DS.param('id'));
  if (!neg) {
    DS.fill(main, 
      DS.breadcrumbs([{ label: 'Negociações', href: 'negociacoes.html' }, { label: 'Não encontrada' }]),
      h('div', { class: 'empty' }, icon('search'), h('h1', { text: 'Não encontramos essa negociação' }),
        h('p', { text: 'Ela pode ter sido criada em outra aba. Os dados do protótipo ficam só na aba atual.' }),
        h('a', { class: 'btn btn--primary', href: 'negociacoes.html' }, 'Voltar para a lista')));
    DS.pronto('Negociação não encontrada');
    return;
  }

  const p = R.prestador(neg.prestador);
  const editavel = neg.status === 'Em negociação' || neg.status === 'Aguardando assinatura';
  const form = document.getElementById('negociacao-form');
  const sujo = DS.guardDirty(form);

  /* ----------------------------------------------------------- Cabeçalho */
  document.getElementById('trilha').replaceWith(DS.breadcrumbs([{ label: 'Negociações', href: 'negociacoes.html' }, { label: p.nome }]));
  const resumo = document.getElementById('resumo');
  const caixa = h('div', { class: 'saving-box', 'aria-live': 'polite' });

  function pintaCaixa() {
    const eco = economiaAtual();
    const sin = P.sinistro(neg);
    DS.fill(caixa, 
      h('span', { text: 'Economia acordada' }),
      h('strong', { text: fmt.money(eco) }),
      h('small', { text: (sin ? fmt.pct(eco / sin) : '0%') + ' de eficiência sobre ' + fmt.money(sin) + ' de sinistro' }));
  }

  DS.fill(resumo, h('div', { class: 'deal-head' },
    h('div', null,
      h('span', { class: 'eyebrow' }, icon(P.ICONE_TIPO[neg.tipo]), neg.tipo),
      h('h1', { id: 'pagina-titulo', text: p.nome }),
      h('div', { class: 'cluster' }, P.statusBadge(neg.status), DS.badge(neg.listado ? 'Itens listados' : 'Itens não listados', neg.listado ? 'accent' : 'signal'), DS.badge(p.rede, '', true))),
    caixa));

  const fato = (dt, dd) => h('div', null, h('dt', { text: dt }), h('dd', { text: dd }));
  DS.fill(document.getElementById('fatos'), 
    fato('Código do prestador', p.codigo),
    fato('CNPJ', p.cnpj),
    fato('Cidade', p.cidade + ' / ' + p.uf),
    fato('Sucursal', R.sucursalNome(p.sucursal)),
    fato('Grupo ou especialidade', neg.grupo),
    fato('Período base', fmt.competencia(neg.periodoBase.ini) + ' a ' + fmt.competencia(neg.periodoBase.fim)),
    fato('Responsável', (R.pessoa(neg.responsavel) || { nome: '—' }).nome),
    fato('Aberta em', fmt.date(neg.inicio)));

  /* --------------------------------------------------------------- Itens */
  const itensEl = document.getElementById('itens');
  const inputs = [];

  function valorItem(i) {
    const inp = inputs[i];
    if (!inp) return neg.itens[i].novo;
    return inp.value.trim() ? DS.parseMoney(inp.value) : null;
  }
  function economiaAtual() {
    return neg.itens.reduce((s, it, i) => { const v = valorItem(i); return s + (v !== null && v !== undefined ? it.freq * (it.cm - v) : 0); }, 0);
  }

  const celulaEco = [];
  const corpo = h('tbody');
  neg.itens.forEach((it, i) => {
    const id = 'item-' + i;
    let controle;
    if (editavel) {
      controle = h('input', {
        class: 'input input--money input--sm',
        id,
        name: id,
        inputmode: 'decimal',
        'data-mask': 'money',
        'data-label': 'Valor negociado de ' + it.descricao,
        'aria-label': 'Valor negociado de ' + it.descricao,
        value: it.novo !== null ? fmt.decimal(it.novo) : ''
      });
      inputs[i] = controle;
      controle.addEventListener('input', () => { pintaEco(i); pintaCaixa(); totalEco(); });
    } else {
      controle = it.novo !== null ? fmt.money(it.novo) : '—';
    }
    const eco = h('td', { class: 'num' });
    celulaEco[i] = eco;
    corpo.appendChild(h('tr', null,
      h('th', { scope: 'row' }, it.descricao, h('span', { class: 'cell-sub mono', text: it.codigo })),
      h('td', { class: 'num', text: fmt.int(it.freq) }),
      h('td', { class: 'num', text: fmt.money(it.cm) }),
      h('td', { class: 'num' }, h('div', { class: 'field' }, controle)),
      eco));
  });
  const ecoTotal = h('td', { class: 'num' });
  function pintaEco(i) {
    const v = valorItem(i);
    const it = neg.itens[i];
    celulaEco[i].textContent = v === null || v === undefined ? '—' : fmt.money(it.freq * (it.cm - v));
  }
  function totalEco() { ecoTotal.textContent = fmt.money(economiaAtual()); }
  neg.itens.forEach((_, i) => pintaEco(i));
  totalEco();

  DS.fill(itensEl, h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': 'itens-cap', tabindex: '0' },
    h('table', { class: 'table' },
      h('caption', { class: 'visually-hidden', id: 'itens-cap', text: 'Itens da negociação com custo médio atual e valor negociado' }),
      h('thead', null, h('tr', null,
        h('th', { scope: 'col', text: 'Item' }),
        h('th', { scope: 'col', class: 'num', text: 'Frequência (12 meses)' }),
        h('th', { scope: 'col', class: 'num', text: 'Custo médio atual' }),
        h('th', { scope: 'col', class: 'num', text: 'Valor negociado' }),
        h('th', { scope: 'col', class: 'num', text: 'Economia em 12 meses' }))),
      corpo,
      h('tfoot', null, h('tr', null,
        h('th', { scope: 'row', text: 'Total' }),
        h('td', { class: 'num', text: fmt.int(neg.itens.reduce((s, i) => s + i.freq, 0)) }),
        h('td', { class: 'num', text: fmt.money(P.sinistro(neg)) + ' de sinistro' }),
        h('td'),
        ecoTotal)))));
  pintaCaixa();

  /* ------------------------------------------------------------ Registro */
  const concluida = form.querySelectorAll('input[name="concluida"]');
  const dataNeg = document.getElementById('data-negociacao');
  const dataAss = document.getElementById('data-assinatura');
  const obs = document.getElementById('observacao');
  const blocoDatas = document.getElementById('bloco-datas');

  concluida.forEach((r) => { r.checked = (r.value === 'sim') === !!neg.dataNegociacao; });
  dataNeg.value = neg.dataNegociacao || '';
  dataAss.value = neg.dataAssinatura || '';
  obs.value = neg.observacao || '';
  dataNeg.max = DS.hoje();
  dataAss.max = DS.hoje();
  const sim = () => form.querySelector('input[name="concluida"]:checked').value === 'sim';
  const mostraDatas = () => { blocoDatas.hidden = !sim(); };
  mostraDatas();
  concluida.forEach((r) => r.addEventListener('change', mostraDatas));

  if (!editavel) {
    DS.$$('input, textarea', form).forEach((el) => { el.disabled = true; });
    DS.fill(document.getElementById('acoes'), 
      h('p', { text: neg.status === 'Finalizada'
        ? 'Aditivo assinado: os valores ficam travados. Para rever um valor, abra uma nova negociação.'
        : 'Negociação encerrada sem acordo.' }),
      neg.status === 'Sem acordo' ? h('button', { type: 'button', class: 'btn', onClick: reabrir }, icon('undo'), 'Reabrir negociação') : null);
  }

  DS.applyMasks(form);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = DS.validateForm(form, {
      extra(addErro) {
        neg.itens.forEach((it, i) => {
          const v = valorItem(i);
          const txt = inputs[i].value.trim();
          if (txt && (v === null || v <= 0)) addErro(inputs[i], 'Use um valor maior que zero em "' + it.descricao + '".');
          else if (v !== null && v > it.cm) addErro(inputs[i], 'O valor negociado de "' + it.descricao + '" está acima do custo médio atual (' + fmt.money(it.cm) + ').');
          else if (sim() && v === null) addErro(inputs[i], 'Para concluir, informe o valor negociado de "' + it.descricao + '".');
        });
        if (!sim()) return;
        if (!dataNeg.value) addErro(dataNeg, 'Informe a data em que os valores foram acordados.');
        else if (dataNeg.value < neg.inicio) addErro(dataNeg, 'A data do acordo não pode ser antes da abertura (' + fmt.date(neg.inicio) + ').');
        else if (dataNeg.value > DS.hoje()) addErro(dataNeg, 'A data do acordo não pode estar no futuro.');
        if (dataAss.value && dataNeg.value && dataAss.value < dataNeg.value) addErro(dataAss, 'O aditivo é assinado depois do acordo. Confira as datas.');
        else if (dataAss.value > DS.hoje()) addErro(dataAss, 'A data de assinatura não pode estar no futuro.');
      }
    });
    if (!ok) return;

    const antes = neg.status;
    neg.itens.forEach((it, i) => { it.novo = valorItem(i); });
    neg.observacao = obs.value.trim();
    if (sim()) {
      neg.dataNegociacao = dataNeg.value;
      neg.dataAssinatura = dataAss.value || null;
      neg.status = neg.dataAssinatura ? 'Finalizada' : 'Aguardando assinatura';
    } else {
      neg.dataNegociacao = null;
      neg.dataAssinatura = null;
      neg.status = 'Em negociação';
    }
    neg.atualizadoEm = DS.hoje();
    const u = DS.usuario();
    const texto = neg.status === 'Finalizada' ? 'Aditivo assinado. Economia de ' + fmt.money(P.economia(neg)) + ' passa a contar no placar.'
      : neg.status === 'Aguardando assinatura' ? 'Valores acordados. Aguardando a assinatura do aditivo.'
        : 'Valores em negociação atualizados.';
    neg.historico.push({ quando: new Date().toISOString(), quem: u.nome, texto: texto + (neg.observacao ? ' Observação: ' + neg.observacao : '') });
    P.db.save();
    sujo.clean();

    let msg = 'Negociação salva.';
    if (neg.status === 'Finalizada' && antes !== 'Finalizada') {
      const q = DS.trimestre(neg.dataAssinatura);
      msg = 'Pronto! ' + fmt.money(P.economia(neg)) + ' de economia entraram no placar do ' + DS.rotuloTrimestre(q.t, q.ano) + '.';
    }
    DS.flash(msg);
    window.location.reload();
  });

  const btnSemAcordo = document.getElementById('sem-acordo');
  if (btnSemAcordo) btnSemAcordo.addEventListener('click', () => {
    DS.dialog({
      titulo: 'Encerrar sem acordo?',
      icone: 'x-circle',
      tom: 'danger',
      tomBotao: 'danger',
      confirmar: 'Encerrar negociação',
      descricao: 'A negociação sai da lista de andamento e não conta no placar. Dá para reabrir depois.',
      montar(c) { c.appendChild(DS.field({ id: 'motivo', label: 'Motivo', tipo: 'textarea', required: true, max: 400, dica: 'Ex.: o prestador não aceitou reduzir o valor da diária.' })); },
      aoConfirmar(f) {
        if (!DS.validateForm(f)) return false;
        return f.querySelector('#motivo').value.trim();
      }
    }).then((motivo) => {
      if (!motivo) return;
      neg.status = 'Sem acordo';
      neg.atualizadoEm = DS.hoje();
      neg.historico.push({ quando: new Date().toISOString(), quem: DS.usuario().nome, texto: 'Encerrada sem acordo. Motivo: ' + motivo });
      P.db.save();
      sujo.clean();
      DS.flash('Negociação encerrada sem acordo.');
      window.location.reload();
    });
  });

  function reabrir() {
    neg.status = 'Em negociação';
    neg.atualizadoEm = DS.hoje();
    neg.historico.push({ quando: new Date().toISOString(), quem: DS.usuario().nome, texto: 'Negociação reaberta.' });
    P.db.save();
    DS.flash('Negociação reaberta.');
    window.location.reload();
  }

  /* ------------------------------------------------------------ Histórico */
  const tl = document.getElementById('historico');
  const eventos = neg.historico.slice().reverse();
  DS.fill(tl, ...eventos.map((e, i) => h('li', { class: i === 0 ? 'is-now' : '' },
    h('p', { class: 'timeline__title', text: e.texto }),
    h('p', { class: 'timeline__meta', text: e.quem + ' · ' + (e.quando.length > 10 ? fmt.dateTime(e.quando) : fmt.date(e.quando)) }))));

  DS.pronto(p.nome);
})();
