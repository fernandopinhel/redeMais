/* Orla Esteira: matriz de prazos (SLA) por etapa e prioridade. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  if (!E.shell({ ativo: 'prazos' })) return;

  const form = document.getElementById('prazos-form');
  const corpo = document.getElementById('prazos-corpo');
  const previa = document.getElementById('previa');
  const sujo = DS.guardDirty(form);
  const tabela = E.db.all('sla');

  E.ETAPAS.forEach((et) => {
    const tr = h('tr', null, h('th', { scope: 'row' }, et.nome, h('span', { class: 'cell-sub', text: 'Equipe de ' + et.equipe.toLowerCase() })));
    E.PRIORIDADES.forEach((p) => {
      const id = 'sla-' + et.chave + '-' + DS.normaliza(p).replace(/\s+/g, '-');
      tr.appendChild(h('td', { class: 'num' }, h('div', { class: 'field' },
        h('input', { class: 'input input--num input--sm', type: 'number', id, name: id, min: '1', max: '60', step: '1', required: true, inputmode: 'numeric', value: String(tabela[et.chave][p]), 'data-etapa': et.chave, 'data-prio': p, 'data-label': et.nome + ', ' + p, 'aria-label': et.nome + ', ' + p + ', em dias' }))));
    });
    corpo.appendChild(tr);
  });

  const ler = () => {
    const nova = {};
    DS.$$('input[data-etapa]', form).forEach((el) => {
      nova[el.dataset.etapa] = nova[el.dataset.etapa] || {};
      nova[el.dataset.etapa][el.dataset.prio] = Number(el.value);
    });
    return nova;
  };

  // Prévia: quantas fichas mudam de situação com os prazos digitados.
  function pintaPrevia() {
    const nova = ler();
    const abertas = E.db.all('fichas').filter((f) => E.ETAPAS.some((e) => e.chave === f.etapa));
    let entram = 0;
    let saem = 0;
    abertas.forEach((f) => {
      const usados = DS.diasEntre(f.entrouEm, DS.hoje());
      const antes = usados > tabela[f.etapa][f.prioridade];
      const depois = usados > (nova[f.etapa][f.prioridade] || 0);
      if (!antes && depois) entram += 1;
      if (antes && !depois) saem += 1;
    });
    const atrasadasHoje = abertas.filter((f) => DS.diasEntre(f.entrouEm, DS.hoje()) > tabela[f.etapa][f.prioridade]).length;
    DS.fill(previa,
      h('p', null, h('strong', { text: 'Hoje: ' }), fmt.plural(atrasadasHoje, 'ficha fora do prazo', 'fichas fora do prazo') + '.'),
      entram || saem
        ? h('p', { text: 'Com os prazos digitados, ' + (entram ? fmt.plural(entram, 'ficha passa', 'fichas passam') + ' a ficar fora do prazo' : '') + (entram && saem ? ' e ' : '') + (saem ? fmt.plural(saem, 'ficha volta', 'fichas voltam') + ' para dentro do prazo' : '') + '.' })
        : h('p', { text: 'Os prazos digitados não mudam a situação de nenhuma ficha aberta.' }));
  }
  form.addEventListener('input', pintaPrevia);

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const ok = DS.validateForm(form, {
      extra(add) {
        E.ETAPAS.forEach((et) => {
          const prima = form.querySelector('[data-etapa="' + et.chave + '"][data-prio="Rede Prima"]');
          const normal = form.querySelector('[data-etapa="' + et.chave + '"][data-prio="Normal"]');
          if (Number(prima.value) > Number(normal.value)) add(prima, 'Em "' + et.nome + '", o prazo da Rede Prima não pode ser maior que o da prioridade Normal.');
        });
        DS.$$('input[data-etapa]', form).forEach((el) => { if (el.value && !/^\d+$/.test(el.value)) add(el, 'Use um número inteiro de dias em "' + el.dataset.label + '".'); });
      }
    });
    if (!ok) return;
    const nova = ler();
    Object.keys(nova).forEach((k) => { tabela[k] = nova[k]; });
    E.db.save();
    sujo.clean();
    pintaPrevia();
    DS.toast('Prazos salvos. O quadro já usa os novos valores.');
  });

  document.getElementById('restaurar-prazos').addEventListener('click', async () => {
    const ok = await DS.confirmDialog({ titulo: 'Voltar aos prazos padrão?', descricao: 'Os valores da tabela voltam ao padrão da operação. Nada é salvo até você clicar em "Salvar prazos".', confirmar: 'Voltar ao padrão' });
    if (!ok) return;
    const padrao = { 'aguardando-distribuicao': [1, 2, 3], 'conferencia': [2, 3, 5], 'emissao': [3, 5, 8], 'comite': [5, 7, 10], 'assinatura': [7, 10, 15], 'via-fisica': [5, 7, 10], 'implantacao': [2, 3, 5] };
    DS.$$('input[data-etapa]', form).forEach((el) => { el.value = padrao[el.dataset.etapa][E.PRIORIDADES.indexOf(el.dataset.prio)]; });
    sujo.mark();
    pintaPrevia();
    DS.announce('Valores padrão preenchidos. Salve para aplicar.');
  });

  pintaPrevia();
  DS.pronto('Prazos');
})();
