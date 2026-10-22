/* Orla Esteira: nova ficha de aditivo em 4 etapas. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  const u = E.shell({ ativo: 'nova' });
  if (!u) return;

  const form = document.getElementById('ficha-form');
  const passos = DS.$$('[data-passo]', form);
  const botoesPasso = DS.$$('.step-btn');
  const voltar = document.getElementById('voltar');
  const continuar = document.getElementById('continuar');
  const sujo = DS.guardDirty(form);
  let atual = 0;
  let maximo = 0;
  const aditivos = [];
  const anexo = [];

  /* ------------------------------------------------------ Passo 1: prestador */
  const sel = form.prestador;
  R.prestadores.slice().sort((a, b) => a.nome.localeCompare(b.nome)).forEach((p) => sel.appendChild(h('option', { value: p.codigo, text: p.nome + ' (' + p.codigo + ')' })));
  DS.selectOptions(form.empresa, R.empresas, 'Selecione');
  form.empresa.options[0].textContent = 'Selecione';
  const fatos = document.getElementById('prestador-fatos');
  const prima = document.getElementById('prio-prima');
  function pintaPrestador() {
    const p = R.prestador(sel.value);
    if (!p) { DS.fill(fatos); fatos.hidden = true; return; }
    const fato = (dt, dd) => h('div', null, h('dt', { text: dt }), h('dd', { text: dd }));
    DS.fill(fatos, fato('CNPJ', p.cnpj), fato('Cidade', p.cidade + ' / ' + p.uf), fato('Sucursal', R.sucursalNome(p.sucursal)), fato('Rede', p.rede), fato('Faturamento anual', fmt.money(p.faturamentoAnual)));
    fatos.hidden = false;
    prima.disabled = p.rede !== 'Rede Prima';
    if (prima.disabled && prima.checked) { prima.checked = false; }
    document.getElementById('prio-dica').textContent = p.rede === 'Rede Prima' ? 'Esse prestador é da Rede Prima: a prioridade Rede Prima pede o anexo de valores na etapa 4.' : 'A prioridade Rede Prima só vale para prestadores da Rede Prima.';
  }
  sel.addEventListener('change', pintaPrestador);

  /* ---------------------------------------------------- Passo 3: aditivos */
  DS.selectOptions(form.adTipo, E.db.all('tiposAditivo').filter((t) => !t.fim || t.fim >= DS.hoje()).map((t) => t.descricao), 'Selecione');
  form.adTipo.options[0].textContent = 'Selecione';
  DS.selectOptions(form.adEmpresa, R.empresas, 'Selecione');
  form.adEmpresa.options[0].textContent = 'Selecione';
  const listaAd = document.getElementById('aditivos-lista');
  const subAd = document.getElementById('sub-aditivo');

  function pintaAditivos() {
    if (!aditivos.length) {
      DS.fill(listaAd, h('li', { class: 'muted' }, 'Nenhum aditivo ainda. Inclua pelo menos um.'));
      return;
    }
    DS.fill(listaAd, aditivos.map((a, i) => h('li', null,
      h('div', null, h('strong', { text: a.tipo }), h('span', { class: 'cell-sub', text: a.forma + ' · ' + a.empresa + (a.descricao ? ' · ' + a.descricao : '') })),
      h('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'aria-label': 'Remover ' + a.tipo, onClick: () => { aditivos.splice(i, 1); pintaAditivos(); DS.announce('Aditivo removido. ' + fmt.plural(aditivos.length, 'aditivo', 'aditivos') + ' na ficha.'); form.adTipo.focus(); } }, icon('trash'), 'Remover'))));
  }
  document.getElementById('incluir-aditivo').addEventListener('click', () => {
    const forma = form.querySelector('input[name="adForma"]:checked');
    const ok = DS.validateForm(subAd, {
      extra(add) {
        if (!forma) add(form.querySelector('input[name="adForma"]'), 'Escolha se o aditivo é novo ou um reajuste.');
        if (form.adTipo.value && forma && aditivos.some((a) => a.tipo === form.adTipo.value && a.forma === forma.value && a.empresa === form.adEmpresa.value)) add(form.adTipo, 'Esse aditivo já está na ficha.');
      }
    });
    if (!ok) return;
    aditivos.push({ tipo: form.adTipo.value, forma: forma.value, empresa: form.adEmpresa.value, descricao: form.adDescricao.value.trim() });
    form.adTipo.value = '';
    form.adDescricao.value = '';
    forma.checked = false;
    DS.clearErrors(form);
    pintaAditivos();
    DS.announce('Aditivo incluído. ' + fmt.plural(aditivos.length, 'aditivo', 'aditivos') + ' na ficha.');
    form.adTipo.focus();
  });

  /* ----------------------------------------------- Passo 4: anexo e revisão */
  DS.selectOptions(form.anEspecialidade, E.ESPECIALIDADES, 'Selecione');
  form.anEspecialidade.options[0].textContent = 'Selecione';
  const listaAn = document.getElementById('anexo-lista');
  const subAn = document.getElementById('sub-anexo');
  function pintaAnexo() {
    DS.fill(listaAn, anexo.length ? anexo.map((a, i) => h('li', null,
      h('div', null, h('strong', { text: a.especialidade }), h('span', { class: 'cell-sub', text: fmt.money(a.valor) })),
      h('button', { type: 'button', class: 'btn btn--ghost btn--sm', 'aria-label': 'Remover ' + a.especialidade, onClick: () => { anexo.splice(i, 1); pintaAnexo(); form.anEspecialidade.focus(); } }, icon('trash'), 'Remover')))
      : h('li', { class: 'muted' }, 'Nenhum valor ainda.'));
  }
  document.getElementById('incluir-anexo').addEventListener('click', () => {
    const ok = DS.validateForm(subAn, { extra: (add) => { if (anexo.some((a) => a.especialidade === form.anEspecialidade.value)) add(form.anEspecialidade, 'Essa especialidade já está no anexo.'); } });
    if (!ok) return;
    anexo.push({ especialidade: form.anEspecialidade.value, valor: DS.parseMoney(form.anValor.value) });
    form.anEspecialidade.value = '';
    form.anValor.value = '';
    pintaAnexo();
    DS.announce('Valor incluído no anexo.');
    form.anEspecialidade.focus();
  });

  const ehPrima = () => (form.querySelector('input[name="prioridade"]:checked') || {}).value === 'Rede Prima';
  function pintaRevisao() {
    document.getElementById('bloco-anexo').hidden = !ehPrima();
    const p = R.prestador(sel.value);
    const fato = (dt, dd) => h('div', null, h('dt', { text: dt }), h('dd', { text: dd }));
    const prio = form.querySelector('input[name="prioridade"]:checked');
    const tipo = form.querySelector('input[name="tipo"]:checked');
    const exclusiva = form.querySelector('input[name="exclusiva"]:checked');
    DS.fill(document.getElementById('revisao'),
      fato('Prestador', p ? p.nome : '—'), fato('Tipo de ficha', tipo ? tipo.value : '—'), fato('Prioridade', prio ? prio.value : '—'), fato('Empresa', form.empresa.value || '—'),
      fato('Data da proposta', fmt.date(form.dataProposta.value) || '—'), fato('Alçada', form.alcada.value || '—'), fato('Exclusiva', exclusiva ? exclusiva.value : '—'),
      fato('Aditivos', fmt.plural(aditivos.length, 'aditivo', 'aditivos')));
  }

  /* ------------------------------------------------------------ Navegação */
  form.dataProposta.max = DS.hoje();

  function validaPasso(i) {
    const bloco = passos[i];
    return DS.validateForm(bloco, {
      resumoTitulo: 'Para continuar, confira estes pontos:',
      extra(add) {
        if (i === 1) {
          const d = form.dataProposta.value;
          if (d && d > DS.hoje()) add(form.dataProposta, 'A proposta não pode ter data no futuro.');
          else if (d && DS.diasEntre(d, DS.hoje()) > 180) add(form.dataProposta, 'Propostas com mais de 6 meses precisam ser renovadas antes de abrir a ficha.');
          if (form.justificativa.value.trim() && form.justificativa.value.trim().length < 30) add(form.justificativa, 'Conte um pouco mais: a justificativa ajuda o comitê a decidir (mínimo de 30 caracteres).');
        }
        if (i === 2 && !aditivos.length) add(form.adTipo, 'Inclua pelo menos um aditivo na ficha.');
        if (i === 3 && ehPrima() && !anexo.length) add(form.anEspecialidade, 'Fichas da Rede Prima precisam de pelo menos um valor no anexo.');
      }
    });
  }

  // A validação de cada passo não deve olhar os subformulários de inclusão.
  [subAd, subAn].forEach((s) => DS.$$('input, select, textarea', s).forEach((el) => { el.dataset.sub = '1'; }));
  function semSub(fn) {
    const subs = DS.$$('[data-sub]', form);
    subs.forEach((el) => { el.dataset.novalidate = '1'; });
    const r = fn();
    subs.forEach((el) => { delete el.dataset.novalidate; });
    return r;
  }

  function vaiPara(i, foco) {
    atual = i;
    maximo = Math.max(maximo, i);
    passos.forEach((p, k) => { p.hidden = k !== i; });
    botoesPasso.forEach((b, k) => {
      b.disabled = k > maximo;
      b.classList.toggle('is-done', k < maximo && k !== i);
      if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    voltar.hidden = i === 0;
    DS.fill(continuar, i === passos.length - 1 ? [icon('check'), 'Criar ficha'] : ['Continuar', icon('arrow-right')]);
    if (i === 3) pintaRevisao();
    document.title = 'Passo ' + (i + 1) + ' de 4: ' + passos[i].dataset.titulo + ' | Orla Esteira';
    if (foco) {
      const t = passos[i].querySelector('h2');
      t.setAttribute('tabindex', '-1');
      t.focus();
    }
  }

  botoesPasso.forEach((b, k) => b.addEventListener('click', () => {
    if (k > atual && !semSub(() => validaPasso(atual))) return;
    vaiPara(k, true);
  }));
  voltar.addEventListener('click', () => vaiPara(atual - 1, true));

  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    if (!semSub(() => validaPasso(atual))) return;
    if (atual < passos.length - 1) { vaiPara(atual + 1, true); return; }
    criar();
  });

  function criar() {
    const p = R.prestador(sel.value);
    const prioridade = form.querySelector('input[name="prioridade"]:checked').value;
    const lista = E.db.all('fichas');
    const ano = DS.hoje().slice(0, 4);
    const maior = lista.reduce((m, x) => Math.max(m, Number(x.numero.slice(-5))), 1200);
    const distribuidor = E.pessoasDa('Distribuição').find((x) => x.equipe === 'Distribuição');
    const nova = E.db.insert('fichas', {
      numero: 'FA-' + ano + '-' + String(maior + 1).padStart(5, '0'),
      tipo: form.querySelector('input[name="tipo"]:checked').value,
      prestador: p.codigo,
      empresa: form.empresa.value,
      sucursal: p.sucursal,
      prioridade,
      etapa: 'aguardando-distribuicao',
      responsavel: distribuidor.matricula,
      emissor: '',
      criadaEm: DS.hoje(),
      entrouEm: DS.hoje(),
      concluidaEm: null,
      solicitante: u.nome,
      negociacao: { dataProposta: form.dataProposta.value, alcada: form.alcada.value, exclusiva: form.querySelector('input[name="exclusiva"]:checked').value === 'Sim' },
      justificativa: form.justificativa.value.trim(),
      faturamentoAnual: p.faturamentoAnual,
      aditivos: aditivos.slice(),
      anexoPrima: prioridade === 'Rede Prima' ? anexo.slice() : [],
      movimentos: [{ etapa: 'aguardando-distribuicao', de: DS.hoje(), ate: null, quem: distribuidor.matricula, nota: 'Ficha criada por ' + u.nome + '.' }],
      devolucoes: 0,
      historico: []
    });
    sujo.clean();
    DS.flash('Ficha ' + nova.numero + ' criada e na fila de distribuição.');
    window.location.href = 'ficha.html?id=' + nova.id;
  }

  DS.applyMasks(form);
  pintaAditivos();
  pintaAnexo();
  vaiPara(0);
  DS.pronto();
  document.title = 'Passo 1 de 4: Prestador | Orla Esteira';
})();
