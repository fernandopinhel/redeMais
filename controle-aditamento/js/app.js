/*
 * Orla Placar: dados de exemplo, regras de cálculo e estrutura das telas.
 * Acompanha as negociações de aditivos por tipo (quimioterapia, ambulatório,
 * materiais e medicamentos, diária global) contra as metas de cada trimestre.
 */
(function () {
  'use strict';

  DS.app({ chave: 'placar' });
  const { h, icon, fmt, hoje, somaDias, trimestre } = DS;

  const TIPOS = ['Quimioterapia', 'Ambulatório', 'Materiais e medicamentos', 'Diária global'];
  const ICONE_TIPO = { 'Quimioterapia': 'stethoscope', 'Ambulatório': 'hospital', 'Materiais e medicamentos': 'package', 'Diária global': 'calendar' };
  const STATUS = ['Em negociação', 'Aguardando assinatura', 'Finalizada', 'Sem acordo'];
  const TOM_STATUS = { 'Em negociação': 'info', 'Aguardando assinatura': 'warning', 'Finalizada': 'success', 'Sem acordo': '' };

  const GRUPOS = {
    'Quimioterapia': ['Protocolo de mama', 'Protocolo de pulmão', 'Protocolo colorretal', 'Imunoterapia'],
    'Ambulatório': ['Histerossalpingografia', 'Endoscopia digestiva', 'Colonoscopia', 'Densitometria óssea', 'Ecocardiograma'],
    'Materiais e medicamentos': ['Materiais de consumo', 'Medicamentos de uso restrito', 'Taxa de comercialização'],
    'Diária global': ['Enfermaria', 'Apartamento', 'UTI adulto', 'UTI neonatal']
  };
  const ITENS = {
    'Quimioterapia': ['Aplicação de quimioterapia venosa', 'Sessão de imunoterapia', 'Taxa de sala de infusão', 'Consulta oncológica', 'Aplicação subcutânea'],
    'Ambulatório': ['Exame simples', 'Exame com sedação', 'Exame com biópsia', 'Laudo complementar', 'Taxa de sala'],
    'Materiais e medicamentos': ['Fios de sutura', 'Cateteres venosos', 'Antibióticos de amplo espectro', 'Contraste iodado', 'Curativos especiais'],
    'Diária global': ['Diária de enfermaria', 'Diária de apartamento', 'Diária de UTI', 'Taxa de sala cirúrgica', 'Diária de observação']
  };
  const FAIXAS = {
    'Quimioterapia': { cm: [1800, 9000], freq: [12, 180] },
    'Ambulatório': { cm: [120, 900], freq: [80, 1200] },
    'Materiais e medicamentos': { cm: [15, 600], freq: [200, 4800] },
    'Diária global': { cm: [600, 4200], freq: [50, 900] }
  };

  const R = window.REDE;
  const negociadores = R.pessoas.filter((p) => p.perfis.placar);

  /* --------------------------------------------------------------- Cálculos */

  const sinistro = (n) => n.itens.reduce((s, i) => s + i.freq * i.cm, 0);
  const economia = (n) => n.itens.reduce((s, i) => s + (i.novo !== null && i.novo !== undefined ? i.freq * (i.cm - i.novo) : 0), 0);
  const eficiencia = (n) => { const s = sinistro(n); return s ? economia(n) / s : 0; };
  const noTrimestre = (iso, t, ano) => { if (!iso) return false; const q = trimestre(iso); return q.t === t && q.ano === ano; };

  function inicioTrimestre(t, ano) { return ano + '-' + String((t - 1) * 3 + 1).padStart(2, '0') + '-01'; }
  function fimTrimestre(t, ano) {
    const prox = t === 4 ? (ano + 1) + '-01-01' : ano + '-' + String(t * 3 + 1).padStart(2, '0') + '-01';
    return somaDias(prox, -1);
  }
  function trimestreAnterior(t, ano, n) {
    let tt = t;
    let aa = ano;
    for (let i = 0; i < (n === undefined ? 1 : n); i++) { tt -= 1; if (tt === 0) { tt = 4; aa -= 1; } }
    return { t: tt, ano: aa };
  }

  /* ------------------------------------------------------- Dados de exemplo */

  function gerar() {
    const r = DS.rand(4815);
    const hj = hoje();
    const atual = trimestre(hj);
    const negociacoes = [];

    for (let i = 0; i < 280; i++) {
      const p = R.prestadores[i % R.prestadores.length];
      const tipo = TIPOS[(i + r.int(0, 3)) % 4];
      const faixa = FAIXAS[tipo];
      const recente = i < 12; // garante movimento no trimestre atual
      const idade = recente ? r.int(25, 110) : r.int(10, 560);
      const inicio = somaDias(hj, -idade);
      const nomes = ITENS[tipo].slice().sort(() => r.next() - .5).slice(0, r.int(2, 4));
      const itens = nomes.map((d) => ({
        codigo: String(8 * 10000000 + r.int(1000000, 9999999)),
        descricao: d,
        freq: r.int(faixa.freq[0], faixa.freq[1]),
        cm: r.money(faixa.cm[0], faixa.cm[1]),
        novo: null
      }));
      const fimBase = inicio.slice(0, 7);
      const neg = {
        prestador: p.codigo,
        tipo,
        listado: r.chance(.8),
        grupo: r.pick(GRUPOS[tipo]),
        periodoBase: { ini: somaDias(fimBase + '-01', -365).slice(0, 7), fim: somaDias(fimBase + '-01', -1).slice(0, 7) },
        itens,
        inicio,
        status: 'Em negociação',
        dataNegociacao: null,
        dataAssinatura: null,
        responsavel: r.pick(negociadores).matricula,
        observacao: '',
        atualizadoEm: inicio,
        historico: [{ quando: inicio + 'T09:30:00', quem: 'Importação da base', texto: 'Negociação aberta a partir da base de sinistro.' }]
      };

      let fechou = false;
      if (recente) {
        const ini = inicioTrimestre(atual.t, atual.ano);
        const espaco = Math.max(0, DS.diasEntre(ini, hj));
        neg.dataAssinatura = somaDias(ini, r.int(0, espaco));
        neg.dataNegociacao = somaDias(neg.dataAssinatura, -r.int(6, 28));
        fechou = i % 5 !== 0;
        if (!fechou) neg.dataAssinatura = null;
      } else if (idade > 35 && r.chance(.78)) {
        neg.dataNegociacao = somaDias(inicio, r.int(8, Math.min(idade - 10, 80)));
        const assina = somaDias(neg.dataNegociacao, r.int(5, 48));
        if (assina <= hj) neg.dataAssinatura = assina;
        fechou = true;
      }
      if (fechou || neg.dataNegociacao) {
        itens.forEach((it) => { it.novo = Math.round(it.cm * (1 - (.03 + r.next() * .16)) * 100) / 100; });
        neg.status = neg.dataAssinatura ? 'Finalizada' : 'Aguardando assinatura';
        neg.historico.push({ quando: neg.dataNegociacao + 'T15:10:00', quem: R.pessoa(neg.responsavel).nome, texto: 'Valores acordados com o prestador.' });
        if (neg.dataAssinatura) neg.historico.push({ quando: neg.dataAssinatura + 'T11:00:00', quem: R.pessoa(neg.responsavel).nome, texto: 'Aditivo assinado. Economia passa a contar no placar.' });
        neg.atualizadoEm = neg.dataAssinatura || neg.dataNegociacao;
      } else if (idade > 120 && r.chance(.3)) {
        neg.status = 'Sem acordo';
        neg.atualizadoEm = somaDias(inicio, r.int(30, 90));
        neg.historico.push({ quando: neg.atualizadoEm + 'T10:00:00', quem: R.pessoa(neg.responsavel).nome, texto: 'Prestador recusou a proposta. Negociação encerrada sem acordo.' });
      } else if (idade > 150) {
        neg.status = 'Sem acordo';
        neg.atualizadoEm = somaDias(inicio, r.int(40, 120));
        neg.historico.push({ quando: neg.atualizadoEm + 'T10:00:00', quem: R.pessoa(neg.responsavel).nome, texto: 'Sem retorno do prestador. Negociação encerrada sem acordo.' });
      } else if (r.chance(.5)) {
        neg.atualizadoEm = somaDias(inicio, Math.min(idade, r.int(3, 40)));
        neg.historico.push({ quando: neg.atualizadoEm + 'T14:20:00', quem: R.pessoa(neg.responsavel).nome, texto: 'Proposta enviada ao prestador.' });
      }
      negociacoes.push(Object.assign({ id: i + 1 }, neg));
    }

    // Metas: tomam como base o realizado de cada trimestre, com folga para mais ou para menos.
    const metas = [];
    let id = 1;
    const realizadoEm = (tipo, suc, t, ano) => negociacoes
      .filter((n) => n.tipo === tipo && n.status === 'Finalizada' && noTrimestre(n.dataAssinatura, t, ano) && R.prestador(n.prestador).sucursal === suc)
      .reduce((s, n) => s + economia(n), 0);
    for (let k = 5; k >= -1; k--) {
      const q = k >= 0 ? trimestreAnterior(atual.t, atual.ano, k) : (atual.t === 4 ? { t: 1, ano: atual.ano + 1 } : { t: atual.t + 1, ano: atual.ano });
      TIPOS.forEach((tipo) => {
        R.sucursais.forEach((s) => {
          let base;
          if (k >= 1) base = realizadoEm(tipo, s.sigla, q.t, q.ano) * (.82 + r.next() * .45);
          else {
            const media = [1, 2, 3].reduce((acc, j) => { const qq = trimestreAnterior(atual.t, atual.ano, j); return acc + realizadoEm(tipo, s.sigla, qq.t, qq.ano); }, 0) / 3;
            base = media * (1.05 + r.next() * .2);
          }
          const valor = Math.max(15000, Math.round(base / 1000) * 1000);
          metas.push({ id: id++, tipo, t: q.t, ano: q.ano, sucursal: s.sigla, valor, criadoPor: 'Gustavo Pires Damasceno' });
        });
      });
    }

    const reajustes = R.prestadores.map((p, i) => {
      const mes = String(p.reajusteMes).padStart(2, '0');
      const anoProx = Number(hj.slice(5, 7)) <= p.reajusteMes ? atual.ano : atual.ano + 1;
      return {
        id: i + 1,
        codigo: p.codigo,
        proximo: anoProx + '-' + mes,
        ultimo: (anoProx - 1) + '-' + mes,
        indice: ['IPCA', 'IGP-M', 'Livre negociação'][i % 3],
        percentual: Math.round((3 + r.next() * 5) * 100) / 100
      };
    });

    const usuario = R.pessoas[0].nome;
    const importacoes = Array.from({ length: 7 }, (_, i) => {
      const data = somaDias(hj, -(i * 23 + r.int(1, 9)));
      const tipo = TIPOS[i % 4];
      const avisos = i % 3 === 1 ? r.int(1, 4) : 0;
      return {
        id: i + 1,
        protocolo: 'IMP-' + data.replace(/-/g, '').slice(2) + '-' + String(r.int(100, 999)),
        quando: data + 'T' + String(r.int(8, 18)).padStart(2, '0') + ':' + String(r.int(10, 59)) + ':00',
        arquivo: 'base-' + DS.normaliza(tipo).replace(/\s+/g, '-') + '-v' + (7 - i) + '.xlsx',
        tipo,
        usuario,
        versao: 'v' + (7 - i),
        atualizados: r.int(6, 42),
        inconsistencias: Array.from({ length: avisos }, (__, j) => ({
          aba: r.pick(R.sucursais).nome,
          linha: r.int(4, 180),
          texto: ['Código de prestador não encontrado na rede.', 'Frequência zerada para um item com custo.', 'Período base com mais de 12 meses.', 'Valor de custo médio com letras.'][j % 4]
        }))
      };
    });

    const avisos = [
      { id: 1, nome: 'Coordenação de rede RJ', email: 'rede.rj@orla.example', sucursal: 'RJ', evento: 'Meta do trimestre atingida' },
      { id: 2, nome: 'Gestão de aditivos', email: 'aditivos@orla.example', sucursal: '', evento: 'Negociação parada há 30 dias' },
      { id: 3, nome: 'Coordenação Nordeste', email: 'rede.nordeste@orla.example', sucursal: 'NE1', evento: 'Importação com inconsistências' },
      { id: 4, nome: 'Diretoria de rede', email: 'diretoria.rede@orla.example', sucursal: '', evento: 'Fechamento do trimestre' },
      { id: 5, nome: 'Coordenação Sul', email: 'rede.sul@orla.example', sucursal: 'SUL', evento: 'Meta do trimestre atingida' }
    ];

    return { negociacoes, metas, reajustes, importacoes, avisos, congelamentos: [] };
  }

  const db = DS.createDb(gerar);

  /* -------------------------------------------------- Temporada (trimestre) */

  function temporada() { return DS.store.get('temporada', trimestre(hoje())); }
  function setTemporada(q) {
    DS.store.set('temporada', q);
    document.dispatchEvent(new CustomEvent('temporada', { detail: q }));
  }

  function realizado(filtro) {
    const f = filtro || {};
    return db.all('negociacoes').filter((n) => n.status === 'Finalizada' &&
      noTrimestre(n.dataAssinatura, f.t, f.ano) &&
      (!f.tipo || n.tipo === f.tipo) &&
      (!f.sucursal || R.prestador(n.prestador).sucursal === f.sucursal))
      .reduce((s, n) => s + economia(n), 0);
  }
  function meta(filtro) {
    const f = filtro || {};
    return db.all('metas').filter((m) => m.t === f.t && m.ano === f.ano && (!f.tipo || m.tipo === f.tipo) && (!f.sucursal || m.sucursal === f.sucursal))
      .reduce((s, m) => s + m.valor, 0);
  }

  // Proporção do trimestre já decorrida (para o ritmo esperado).
  function ritmo(t, ano) {
    const ini = inicioTrimestre(t, ano);
    const fim = fimTrimestre(t, ano);
    const hj = hoje();
    if (hj < ini) return 0;
    if (hj > fim) return 1;
    return (DS.diasEntre(ini, hj) + 1) / (DS.diasEntre(ini, fim) + 1);
  }

  const statusBadge = (s) => DS.badge(s, TOM_STATUS[s]);
  const nomePrestador = (codigo) => (R.prestador(codigo) || { nome: 'Prestador ' + codigo }).nome;

  /* ------------------------------------------------------------- Estrutura */

  const NAV = [
    { chave: 'placar', href: 'placar.html', label: 'Placar', icone: 'trophy' },
    { chave: 'negociacoes', href: 'negociacoes.html', label: 'Negociações', icone: 'handshake' },
    { chave: 'metas', href: 'metas.html', label: 'Metas', icone: 'target' },
    { chave: 'reajustes', href: 'reajustes.html', label: 'Reajustes', icone: 'calendar' },
    { chave: 'relatorios', href: 'relatorios.html', label: 'Relatórios', icone: 'chart' },
    { chave: 'importacoes', href: 'importacoes.html', label: 'Importações', icone: 'upload' },
    { chave: 'avisos', href: 'avisos.html', label: 'Avisos', icone: 'send' }
  ];

  function shell(op) {
    const u = DS.requireLogin();
    if (!u) return null;

    const header = document.querySelector('.app-header');
    const main = document.getElementById('conteudo');
    const rodape = document.querySelector('.app-foot');

    const navId = 'menu-principal';
    const abrir = h('button', { type: 'button', class: 'btn btn--ghost btn--icon app-header__menu', 'aria-label': 'Abrir menu', 'aria-controls': navId }, icon('menu'));
    const fechar = h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': 'Fechar menu' }, icon('x'));
    const lista = h('ul');
    NAV.forEach((it) => lista.appendChild(h('li', null, h('a', { href: it.href, 'aria-current': it.chave === op.ativo ? 'page' : null }, icon(it.icone), it.label))));
    const nav = h('nav', { class: 'app-nav', id: navId, 'aria-label': 'Menu principal' },
      h('div', { class: 'app-nav__head' }, DS.brand(), fechar),
      lista);

    // Faixa da temporada: escolher o trimestre vale para o placar, metas e relatórios.
    const q = temporada();
    const atual = trimestre(hoje());
    const grupo = h('fieldset', { class: 'segmented' }, h('legend', { text: 'Trimestre' }));
    [1, 2, 3, 4].forEach((t) => {
      const inp = h('input', { type: 'radio', name: 'temporada-t', value: String(t), checked: q.t === t });
      inp.addEventListener('change', () => setTemporada({ t, ano: Number(ano.value) }));
      grupo.appendChild(h('label', null, inp, t + 'º tri'));
    });
    const anoId = DS.uid('ano');
    const ano = h('select', { class: 'select', id: anoId });
    [atual.ano - 1, atual.ano, atual.ano + 1].forEach((a) => ano.appendChild(h('option', { value: String(a), text: String(a), selected: a === q.ano })));
    ano.addEventListener('change', () => setTemporada({ t: Number(grupo.querySelector('input:checked').value), ano: Number(ano.value) }));
    const relogio = h('p', { class: 'season__clock', 'aria-live': 'polite' });
    const atualizaRelogio = () => {
      const s = temporada();
      const fim = fimTrimestre(s.t, s.ano);
      const ini = inicioTrimestre(s.t, s.ano);
      relogio.replaceChildren();
      if (hoje() > fim) relogio.append('Trimestre encerrado em ', h('strong', { text: fmt.date(fim) }), '.');
      else if (hoje() < ini) relogio.append('Trimestre começa em ', h('strong', { text: fmt.date(ini) }), '.');
      else relogio.append('Faltam ', h('strong', { text: fmt.dias(DS.diasEntre(hoje(), fim)) }), ' para fechar o trimestre.');
    };
    atualizaRelogio();
    document.addEventListener('temporada', atualizaRelogio);

    const season = h('div', { class: 'season' }, h('div', { class: 'season__in' },
      h('span', { class: 'season__label' }, icon('flag'), 'Trimestre em foco'),
      grupo,
      h('label', { class: 'visually-hidden', for: anoId, text: 'Ano' }), ano,
      relogio));

    DS.fill(header, 
      h('div', { class: 'app-header__bar' },
        DS.brand(),
        nav,
        h('div', { class: 'app-header__end' }, DS.appSwitcher(), DS.userBox(u), abrir)),
      op.semTemporada ? null : season);

    DS.drawer({ painel: nav, abrir, fechar, fundo: [main, rodape], mq: '(min-width: 1101px)', rotulo: 'Menu principal' });
    if (rodape) DS.caseNote(rodape, db);
    return u;
  }

  window.PLACAR = {
    db, TIPOS, GRUPOS, ICONE_TIPO, STATUS, TOM_STATUS, NAV,
    sinistro, economia, eficiencia, noTrimestre, inicioTrimestre, fimTrimestre, trimestreAnterior,
    temporada, setTemporada, realizado, meta, ritmo, statusBadge, nomePrestador, shell
  };

  if (document.getElementById('login-form')) DS.loginPage();
})();
