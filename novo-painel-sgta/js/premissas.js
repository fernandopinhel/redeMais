/* Orla Mesa: premissas do cálculo (aderência, efetividade, inflação e prazos). */
(function () {
  'use strict';

  const M = window.MESA;
  const { h, fmt } = DS;
  if (!M.shell({ ativo: 'premissas' })) return;

  const pr = M.premissas();
  const totalNegociada = () => M.db.all('negociacoes').reduce((s, n) => s + M.calcular(n).negociada, 0);
  const totalImplantada = () => M.db.all('negociacoes').reduce((s, n) => s + M.calcular(n).implantada, 0);
  const avisaImpacto = (antesN, antesI, msg) => {
    const dn = totalNegociada();
    const di = totalImplantada();
    DS.toast(msg + ' Economia negociada: ' + fmt.money(antesN) + ' → ' + fmt.money(dn) + '. Implantada: ' + fmt.money(antesI) + ' → ' + fmt.money(di) + '.');
  };

  /* ------------------------------------------------ Aderência e efetividade */
  const formAd = document.getElementById('painel-ad');
  const corpo = document.getElementById('aderencia-corpo');
  pr.aderencia.forEach((a) => {
    const id = DS.normaliza(a.tipo).replace(/\s+/g, '-');
    const inp = (campo, valor, label, extra) => h('td', { class: 'num' }, h('div', { class: 'field' }, h('input', Object.assign({
      class: 'input input--num input--sm', id: campo + '-' + id, name: campo + '-' + id, inputmode: 'decimal', 'data-mask': 'decimal', required: true,
      'data-tipo': a.tipo, 'data-campo': campo, 'data-label': label + ' de ' + a.tipo, 'aria-label': label + ' de ' + a.tipo, value: campo === 'ano' ? String(valor) : fmt.decimal(valor)
    }, extra || {}))));
    corpo.appendChild(h('tr', null, h('th', { scope: 'row', text: a.tipo }),
      inp('excedente', a.excedente, 'Sinistro excedente (%)', { 'data-rules': 'percent' }),
      inp('captura', a.captura, 'Captura de economia (%)', { 'data-rules': 'percent' }),
      inp('ano', a.ano, 'Ano de criação do modelo', { 'data-rules': 'ano', 'data-mask': 'digits', maxlength: '4', inputmode: 'numeric' })));
  });
  formAd.efetPPA.value = fmt.decimal(pr.efetividadePPA);
  formAd.efetDemais.value = fmt.decimal(pr.efetividadeDemais);
  DS.applyMasks(formAd);
  const sujoAd = DS.guardDirty(formAd);

  formAd.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = DS.validateForm(formAd, {
      extra(add) {
        const ppa = DS.parseMoney(formAd.efetPPA.value);
        const dem = DS.parseMoney(formAd.efetDemais.value);
        if (ppa !== null && dem !== null && ppa > dem) add(formAd.efetPPA, 'A efetividade de PPA costuma ser menor que a dos demais. Confira os valores.');
      }
    });
    if (!ok) return;
    const antesN = totalNegociada();
    const antesI = totalImplantada();
    DS.$$('input[data-tipo]', formAd).forEach((el) => {
      const a = pr.aderencia.find((x) => x.tipo === el.dataset.tipo);
      a[el.dataset.campo] = el.dataset.campo === 'ano' ? Number(el.value) : DS.parseMoney(el.value);
    });
    pr.efetividadePPA = DS.parseMoney(formAd.efetPPA.value);
    pr.efetividadeDemais = DS.parseMoney(formAd.efetDemais.value);
    M.db.save();
    sujoAd.clean();
    avisaImpacto(antesN, antesI, 'Premissas salvas.');
  });

  /* --------------------------------------------------------------- Inflação */
  DS.crud({
    container: document.getElementById('inflacao'),
    db: M.db,
    colecao: 'inflacao',
    singular: 'mês', plural: 'meses', novo: 'Cadastrar índice do mês',
    arquivo: 'inflacao.csv',
    rotulo: (r) => fmt.competencia(r.mes),
    busca: ['mes'],
    sortKey: 'mes',
    campos: [
      { key: 'mes', label: 'Mês', tipo: 'month', required: true, span: 4, placeholder: 'AAAA-MM' },
      { key: 'ipca', label: 'IPCA no mês', tipo: 'decimal', required: true, sufixo: '%', span: 4, rules: 'positivo' },
      { key: 'vcmh', label: 'Variação do custo médico', tipo: 'decimal', required: true, sufixo: '%', span: 4, rules: 'positivo' }
    ],
    colunas: [
      { key: 'mes', label: 'Mês', sort: true, render: (r) => fmt.competencia(r.mes), csv: (r) => r.mes },
      { key: 'ipca', label: 'IPCA', num: true, sort: true, render: (r) => fmt.decimal(r.ipca) + '%', csv: (r) => fmt.decimal(r.ipca) },
      { key: 'fator', label: 'Fator IPCA', num: true, render: (r) => (1 + r.ipca / 100).toFixed(4).replace('.', ','), csv: (r) => (1 + r.ipca / 100).toFixed(4).replace('.', ',') },
      { key: 'vcmh', label: 'Custo médico', num: true, sort: true, render: (r) => fmt.decimal(r.vcmh) + '%', csv: (r) => fmt.decimal(r.vcmh) }
    ],
    unicos: [{ keys: ['mes'], msg: 'Esse mês já tem índice. Edite o registro existente.' }],
    validar: (d, add) => {
      if (d.mes && d.mes > DS.hoje().slice(0, 7)) add('mes', 'Só dá para cadastrar índices de meses que já começaram.');
      if (d.ipca !== null && d.ipca > 5) add('ipca', 'Um IPCA acima de 5% ao mês é improvável. Confira se não faltou a vírgula.');
    }
  });
  // A lista da inflação começa pelos meses mais recentes.
  const sortMes = document.querySelector('#inflacao [data-sort="mes"]');
  if (sortMes) sortMes.click();

  /* ------------------------------------------------------------------ Prazos */
  const formPz = document.getElementById('painel-pz');
  ['intervaloCobranca', 'semAtualizacao', 'ateBloqueio', 'fecharImplantar'].forEach((k) => { formPz[k].value = pr[k]; });
  const sujoPz = DS.guardDirty(formPz);
  formPz.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!DS.validateForm(formPz)) return;
    const antes = M.db.all('negociacoes').filter(M.bloqueioSugerido).length;
    ['intervaloCobranca', 'semAtualizacao', 'ateBloqueio', 'fecharImplantar'].forEach((k) => { pr[k] = Number(formPz[k].value); });
    M.db.save();
    sujoPz.clean();
    const depois = M.db.all('negociacoes').filter(M.bloqueioSugerido).length;
    DS.toast('Prazos salvos. Negociações candidatas a bloqueio: ' + antes + ' → ' + depois + '.');
  });

  DS.tabs(document.getElementById('abas'));
  DS.pronto('Premissas');
})();
