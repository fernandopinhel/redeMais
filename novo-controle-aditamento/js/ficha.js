/* Orla Esteira: dossiê da ficha, com as ações de cada etapa. */
(function () {
  'use strict';

  const E = window.ESTEIRA;
  const { h, icon, fmt } = DS;
  const R = window.REDE;
  const u = E.shell({ ativo: 'esteira' });
  if (!u) return;

  const main = document.getElementById('conteudo');
  const f = E.db.get('fichas', DS.param('id'));
  if (!f) {
    DS.fill(main, DS.breadcrumbs([{ label: 'Esteira', href: 'esteira.html' }, { label: 'Ficha não encontrada' }]),
      h('div', { class: 'empty' }, icon('search'), h('h1', { text: 'Não encontramos essa ficha' }), h('p', { text: 'Ela pode ter sido criada em outra aba. Os dados do protótipo ficam só na aba atual.' }), h('a', { class: 'btn btn--primary', href: 'esteira.html' }, 'Voltar para a esteira')));
    DS.pronto('Ficha não encontrada');
    return;
  }
  const p = R.prestador(f.prestador);

  // Manutenção só com reajustes não passa pelo comitê.
  const precisaComite = () => f.tipo === 'Credenciamento' || f.aditivos.some((a) => a.forma === 'Novo') || f.negociacao.exclusiva;
  function proximaDe(chave) {
    let prox = E.proxima(chave);
    if (prox && prox.chave === 'comite' && !precisaComite()) prox = E.proxima('comite');
    return prox;
  }

  /* ----------------------------------------------------------- Cabeçalho */
  document.getElementById('trilha').replaceWith(DS.breadcrumbs([{ label: 'Esteira', href: 'esteira.html' }, { label: f.numero }]));
  const atualIdx = f.etapa === 'concluida' ? E.ETAPAS.length : E.ETAPAS.findIndex((e) => e.chave === (f.etapa === 'devolvida' ? f.devolvidaDe : f.etapa));
  const track = h('ol', { class: 'track', 'aria-label': 'Etapas da ficha' });
  E.ETAPAS.forEach((et, i) => {
    const pulada = et.chave === 'comite' && !precisaComite();
    const estado = i < atualIdx ? 'is-done' : i === atualIdx ? 'is-now' : '';
    track.appendChild(h('li', { class: estado, 'aria-current': i === atualIdx ? 'step' : null },
      et.nome + (pulada ? ' (não se aplica)' : ''),
      h('span', { class: 'visually-hidden', text: i < atualIdx ? ', concluída' : i === atualIdx ? ', etapa atual' : ', a fazer' })));
  });
  DS.fill(document.getElementById('cabecalho'),
    h('div', { class: 'page-head' },
      h('div', { class: 'page-head__text' },
        h('span', { class: 'eyebrow' }, icon('file'), 'Ficha ' + f.numero),
        h('h1', { id: 'pagina-titulo', text: p.nome }),
        h('div', { class: 'cluster' }, E.prioBadge(f.prioridade), DS.badge(f.tipo, '', true), DS.badge(f.empresa, '', true), E.clock(f)))),
    track);

  /* --------------------------------------------------------------- Resumo */
  const fato = (dt, dd) => h('div', null, h('dt', { text: dt }), h('dd', { text: dd }));
  DS.fill(document.getElementById('fatos-prestador'),
    fato('Código', p.codigo), fato('CNPJ', p.cnpj), fato('Cidade', p.cidade + ' / ' + p.uf), fato('Sucursal', R.sucursalNome(p.sucursal)),
    fato('Rede', p.rede), fato('Faturamento anual', fmt.money(f.faturamentoAnual)));
  DS.fill(document.getElementById('fatos-negociacao'),
    fato('Data da proposta', fmt.date(f.negociacao.dataProposta)), fato('Alçada', f.negociacao.alcada),
    fato('Negociação exclusiva', f.negociacao.exclusiva ? 'Sim' : 'Não'), fato('Solicitante', f.solicitante),
    fato('Criada em', fmt.date(f.criadaEm)), fato('Emissor', E.nomePessoa(f.emissor)));
  document.getElementById('justificativa').textContent = f.justificativa;

  DS.dataTable({
    container: document.getElementById('aditivos'),
    caption: 'Aditivos da ficha',
    paginate: false,
    rows: f.aditivos,
    columns: [
      { key: 'tipo', label: 'Tipo de aditivo' },
      { key: 'forma', label: 'Forma', render: (a) => DS.badge(a.forma, a.forma === 'Novo' ? 'accent' : '', true) },
      { key: 'empresa', label: 'Empresa' },
      { key: 'descricao', label: 'Descrição' }
    ]
  });

  const anexo = document.getElementById('anexo');
  if (!f.anexoPrima.length) {
    DS.fill(anexo, h('div', { class: 'empty' }, icon('info'), h('strong', { text: 'Sem anexo da Rede Prima' }), h('p', { text: 'O anexo só existe para fichas com prioridade Rede Prima.' })));
  } else {
    DS.dataTable({
      container: anexo,
      caption: 'Valores negociados por especialidade na Rede Prima',
      paginate: false,
      rows: f.anexoPrima,
      columns: [{ key: 'especialidade', label: 'Especialidade' }, { key: 'valor', label: 'Valor do pacote', num: true, render: (a) => fmt.money(a.valor) }],
      footer: (l) => h('tfoot', null, h('tr', null, h('th', { scope: 'row', text: 'Total' }), h('td', { class: 'num', text: fmt.money(l.reduce((s, a) => s + a.valor, 0)) })))
    });
  }

  // Linha do tempo: etapas percorridas e eventos (devoluções, trocas).
  const eventos = f.movimentos.map((m) => ({
    quando: m.de,
    titulo: E.etapa(m.etapa).nome,
    meta: E.nomePessoa(m.quem) + ' · ' + fmt.date(m.de) + (m.ate ? ' a ' + fmt.date(m.ate) + ' (' + fmt.dias(DS.diasEntre(m.de, m.ate)) + ')' : ' até agora'),
    nota: m.nota,
    atrasou: m.ate && DS.diasEntre(m.de, m.ate) > ((E.db.all('sla')[m.etapa] || {})[f.prioridade] || 99)
  })).concat((f.historico || []).map((e) => ({ quando: e.quando, titulo: e.titulo, meta: e.quem + ' · ' + fmt.date(e.quando), nota: e.nota })));
  if (f.concluidaEm) eventos.push({ quando: f.concluidaEm + 'T23:59', titulo: 'Ficha concluída', meta: 'Aditivo implantado em ' + fmt.date(f.concluidaEm) + ', ' + fmt.dias(DS.diasEntre(f.criadaEm, f.concluidaEm)) + ' depois da criação' });
  eventos.sort((a, b) => b.quando.localeCompare(a.quando));
  DS.fill(document.getElementById('linha-tempo'), eventos.map((e, i) => h('li', { class: (i === 0 ? 'is-now ' : '') + (e.atrasou ? 'is-late' : '') },
    h('p', { class: 'timeline__title' }, e.titulo, e.atrasou ? ' ' : null, e.atrasou ? DS.badge('Passou do prazo', 'danger') : null),
    h('p', { class: 'timeline__meta', text: e.meta }),
    e.nota ? h('p', { class: 'timeline__note', text: e.nota }) : null)));

  DS.tabs(document.getElementById('abas'));

  /* --------------------------------------------------------------- Ações */
  const acoes = document.getElementById('acoes');
  const salvarERecarregar = (msg) => { E.db.save(); DS.flash(msg); window.location.reload(); };
  const evento = (titulo, nota) => { f.historico = f.historico || []; f.historico.push({ quando: new Date().toISOString(), quem: u.nome, titulo, nota }); };

  function seletorPessoa(id, equipe, atual, rotulo) {
    const pessoas = E.pessoasDa(equipe);
    const carga = (m) => E.db.all('fichas').filter((x) => x.responsavel === m && x.etapa !== 'concluida').length;
    const sugerida = pessoas.slice().sort((a, b) => carga(a.matricula) - carga(b.matricula))[0];
    return DS.field({
      id,
      label: rotulo,
      tipo: 'select',
      required: true,
      valor: atual || (sugerida && sugerida.matricula),
      opcoes: pessoas.map((x) => ({ value: x.matricula, label: x.nome + ' (' + fmt.plural(carga(x.matricula), 'ficha', 'fichas') + ')' })),
      dica: 'Entre parênteses, quantas fichas cada pessoa já tem. A sugestão é quem está com menos.'
    });
  }

  function avancar() {
    const prox = proximaDe(f.etapa);
    DS.dialog({
      titulo: prox ? 'Enviar para "' + prox.nome + '"' : 'Concluir a ficha',
      icone: prox ? 'arrow-right' : 'check-circle',
      tom: prox ? '' : 'success',
      tomBotao: prox ? null : 'success',
      confirmar: prox ? 'Enviar' : 'Concluir ficha',
      descricao: prox
        ? (E.proxima(f.etapa) && E.proxima(f.etapa).chave === 'comite' && !precisaComite() ? 'Como é uma manutenção só com reajustes, a ficha pula a aprovação do comitê. ' : '') + 'A ficha sai da sua fila e o prazo da próxima etapa começa a contar hoje.'
        : 'O aditivo foi implantado no sistema. A ficha vai para as concluídas e entra no relatório de tempo total.',
      montar(c) {
        if (prox) c.appendChild(seletorPessoa('a-resp', prox.equipe, null, 'Quem cuida da próxima etapa'));
        c.appendChild(DS.field({ id: 'a-nota', label: 'Observação', tipo: 'textarea', opcional: true, max: 400, rows: 3 }));
      },
      aoConfirmar(form) {
        if (!DS.validateForm(form)) return false;
        return { resp: prox ? form.querySelector('#a-resp').value : u.matricula, nota: form.querySelector('#a-nota').value.trim() };
      }
    }).then((d) => {
      if (!d) return;
      if (prox) {
        E.mover(f, prox.chave, d.resp, d.nota);
        if (prox.chave === 'emissao') f.emissor = d.resp;
        salvarERecarregar('Ficha enviada para "' + prox.nome + '", com ' + E.nomePessoa(d.resp) + '.');
      } else {
        if (d.nota) evento('Observação na conclusão', d.nota);
        E.mover(f, 'concluida', u.matricula);
        salvarERecarregar('Ficha ' + f.numero + ' concluída em ' + fmt.dias(DS.diasEntre(f.criadaEm, DS.hoje())) + '.');
      }
    });
  }

  function devolver() {
    DS.dialog({
      titulo: 'Devolver ao solicitante',
      icone: 'undo',
      tom: 'danger',
      tomBotao: 'danger',
      confirmar: 'Devolver ficha',
      descricao: 'O relógio da etapa para. Quando o solicitante corrigir, a ficha volta para "' + E.etapa(f.etapa).nome + '".',
      montar(c) { c.appendChild(DS.field({ id: 'd-motivo', label: 'O que precisa ser corrigido', tipo: 'textarea', required: true, max: 500, rows: 4, dica: 'Seja específico: isso vai por e-mail para ' + f.solicitante + '.' })); },
      aoConfirmar(form) {
        const m = form.querySelector('#d-motivo');
        const ok = DS.validateForm(form, { extra: (add) => { if (m.value.trim() && m.value.trim().length < 15) add(m, 'Explique um pouco mais, para o solicitante saber o que corrigir.'); } });
        return ok ? m.value.trim() : false;
      }
    }).then((motivo) => {
      if (!motivo) return;
      f.devolvidaDe = f.etapa;
      f.motivoDevolucao = motivo;
      f.devolucoes = (f.devolucoes || 0) + 1;
      evento('Devolvida ao solicitante', motivo);
      E.mover(f, 'devolvida', f.responsavel);
      salvarERecarregar('Ficha devolvida para ' + f.solicitante + '.');
    });
  }

  function retomar() {
    DS.dialog({
      titulo: 'Retomar a ficha',
      confirmar: 'Retomar',
      descricao: 'Use quando o solicitante tiver enviado a correção. A ficha volta para "' + E.etapa(f.devolvidaDe).nome + '" com o prazo zerado.',
      montar(c) { c.appendChild(DS.field({ id: 'r-nota', label: 'O que foi corrigido', tipo: 'textarea', required: true, max: 400, rows: 3 })); },
      aoConfirmar(form) { return DS.validateForm(form) ? form.querySelector('#r-nota').value.trim() : false; }
    }).then((nota) => {
      if (!nota) return;
      const volta = f.devolvidaDe;
      evento('Correção recebida', nota);
      E.mover(f, volta, f.responsavel, 'Retomada após correção.');
      delete f.devolvidaDe;
      salvarERecarregar('Ficha de volta para "' + E.etapa(volta).nome + '".');
    });
  }

  function trocar() {
    const et = E.etapa(f.etapa);
    DS.dialog({
      titulo: 'Trocar o responsável',
      confirmar: 'Trocar',
      montar(c) {
        c.appendChild(seletorPessoa('t-resp', et.equipe, f.responsavel, 'Novo responsável'));
        c.appendChild(DS.field({ id: 't-just', label: 'Justificativa', tipo: 'textarea', required: true, max: 300, rows: 3, dica: 'Ex.: férias, redistribuição de carga.' }));
      },
      aoConfirmar(form) {
        const sel = form.querySelector('#t-resp');
        const ok = DS.validateForm(form, { extra: (add) => { if (sel.value === f.responsavel) add(sel, 'Escolha uma pessoa diferente da atual.'); } });
        return ok ? { resp: sel.value, just: form.querySelector('#t-just').value.trim() } : false;
      }
    }).then((d) => {
      if (!d) return;
      evento('Responsável trocado: ' + E.nomePessoa(f.responsavel) + ' para ' + E.nomePessoa(d.resp), d.just);
      f.responsavel = d.resp;
      const aberto = f.movimentos[f.movimentos.length - 1];
      if (aberto && !aberto.ate) aberto.quem = d.resp;
      if (et.fase === 'emissao') f.emissor = d.resp;
      salvarERecarregar('Agora a ficha está com ' + E.nomePessoa(d.resp) + '.');
    });
  }

  const btn = (txt, ic, classe, fn) => h('button', { type: 'button', class: 'btn ' + (classe || ''), onClick: fn }, icon(ic), txt);
  let conteudoAcoes;
  if (f.etapa === 'concluida') {
    conteudoAcoes = [h('h2', { text: 'Ficha concluída' }), h('p', { class: 'muted', text: 'Implantada em ' + fmt.date(f.concluidaEm) + '. Tempo total: ' + fmt.dias(DS.diasEntre(f.criadaEm, f.concluidaEm)) + '.' })];
  } else if (f.etapa === 'devolvida') {
    conteudoAcoes = [
      h('h2', { text: 'Devolvida ao solicitante' }),
      h('div', { class: 'alert alert--warning' }, icon('undo'), h('div', { class: 'alert__body' }, h('p', { class: 'alert__title', text: 'Motivo' }), h('p', { text: f.motivoDevolucao }))),
      h('div', { class: 'stack-sm' }, btn('Retomar a ficha', 'refresh', 'btn--primary', retomar))];
  } else {
    const prox = proximaDe(f.etapa);
    const rel = E.relogio(f);
    conteudoAcoes = [
      h('h2', { text: E.etapa(f.etapa).nome }),
      h('p', { class: 'muted', text: 'Com ' + E.nomePessoa(f.responsavel) + ' desde ' + fmt.date(f.entrouEm) + '. Prazo desta etapa: ' + fmt.dias(rel.prazo) + ' para ' + f.prioridade + '.' }),
      h('div', { class: 'stack-sm' },
        btn(prox ? 'Enviar para "' + prox.nome + '"' : 'Concluir ficha', prox ? 'arrow-right' : 'check', 'btn--primary', avancar),
        btn('Trocar o responsável', 'swap', '', trocar),
        btn('Devolver ao solicitante', 'undo', 'btn--danger', devolver))];
  }
  DS.fill(acoes, conteudoAcoes);

  DS.pronto('Ficha ' + f.numero);
})();
