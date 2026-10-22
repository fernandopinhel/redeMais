/* Orla Mesa: lista de negociações e a ficha aberta, com economia calculada ao vivo. */
(function () {
  'use strict';

  const M = window.MESA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  const u = M.shell({ ativo: 'mesa' });
  if (!u) return;

  const negs = () => M.db.all('negociacoes');
  const busca = document.getElementById('busca');
  const fTipo = document.getElementById('f-tipo');
  const fSit = document.getElementById('f-situacao');
  const lista = document.getElementById('deals');
  const contagem = document.getElementById('deals-info');

  DS.selectOptions(fTipo, M.TIPOS, 'Todos os tipos');
  DS.selectOptions(fSit, ['Em negociação', 'Sem atualização', 'Negociação concluída', 'Aditivo implantado', 'Bloqueada'], 'Todas');
  const memo = DS.lembrarFiltros(document.getElementById('lista-filtros'), 'mesa');
  memo.restore();

  let atual = M.db.get('negociacoes', DS.param('id'));

  function filtrados() {
    const termo = DS.normaliza(busca.value);
    return negs().filter((n) => {
      if (termo && DS.normaliza(M.nomePrestador(n.prestador) + ' ' + n.prestador + ' ' + n.grupo + ' ' + n.pp).indexOf(termo) < 0) return false;
      if (fTipo.value && n.tipo !== fTipo.value) return false;
      if (fSit.value && M.situacao(n).t !== fSit.value) return false;
      return true;
    }).sort((a, b) => M.nomePrestador(a.prestador).localeCompare(M.nomePrestador(b.prestador)));
  }

  function pintaLista() {
    const linhas = filtrados();
    contagem.textContent = fmt.plural(linhas.length, 'negociação', 'negociações') + (linhas.length === negs().length ? '' : ' com os filtros');
    DS.fill(lista, linhas.length ? linhas.map((n) => h('li', null, h('a', {
      class: 'deal',
      href: 'mesa.html?id=' + n.id,
      'aria-current': atual && atual.id === n.id ? 'true' : null
    },
    h('span', { class: 'deal__top' }, h('span', { class: 'mono', text: 'PP ' + n.pp }), h('span', { text: n.tipo })),
    h('strong', { text: M.nomePrestador(n.prestador) }),
    h('span', { class: 'deal__sub', text: n.grupo }),
    h('span', { class: 'deal__tags' }, M.situacaoBadge(n), n.ppa ? DS.badge('PPA', 'signal', true) : null))))
      : h('li', { class: 'empty' }, icon('search'), h('strong', { text: 'Nada encontrado' }), h('p', { text: 'Ajuste a busca ou os filtros.' })));
  }
  [busca, fTipo, fSit].forEach((el) => el.addEventListener(el === busca ? 'input' : 'change', () => { memo.save(); pintaLista(); DS.announce(contagem.textContent + '.'); }));

  pintaLista();
  if (!atual) {
    atual = filtrados()[0] || negs()[0];
    if (atual) window.history.replaceState(null, '', 'mesa.html?id=' + atual.id);
    pintaLista();
  }
  const sel = lista.querySelector('[aria-current="true"]');
  if (sel) sel.scrollIntoView({ block: 'nearest' });

  /* ------------------------------------------------------------------ Ficha */
  const n = atual;
  const p = R.prestador(n.prestador);
  const form = document.getElementById('ficha');
  const sujo = DS.guardDirty(form);
  const alc = M.alcadaDe(n);
  const fato = (dt, dd) => h('div', null, h('dt', { text: dt }), h('dd', { text: dd }));

  DS.fill(document.getElementById('cabecalho'),
    h('div', null,
      h('span', { class: 'eyebrow' }, icon('handshake'), n.tipo + ' · ' + n.macro),
      h('h1', { id: 'pagina-titulo', text: p.nome }),
      h('div', { class: 'cluster' }, M.situacaoBadge(n), DS.badge('PP ' + n.pp, '', true), DS.badge(p.rede, 'signal', true), n.ppa ? DS.badge('PPA', 'signal', true) : null)),
    h('div', { class: 'btn-row' },
      h('button', { type: 'button', class: 'btn ' + (n.bloqueado ? '' : 'btn--danger'), id: 'bloqueio' }, icon(n.bloqueado ? 'lock-open' : 'lock'), n.bloqueado ? 'Desbloquear prestador' : 'Bloquear prestador')));

  if (M.bloqueioSugerido(n)) {
    document.getElementById('aviso').appendChild(h('div', { class: 'alert alert--warning' }, icon('alert'), h('div', { class: 'alert__body' },
      h('p', { class: 'alert__title', text: 'Sem atualização há ' + fmt.dias(DS.diasEntre(n.atualizadoEm, DS.hoje())) + '.' }),
      h('p', { text: 'Pelas premissas, negociações paradas há mais de ' + M.premissas().semAtualizacao + ' dias são candidatas a bloqueio do prestador para esse pacote.' }))));
  } else if (n.bloqueado) {
    document.getElementById('aviso').appendChild(h('div', { class: 'alert alert--error' }, icon('lock'), h('div', { class: 'alert__body' },
      h('p', { class: 'alert__title', text: 'Prestador bloqueado para este pacote.' }),
      h('p', { text: n.motivoBloqueio || 'Novas autorizações do pacote seguem para outros prestadores da região.' }))));
  }

  DS.fill(document.getElementById('identificacao'),
    fato('Código do prestador', p.codigo), fato('Cidade', p.cidade + ' / ' + p.uf), fato('Sucursal', R.sucursalNome(p.sucursal)),
    fato('Cluster', p.cluster), fato('Qualidade', p.qualidade), fato('Grupo do pacote', n.grupo),
    fato('Responsável', (R.pessoa(n.responsavel) || { nome: '—' }).nome), fato('Última atualização', fmt.date(n.atualizadoEm)));

  // Lista prioritária
  const ano = DS.hoje().slice(0, 4);
  const lst = document.getElementById('lista-prioritaria');
  ['t1', 't2', 't3', 't4'].forEach((t, i) => lst.appendChild(h('label', { class: 'switch' }, h('input', { type: 'checkbox', name: 'lista-' + t, checked: n.lista[t] }), (i + 1) + 'º tri/' + ano)));
  const elegivel = alc && n.base.cm > alc.matriz;
  document.getElementById('elegivel').textContent = elegivel
    ? 'Elegível: o custo médio (' + fmt.money(n.base.cm) + ') passa da alçada da matriz (' + fmt.money(alc.matriz) + ').'
    : 'Não elegível: o custo médio está dentro da alçada da matriz.';

  // Sinistro antes e depois
  DS.dataTable({
    container: document.getElementById('sinistro'),
    caption: 'Sinistro, senhas e custo médio antes e depois do pacote',
    paginate: false,
    compact: true,
    rows: [
      { id: 1, periodo: '12 meses mais recentes', senhas: n.base.senhas, cm: n.base.cm, mes: fmt.competencia(n.base.mesCM) },
      { id: 2, periodo: '12 meses antes do pacote', senhas: n.prePP.senhas, cm: n.prePP.cm, mes: '—' }
    ],
    columns: [
      { key: 'periodo', label: 'Período' },
      { key: 'senhas', label: 'Senhas', num: true, render: (r) => fmt.int(r.senhas) },
      { key: 'cm', label: 'Custo médio', num: true, render: (r) => fmt.money(r.cm) },
      { key: 'sin', label: 'Sinistro', num: true, render: (r) => fmt.money(r.senhas * r.cm) },
      { key: 'mes', label: 'Último mês do custo' }
    ]
  });

  DS.fill(document.getElementById('alcadas'),
    fato('Alçada da sucursal', alc ? fmt.money(alc.sucursal) : 'Sem alçada'), fato('Alçada da matriz', alc ? fmt.money(alc.matriz) : 'Sem alçada'),
    fato('Referência', alc ? alc.cluster + ', qualidade ' + alc.qualidade : '—'));

  // Valores e datas
  const campos = ['valorNegociado', 'dataProposta', 'dataNegociacao', 'envioAditivo', 'assinatura', 'implantacao', 'comentarios'];
  const el = {};
  campos.forEach((c) => { el[c] = form.querySelector('[name="' + c + '"]'); });
  el.valorNegociado.value = n.valorNegociado ? fmt.decimal(n.valorNegociado) : '';
  ['dataProposta', 'dataNegociacao', 'envioAditivo', 'assinatura', 'implantacao'].forEach((c) => { el[c].value = n[c] || ''; el[c].max = DS.hoje(); });
  el.comentarios.value = n.comentarios || '';
  const diretoria = form.querySelector('[name="diretoria"]');
  diretoria.checked = !!n.aprovadoDiretoria;
  const blocoDiretoria = document.getElementById('bloco-diretoria');
  const statusAlcada = document.getElementById('status-alcada');

  function pintaAlcada() {
    const v = DS.parseMoney(el.valorNegociado.value);
    blocoDiretoria.hidden = !(alc && v && v > alc.matriz);
    if (!v || !alc) { statusAlcada.textContent = 'Informe o valor para ver em qual alçada ele cai.'; return; }
    statusAlcada.textContent = v <= alc.sucursal ? 'Dentro da alçada da sucursal: aprovação local.'
      : v <= alc.matriz ? 'Acima da alçada da sucursal: precisa da aprovação da matriz.'
        : 'Acima da alçada da matriz: precisa do aval da diretoria.';
  }

  // Funil de economia
  const funil = document.getElementById('funil');
  function pintaFunil() {
    const v = DS.parseMoney(el.valorNegociado.value);
    const c = M.calcular(Object.assign({}, n, { implementado: !!el.implantacao.value }), v || null);
    DS.fill(funil,
      h('li', null, h('span', { text: 'Potencial' }), h('strong', { text: fmt.money(c.potencial) }), h('small', { text: 'Se o preço caísse até a alçada' })),
      h('li', null, h('span', { text: 'Negociada' }), h('strong', { text: fmt.money(c.negociada) }), h('small', { text: 'Com o valor acordado e a efetividade' })),
      h('li', null, h('span', { text: 'Implantada' }), h('strong', { text: fmt.money(c.implantada) }), h('small', { text: el.implantacao.value ? 'Aditivo implantado' : 'Conta depois da implantação' })));
  }
  form.addEventListener('input', () => { pintaAlcada(); pintaFunil(); });
  form.addEventListener('change', () => { pintaAlcada(); pintaFunil(); });

  document.getElementById('memoria').addEventListener('click', () => {
    const v = DS.parseMoney(el.valorNegociado.value);
    const c = M.calcular(Object.assign({}, n, { implementado: !!el.implantacao.value }), v || null);
    DS.dialog({
      titulo: 'Memória de cálculo',
      icone: 'calculator',
      wide: true,
      somenteOk: true,
      confirmar: 'Fechar',
      descricao: p.nome + ', ' + n.grupo + '. Os percentuais vêm das premissas e podem ser ajustados lá.',
      montar(corpo) {
        corpo.appendChild(h('ol', { class: 'calc' }, c.passos.map((s) => h('li', { class: s.r ? 'is-result' : '' },
          h('span', { class: 'calc__what' }, h('span', { text: s.o }), h('small', { text: s.d })),
          h('span', { class: 'calc__value', text: s.v })))));
      }
    });
  });

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const datas = ['dataProposta', 'dataNegociacao', 'envioAditivo', 'assinatura', 'implantacao'];
    const ok = DS.validateForm(form, {
      extra(add) {
        const v = DS.parseMoney(el.valorNegociado.value);
        if (el.valorNegociado.value.trim() && (v === null || v <= 0)) add(el.valorNegociado, 'Use um valor maior que zero, por exemplo 18.500,00.');
        if (el.dataNegociacao.value && !v) add(el.valorNegociado, 'Com a data da negociação preenchida, informe o valor negociado.');
        if (v && alc && v > alc.matriz && !diretoria.checked) add(diretoria, 'O valor passa da alçada da matriz. Marque quando a diretoria tiver aprovado.');
        let anterior = null;
        datas.forEach((c) => {
          const d = el[c].value;
          if (!d) return;
          if (d > DS.hoje()) add(el[c], 'Essa data não pode estar no futuro.');
          else if (anterior && d < el[anterior].value) add(el[c], 'Essa data precisa ser depois de "' + el[anterior].dataset.label + '".');
          anterior = c;
        });
        if (el.implantacao.value && !el.assinatura.value) add(el.assinatura, 'Para registrar a implantação, informe antes a assinatura do aditivo.');
        if (el.envioAditivo.value && !el.dataNegociacao.value) add(el.dataNegociacao, 'O aditivo só é enviado depois da negociação. Informe a data.');
      }
    });
    if (!ok) return;
    const v = DS.parseMoney(el.valorNegociado.value);
    n.valorNegociado = v || null;
    datas.forEach((c) => { n[c] = el[c].value || null; });
    n.comentarios = el.comentarios.value.trim();
    n.aprovadoDiretoria = diretoria.checked;
    ['t1', 't2', 't3', 't4'].forEach((t) => { n.lista[t] = form.querySelector('[name="lista-' + t + '"]').checked; });
    const antes = M.situacao(n).t;
    n.concluida = !!(n.dataNegociacao && n.valorNegociado);
    n.implementado = !!n.implantacao;
    n.atualizadoEm = DS.hoje();
    M.db.save();
    sujo.clean();
    const depois = M.situacao(n).t;
    DS.flash(antes !== depois ? 'Negociação salva. Situação: ' + depois.toLowerCase() + '.' : 'Negociação salva.');
    window.location.reload();
  });

  document.getElementById('bloqueio').addEventListener('click', async () => {
    if (n.bloqueado) {
      const ok = await DS.confirmDialog({ titulo: 'Desbloquear ' + p.nome + '?', descricao: 'O prestador volta a receber autorizações deste pacote.', confirmar: 'Desbloquear' });
      if (!ok) return;
      n.bloqueado = false;
      n.motivoBloqueio = '';
      n.atualizadoEm = DS.hoje();
      M.db.save();
      DS.flash('Prestador desbloqueado para o pacote.');
      window.location.reload();
      return;
    }
    const motivo = await DS.dialog({
      titulo: 'Bloquear ' + p.nome + ' para este pacote?',
      icone: 'lock',
      tom: 'danger',
      tomBotao: 'danger',
      confirmar: 'Bloquear',
      descricao: 'Novas autorizações de "' + n.grupo + '" deixam de ir para esse prestador. O bloqueio vale em ' + M.premissas().ateBloqueio + ' dias, prazo das premissas.',
      montar(c) { c.appendChild(DS.field({ id: 'b-motivo', label: 'Motivo do bloqueio', tipo: 'textarea', required: true, max: 300, rows: 3 })); },
      aoConfirmar(f) { return DS.validateForm(f) ? f.querySelector('#b-motivo').value.trim() : false; }
    });
    if (!motivo) return;
    n.bloqueado = true;
    n.motivoBloqueio = motivo + ' Bloqueio efetivo em ' + fmt.date(DS.somaDias(DS.hoje(), M.premissas().ateBloqueio)) + '.';
    n.atualizadoEm = DS.hoje();
    M.db.save();
    DS.flash('Prestador bloqueado para o pacote.');
    window.location.reload();
  });

  DS.applyMasks(form);
  pintaAlcada();
  pintaFunil();
  DS.pronto(p.nome);
})();
