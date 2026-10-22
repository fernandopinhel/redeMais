/*
 * Orla Mesa: dados de exemplo, cálculo de economia e estrutura das telas.
 * A mesa reúne as negociações de pacotes de procedimentos (PPs) com os
 * prestadores da Rede Prima: valores, alçadas, datas do aditivo e economia.
 */
(function () {
  'use strict';

  DS.app({ chave: 'mesa' });
  const { h, icon, fmt, hoje, somaDias } = DS;
  const R = window.REDE;

  const MACROS = {
    'Coluna': ['Artrodese', 'Descompressão'],
    'Ortopedia': ['Artroplastia de joelho', 'Lesão de tendão do ombro'],
    'Urologia': ['Ureterorrenolitotripsia', 'Prostatectomia'],
    'Otorrino': ['Timpanomastoidectomia', 'Septoplastia'],
    'Aparelho digestivo': ['Colecistectomia', 'Hernioplastia'],
    'Ginecologia': ['Histerectomia', 'Miomectomia'],
    'Hemodinâmica': ['Angioplastia', 'Cateterismo'],
    'Buco-maxilo': ['Cirurgia ortognática', 'Fratura de mandíbula']
  };
  const TIPOS = Object.keys(MACROS);
  const BASE_PRECO = { 'Coluna': 38000, 'Ortopedia': 26000, 'Urologia': 14000, 'Otorrino': 9000, 'Aparelho digestivo': 11000, 'Ginecologia': 12500, 'Hemodinâmica': 21000, 'Buco-maxilo': 17000 };
  const FATOR_CLUSTER = [1.12, 1, .93, .86];

  /* ------------------------------------------------------- Dados de exemplo */

  function gerar() {
    const r = DS.rand(9031);
    const hj = hoje();

    const pps = [];
    TIPOS.forEach((tipo) => MACROS[tipo].forEach((macro) => {
      ['com UTI', 'sem UTI'].forEach((v, k) => {
        if (tipo !== 'Coluna' && tipo !== 'Hemodinâmica' && k === 0 && r.chance(.5)) return;
        pps.push({ id: pps.length + 1, codigo: String(84500000 + r.int(10000, 99999)), tipo, macro, grupo: macro + ' ' + v, nome: macro + ' ' + v + ' (pacote)', ano: r.pick([2016, 2017, 2018]) });
      });
    }));

    const alcadas = [];
    TIPOS.forEach((tipo) => MACROS[tipo].forEach((macro) => R.clusters.forEach((cluster, ci) => ['1 e 2', '3 e 4'].forEach((q) => {
      const base = BASE_PRECO[tipo] * (macro === MACROS[tipo][1] ? .8 : 1) * FATOR_CLUSTER[ci] * (q === '1 e 2' ? 1.06 : 1);
      const suc = Math.round(base / 50) * 50;
      alcadas.push({ id: alcadas.length + 1, tipo, macro, cluster, rede: 'Rede Prima', qualidade: q, sucursal: suc, matriz: Math.round(suc * 1.11 / 50) * 50 });
    }))));

    // Inflação: 24 meses até o mês atual
    const inflacao = [];
    for (let k = 23; k >= 0; k--) {
      const d = new Date(hj.slice(0, 7) + '-15T12:00:00');
      d.setMonth(d.getMonth() - k);
      const ipca = Math.round((.18 + r.next() * .42) * 100) / 100;
      inflacao.push({ id: 24 - k, mes: d.toISOString().slice(0, 7), ipca, vcmh: Math.round((ipca + .3 + r.next() * .4) * 100) / 100 });
    }

    const premissas = {
      efetividadePPA: 70,
      efetividadeDemais: 90,
      aderencia: [
        ['Aparelho digestivo', 6.5, 50, 2017], ['Coluna', 16, 50, 2016], ['Ginecologia', 17.1, 50, 2017], ['Hemodinâmica', 11.35, 50, 2017],
        ['Urologia', 1.3, 80, 2016], ['Buco-maxilo', 11.35, 50, 2016], ['Otorrino', 3.6, 70, 2017], ['Ortopedia', 4.9, 50, 2017]
      ].map(([tipo, excedente, captura, ano]) => ({ tipo, excedente, captura, ano })),
      intervaloCobranca: 7,
      semAtualizacao: 90,
      ateBloqueio: 60,
      fecharImplantar: 46
    };

    const negociacoes = [];
    const negociadores = R.pessoas.filter((p) => p.perfis.mesa);
    R.prestadores.forEach((p, i) => {
      const qtd = p.rede === 'Rede Prima' ? r.int(2, 3) : (i % 3 === 0 ? 1 : 0);
      for (let k = 0; k < qtd; k++) {
        const pp = pps[(i * 3 + k * 5) % pps.length];
        const ci = Math.max(0, R.clusters.indexOf(p.cluster));
        const ref = alcadas.find((a) => a.macro === pp.macro && a.cluster === p.cluster && a.qualidade === p.qualidade);
        const cm = Math.round(ref.sucursal * (.92 + r.next() * .55));
        const senhas = r.int(6, 90);
        const inicio = somaDias(hj, -r.int(15, 300));
        const etapa = r.next();
        const concluida = etapa > .35;
        const implementado = concluida && etapa > .6;
        const valorNegociado = concluida ? Math.round(Math.min(cm * (.82 + r.next() * .14), ref.matriz * (.9 + r.next() * .2)) / 10) * 10 : null;
        const mesCM = somaDias(hj, -r.int(35, 140)).slice(0, 7);
        const dataNeg = concluida ? somaDias(inicio, r.int(10, 60)) : null;
        const n = {
          id: negociacoes.length + 1,
          prestador: p.codigo,
          tipo: pp.tipo,
          macro: pp.macro,
          grupo: pp.grupo,
          pp: pp.codigo,
          ppa: r.chance(.3),
          lista: { t1: r.chance(.3), t2: r.chance(.4), t3: r.chance(.4), t4: r.chance(.5) },
          base: { senhas, cm, mesCM, sinistro: senhas * cm },
          prePP: { senhas: Math.round(senhas * (.8 + r.next() * .4)), cm: Math.round(cm * (.9 + r.next() * .2)) },
          valorNegociado,
          dataProposta: inicio,
          dataNegociacao: dataNeg && dataNeg < hj ? dataNeg : null,
          envioAditivo: concluida ? somaDias(inicio, r.int(61, 80)) : null,
          assinatura: implementado ? somaDias(inicio, r.int(81, 100)) : null,
          implantacao: implementado ? somaDias(inicio, r.int(101, 130)) : null,
          concluida,
          implementado,
          bloqueado: false,
          responsavel: r.pick(negociadores).matricula,
          atualizadoEm: implementado ? somaDias(inicio, 130) : concluida ? somaDias(inicio, r.int(60, 120)) : somaDias(inicio, r.int(0, 40)),
          comentarios: ''
        };
        ['envioAditivo', 'assinatura', 'implantacao', 'atualizadoEm'].forEach((c) => { if (n[c] && n[c] > hj) n[c] = c === 'atualizadoEm' ? hj : null; });
        if (n.implementado && !n.implantacao) { n.implementado = false; }
        if (!n.concluida && DS.diasEntre(n.atualizadoEm, hj) > 150 && r.chance(.6)) n.bloqueado = true;
        negociacoes.push(n);
      }
    });

    const naoListados = Array.from({ length: 14 }, (_, i) => {
      const p = R.prestadores[(i * 5) % R.prestadores.length];
      const pp = pps[(i * 7) % pps.length];
      const migrou = i % 3 === 0;
      return { id: i + 1, sucursal: p.sucursal, prestador: p.codigo, tipo: pp.tipo, ppNome: pp.nome, ppCodigo: pp.codigo, migracao: migrou ? 'Sim' : 'Não', dataMigracao: migrou ? somaDias(hj, -r.int(10, 200)) : '' };
    });
    const colunaBuco = pps.filter((p) => p.tipo === 'Coluna' || p.tipo === 'Buco-maxilo').map((p, i) => ({ id: i + 1, tipo: p.tipo, macro: p.macro, pp: p.codigo, ponderacao: [100, 70, 85, 60][i % 4], valor: null }));
    const dePara = R.prestadores.filter((p) => p.rede === 'Rede Prima').slice(0, 12).map((p, i) => ({ id: i + 1, prestador: p.codigo, grupo: ['Grupo Américas', 'Grupo Atlântico', 'Grupo Serrano', 'Independente'][i % 4], ppa: i % 4 === 3 ? 'Não' : 'Sim' }));
    const cargas = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, protocolo: 'CRG-' + String(2040 + i), quando: somaDias(hj, -(i * 31 + 3)) + 'T10:' + String(10 + i * 7) + ':00', versao: 'v' + (5 - i), arquivo: 'base-rede-prima-v' + (5 - i) + '.xlsx', usuario: R.pessoas[i % 2 === 0 ? 0 : 10].nome, linhas: r.int(180, 420), novas: r.int(2, 18) }));

    const FUNCS = ['Mesa de negociação', 'Bloquear prestador', 'Cálculo de economia', 'Premissas', 'Alçadas', 'Catálogo de pacotes', 'Carga da base', 'Acessos'];
    const perfis = [
      { id: 1, nome: 'Negociação', funcionalidades: ['Mesa de negociação', 'Cálculo de economia', 'Catálogo de pacotes'] },
      { id: 2, nome: 'Gestão de premissas', funcionalidades: ['Cálculo de economia', 'Premissas', 'Alçadas'] },
      { id: 3, nome: 'Gestão', funcionalidades: FUNCS.slice() },
      { id: 4, nome: 'Consulta', funcionalidades: ['Cálculo de economia'] }
    ];
    const usuarios = R.pessoas.filter((p) => p.perfis.mesa).map((p, i) => ({ id: i + 1, matricula: p.matricula, perfil: p.perfis.mesa === 'Gestão' ? 'Gestão' : p.perfis.mesa === 'Gestão de premissas' ? 'Gestão de premissas' : 'Negociação' }));

    return { pps, alcadas, inflacao, premissas, negociacoes, naoListados, colunaBuco, dePara, cargas, perfis, usuarios, FUNCS };
  }

  const db = DS.createDb(gerar);
  const premissas = () => db.all('premissas');

  /* --------------------------------------------------------------- Cálculos */

  function alcadaDe(n) {
    const p = R.prestador(n.prestador);
    const lista = db.all('alcadas');
    return lista.find((a) => a.macro === n.macro && a.cluster === p.cluster && a.qualidade === p.qualidade) ||
      lista.find((a) => a.macro === n.macro && a.cluster === p.cluster) || lista.find((a) => a.macro === n.macro) || null;
  }

  function fatorInflacao(mesInicial) {
    const atual = hoje().slice(0, 7);
    const meses = db.all('inflacao').slice().sort((a, b) => a.mes.localeCompare(b.mes));
    const ultimo = meses.length ? meses[meses.length - 1].ipca : 0;
    let fator = 1;
    let m = mesInicial;
    let guarda = 0;
    while (m < atual && guarda < 120) {
      const d = new Date(m + '-15T12:00:00');
      d.setMonth(d.getMonth() + 1);
      m = d.toISOString().slice(0, 7);
      const reg = meses.find((x) => x.mes === m);
      fator *= 1 + (reg ? reg.ipca : ultimo) / 100;
      guarda += 1;
    }
    return fator;
  }

  /*
   * Memória de cálculo da economia de uma negociação, passo a passo.
   * `valor` permite simular um valor negociado ainda não salvo.
   */
  function calcular(n, valor) {
    const pr = premissas();
    const ad = pr.aderencia.find((a) => a.tipo === n.tipo) || { captura: 50, excedente: 0 };
    const alc = alcadaDe(n);
    const fator = fatorInflacao(n.base.mesCM);
    const cmCorrigido = n.base.cm * fator;
    const negociado = valor !== undefined ? valor : n.valorNegociado;
    const potencial = alc ? Math.max(0, cmCorrigido - alc.sucursal) * n.base.senhas : 0;
    const efetividade = (n.ppa ? pr.efetividadePPA : pr.efetividadeDemais) / 100;
    const negociada = negociado ? Math.max(0, cmCorrigido - negociado) * n.base.senhas * efetividade : 0;
    const implantada = n.implementado ? negociada * ad.captura / 100 : 0;
    return {
      fator, cmCorrigido, alcada: alc, potencial, efetividade, negociado, negociada, captura: ad.captura / 100, implantada,
      passos: [
        { o: 'Senhas nos últimos 12 meses', d: 'Quantidade de guias do pacote no prestador', v: fmt.int(n.base.senhas) },
        { o: 'Custo médio no último mês da base', d: 'Mês do custo: ' + fmt.competencia(n.base.mesCM), v: fmt.money(n.base.cm) },
        { o: 'Inflação acumulada até hoje', d: 'IPCA mês a mês, das premissas', v: fmt.pct(fator - 1) },
        { o: 'Custo médio corrigido', d: 'Custo médio × (1 + inflação)', v: fmt.money(cmCorrigido) },
        { o: 'Alçada da sucursal', d: alc ? alc.cluster + ', qualidade ' + alc.qualidade : 'Sem alçada cadastrada', v: alc ? fmt.money(alc.sucursal) : '—' },
        { o: 'Economia potencial', d: '(Custo corrigido − alçada) × senhas', v: fmt.money(potencial), r: true },
        { o: 'Valor negociado', d: negociado ? 'Valor do pacote acordado' : 'Ainda não negociado', v: negociado ? fmt.money(negociado) : '—' },
        { o: 'Efetividade esperada', d: n.ppa ? 'Prestador com PPA' : 'Demais prestadores', v: fmt.pct(efetividade) },
        { o: 'Economia negociada', d: '(Custo corrigido − negociado) × senhas × efetividade', v: fmt.money(negociada), r: true },
        { o: 'Captura de economia', d: 'Aderência esperada para ' + n.tipo, v: fmt.pct(ad.captura / 100) },
        { o: 'Economia implantada', d: n.implementado ? 'Negociada × captura' : 'Só conta depois do aditivo implantado', v: fmt.money(implantada), r: true }
      ]
    };
  }

  // Bloqueio sugerido: negociação aberta sem atualização além do prazo das premissas.
  function bloqueioSugerido(n) {
    return !n.concluida && !n.bloqueado && DS.diasEntre(n.atualizadoEm, hoje()) > premissas().semAtualizacao;
  }

  function situacao(n) {
    if (n.bloqueado) return { t: 'Bloqueada', tom: 'danger' };
    if (n.implementado) return { t: 'Aditivo implantado', tom: 'success' };
    if (n.concluida) return { t: 'Negociação concluída', tom: 'info' };
    if (bloqueioSugerido(n)) return { t: 'Sem atualização', tom: 'warning' };
    return { t: 'Em negociação', tom: 'accent' };
  }
  const situacaoBadge = (n) => { const s = situacao(n); return DS.badge(s.t, s.tom); };
  const nomePrestador = (c) => (R.prestador(c) || { nome: c }).nome;

  /* ------------------------------------------------------------- Estrutura */

  const NAV = [
    { chave: 'mesa', href: 'mesa.html', label: 'Mesa', icone: 'handshake' },
    { chave: 'economia', href: 'economia.html', label: 'Economia', icone: 'coin' },
    { chave: 'premissas', href: 'premissas.html', label: 'Premissas', icone: 'sliders' },
    { chave: 'alcadas', href: 'alcadas.html', label: 'Alçadas', icone: 'scale' },
    { chave: 'catalogo', href: 'catalogo.html', label: 'Catálogo', icone: 'book' },
    { chave: 'carga', href: 'carga.html', label: 'Carga da base', icone: 'upload' },
    { chave: 'acessos', href: 'acessos.html', label: 'Acessos', icone: 'lock' }
  ];

  const GLOSSARIO = [
    ['PP (pacote de procedimento)', 'Preço fechado para um procedimento, com materiais e diárias incluídos.'],
    ['PPA', 'Prestador com acordo de pacotes em grupo. Tem efetividade esperada menor, porque parte do volume já é negociada pelo grupo.'],
    ['Senhas', 'Guias autorizadas do procedimento no prestador nos últimos 12 meses.'],
    ['CM (custo médio)', 'Valor médio pago por senha na base de sinistro.'],
    ['Alçada', 'Valor até onde a sucursal pode aprovar sozinha. Acima da alçada da matriz, a diretoria precisa aprovar.'],
    ['Cluster', 'Grupo de cidades com oferta de rede parecida. Muda o preço de referência.'],
    ['Lista prioritária', 'Prestadores que a gestão escolheu para negociar primeiro em cada trimestre.'],
    ['Efetividade', 'Parte da economia negociada que de fato acontece, porque nem todo volume migra para o pacote.'],
    ['Captura', 'Parte da economia negociada que aparece no sinistro depois do aditivo implantado.']
  ];

  function glossario() {
    DS.dialog({
      titulo: 'Glossário da mesa',
      icone: 'book',
      somenteOk: true,
      confirmar: 'Fechar',
      wide: true,
      montar(c) { c.appendChild(h('dl', { class: 'glossary' }, GLOSSARIO.map(([t, d]) => h('div', null, h('dt', { text: t }), h('dd', { text: d }))))); }
    });
  }

  function shell(op) {
    const u = DS.requireLogin();
    if (!u) return null;
    const top = document.querySelector('.app-top');
    const lista = h('ul');
    NAV.forEach((it) => lista.appendChild(h('li', null, h('a', { href: it.href, 'aria-current': it.chave === op.ativo ? 'page' : null }, icon(it.icone), it.label))));
    DS.fill(top,
      h('div', { class: 'app-top__bar' },
        DS.brand(),
        h('div', { class: 'app-top__end' },
          h('button', { type: 'button', class: 'btn btn--ghost btn--sm btn-glossario', onClick: glossario, 'aria-label': 'Glossário' }, icon('book'), h('span', { text: 'Glossário' })),
          DS.appSwitcher(),
          DS.userBox(u))),
      h('nav', { class: 'app-tabs', 'aria-label': 'Menu principal' }, lista));
    const rodape = document.querySelector('.app-foot');
    if (rodape) DS.caseNote(rodape, db);
    return u;
  }

  window.MESA = {
    db, TIPOS, MACROS, NAV, premissas, alcadaDe, fatorInflacao, calcular, bloqueioSugerido, situacao, situacaoBadge, nomePrestador, glossario, shell
  };

  if (document.getElementById('login-form')) DS.loginPage();
})();
