/*
 * Orla Esteira: dados de exemplo, etapas, prazos (SLA) e estrutura das telas.
 * Cada ficha de aditivo passa por distribuição, emissão, assinatura e implantação.
 * O prazo de cada etapa depende da prioridade da ficha.
 */
(function () {
  'use strict';

  DS.app({ chave: 'esteira' });
  const { h, icon, fmt, hoje, somaDias } = DS;
  const R = window.REDE;

  const FASES = [
    { chave: 'distribuicao', nome: 'Distribuição', icone: 'inbox' },
    { chave: 'emissao', nome: 'Emissão', icone: 'file' },
    { chave: 'assinatura', nome: 'Assinatura', icone: 'signature' },
    { chave: 'implantacao', nome: 'Implantação', icone: 'rocket' }
  ];
  const ETAPAS = [
    { chave: 'aguardando-distribuicao', nome: 'Aguardando distribuição', fase: 'distribuicao', equipe: 'Distribuição' },
    { chave: 'conferencia', nome: 'Em conferência', fase: 'distribuicao', equipe: 'Distribuição' },
    { chave: 'emissao', nome: 'Em emissão', fase: 'emissao', equipe: 'Emissão' },
    { chave: 'comite', nome: 'Aprovação do comitê', fase: 'emissao', equipe: 'Emissão' },
    { chave: 'assinatura', nome: 'Com o prestador para assinar', fase: 'assinatura', equipe: 'Emissão' },
    { chave: 'via-fisica', nome: 'Aguardando via física', fase: 'assinatura', equipe: 'Emissão' },
    { chave: 'implantacao', nome: 'Em implantação no sistema', fase: 'implantacao', equipe: 'Implantação' }
  ];
  const PRIORIDADES = ['Rede Prima', 'Prioridade', 'Normal'];
  const SLA_PADRAO = {
    'aguardando-distribuicao': { 'Rede Prima': 1, 'Prioridade': 2, 'Normal': 3 },
    'conferencia': { 'Rede Prima': 2, 'Prioridade': 3, 'Normal': 5 },
    'emissao': { 'Rede Prima': 3, 'Prioridade': 5, 'Normal': 8 },
    'comite': { 'Rede Prima': 5, 'Prioridade': 7, 'Normal': 10 },
    'assinatura': { 'Rede Prima': 7, 'Prioridade': 10, 'Normal': 15 },
    'via-fisica': { 'Rede Prima': 5, 'Prioridade': 7, 'Normal': 10 },
    'implantacao': { 'Rede Prima': 2, 'Prioridade': 3, 'Normal': 5 }
  };
  const TIPOS_ADITIVO = ['Pacote de radioterapia', 'Pronto-socorro', 'Diárias e taxas', 'Materiais e medicamentos', 'Honorários médicos', 'Exames de imagem', 'Terapias ambulatoriais'];
  const ESPECIALIDADES = ['Ortopedia', 'Cardiologia', 'Oncologia', 'Urologia', 'Ginecologia', 'Neurocirurgia'];

  const etapa = (chave) => ETAPAS.find((e) => e.chave === chave) || { chave, nome: chave === 'concluida' ? 'Concluída' : chave === 'devolvida' ? 'Devolvida ao solicitante' : chave, fase: chave };
  const proxima = (chave) => { const i = ETAPAS.findIndex((e) => e.chave === chave); return i >= 0 && i < ETAPAS.length - 1 ? ETAPAS[i + 1] : null; };
  const pessoasDa = (equipe) => R.pessoas.filter((p) => p.perfis.esteira && (p.equipe === equipe || p.equipe === 'Coordenação'));

  /* ------------------------------------------------------- Dados de exemplo */

  function gerar() {
    const r = DS.rand(2207);
    const hj = hoje();
    const fichas = [];
    const ano = hj.slice(0, 4);
    for (let i = 0; i < 96; i++) {
      const p = R.prestadores[(i * 7) % R.prestadores.length];
      const prioridade = r.chance(.25) ? 'Rede Prima' : r.chance(.3) ? 'Prioridade' : 'Normal';
      const concluida = i >= 60;
      const devolvida = !concluida && i % 13 === 5;
      const alvo = concluida ? ETAPAS.length : r.int(0, ETAPAS.length - 1);
      const criadaEm = somaDias(hj, -(concluida ? r.int(20, 170) : r.int(2, 40)));
      // Movimentos: uma entrada por etapa percorrida, com datas crescentes.
      const movimentos = [];
      let data = criadaEm;
      const passos = Math.min(alvo + 1, ETAPAS.length);
      for (let k = 0; k < passos; k++) {
        const et = ETAPAS[k];
        const sla = SLA_PADRAO[et.chave][prioridade];
        const quem = r.pick(pessoasDa(et.equipe));
        const ultimo = !concluida && k === passos - 1;
        const dur = ultimo ? null : Math.max(0, Math.round(sla * (.3 + r.next() * 1.3)));
        const ate = dur === null ? null : somaDias(data, dur);
        movimentos.push({ etapa: et.chave, de: data, ate: ate && ate > hj ? hj : ate, quem: quem.matricula, nota: '' });
        if (ate) data = ate > hj ? hj : ate;
      }
      if (!concluida) {
        // a etapa atual começou recentemente, para o quadro ter prazos variados
        const atual = movimentos[movimentos.length - 1];
        const sla = SLA_PADRAO[atual.etapa][prioridade];
        atual.de = somaDias(hj, -r.int(0, Math.round(sla * 1.6)));
        if (atual.de < criadaEm) atual.de = criadaEm;
      }
      const ultimoMov = movimentos[movimentos.length - 1];
      const tipo = r.chance(.3) ? 'Credenciamento' : 'Manutenção';
      const ficha = {
        id: i + 1,
        numero: 'FA-' + ano + '-' + String(1200 + i).padStart(5, '0'),
        tipo,
        prestador: p.codigo,
        empresa: r.pick(R.empresas),
        sucursal: p.sucursal,
        prioridade,
        etapa: concluida ? 'concluida' : ultimoMov.etapa,
        responsavel: ultimoMov.quem,
        emissor: r.pick(pessoasDa('Emissão')).matricula,
        criadaEm,
        entrouEm: concluida ? ultimoMov.ate : ultimoMov.de,
        concluidaEm: concluida ? ultimoMov.ate : null,
        solicitante: 'Coordenação de rede ' + p.sucursal,
        negociacao: {
          dataProposta: somaDias(criadaEm, -r.int(3, 20)),
          alcada: r.pick(['Sucursal', 'Diretoria', 'Comitê executivo']),
          exclusiva: r.chance(.2)
        },
        justificativa: r.pick([
          'Reajuste anual previsto em contrato, com ganho de volume em exames de imagem.',
          'Inclusão de pacote de radioterapia para reduzir encaminhamentos para fora da região.',
          'Credenciamento para cobrir vazio assistencial em pronto-socorro infantil.',
          'Revisão de diárias de UTI após a abertura de novos leitos.',
          'Troca de tabela de materiais por pacote com preço fechado.'
        ]),
        faturamentoAnual: p.faturamentoAnual,
        aditivos: Array.from({ length: r.int(1, 3) }, () => ({
          tipo: r.pick(TIPOS_ADITIVO),
          forma: r.chance(.6) ? 'Reajuste' : 'Novo',
          empresa: r.pick(R.empresas),
          descricao: r.pick(['Reajuste de 4,8% sobre a tabela vigente.', 'Pacote com preço fechado por sessão.', 'Inclusão de novos códigos na tabela própria.', 'Valores conforme anexo da negociação.'])
        })),
        anexoPrima: prioridade === 'Rede Prima' ? Array.from({ length: r.int(1, 3) }, () => ({ especialidade: r.pick(ESPECIALIDADES), valor: r.money(800, 9000) })) : [],
        movimentos,
        devolucoes: 0,
        historico: []
      };
      if (devolvida) {
        ficha.devolvidaDe = ficha.etapa;
        ficha.etapa = 'devolvida';
        ficha.entrouEm = somaDias(hj, -r.int(0, 6));
        ficha.devolucoes = 1;
        ficha.motivoDevolucao = r.pick(['Falta a planilha de valores assinada pela sucursal.', 'O CNPJ do aditivo não bate com o do prestador.', 'Justificativa sem o ganho esperado.']);
      }
      fichas.push(ficha);
    }
    return { fichas, sla: JSON.parse(JSON.stringify(SLA_PADRAO)), tiposAditivo: tiposIniciais(), grupos: gruposIniciais(), equipes: equipesIniciais(), grandesGrupos: grandesIniciais(), procedimentos: procedimentosIniciais(r) };
  }

  function tiposIniciais() {
    const hj = hoje();
    return TIPOS_ADITIVO.map((t, i) => ({ id: i + 1, descricao: t, grupo: ['I', 'II', 'III'][i % 3], rede: i % 2 ? 'Rede Essencial' : 'Rede Prima', inicio: somaDias(hj, -400 + i * 20), fim: i === 5 ? somaDias(hj, -10) : '' }));
  }
  function gruposIniciais() {
    return [
      { id: 1, nome: 'I', descricao: 'Aditivos de tabela própria', exigeComite: 'Não' },
      { id: 2, nome: 'II', descricao: 'Pacotes e preços fechados', exigeComite: 'Sim' },
      { id: 3, nome: 'III', descricao: 'Credenciamentos e exclusividades', exigeComite: 'Sim' }
    ];
  }
  function equipesIniciais() {
    return ['Distribuição', 'Emissão', 'Implantação', 'Coordenação'].map((e, i) => ({ id: i + 1, nome: e, lider: (R.pessoas.find((p) => p.equipe === e) || R.pessoas[0]).nome, email: DS.normaliza(e) + '@orla.example' }));
  }
  function grandesIniciais() {
    return [
      { id: 1, nome: 'Hospitais gerais', descricao: 'Hospitais com pronto-socorro e internação' },
      { id: 2, nome: 'Clínicas e institutos', descricao: 'Atendimento ambulatorial e terapias' },
      { id: 3, nome: 'Oncologia', descricao: 'Centros com quimioterapia e radioterapia' },
      { id: 4, nome: 'Diagnóstico', descricao: 'Laboratórios e exames de imagem' }
    ];
  }
  function procedimentosIniciais(r) {
    const nomes = ['Ressonância magnética de crânio', 'Tomografia de tórax', 'Sessão de radioterapia', 'Consulta em pronto-socorro', 'Diária de UTI adulto', 'Diária de apartamento', 'Hemodiálise', 'Fisioterapia motora', 'Colonoscopia', 'Ecocardiograma'];
    return nomes.map((n, i) => ({ id: i + 1, codigo: String(40000000 + r.int(100000, 999999)), nome: n, tipo: TIPOS_ADITIVO[i % TIPOS_ADITIVO.length], ativo: i === 6 ? 'Inativo' : 'Ativo' }));
  }

  const db = DS.createDb(gerar);

  /* ------------------------------------------------------------- Prazos */

  function prazoDe(f) {
    const tabela = db.all('sla');
    return (tabela[f.etapa] || {})[f.prioridade] || null;
  }
  // Situação do relógio: ok, soon (vence em até 1 dia), late, done.
  function relogio(f) {
    if (f.etapa === 'concluida') return { estado: 'done', texto: 'Concluída', dias: null };
    if (f.etapa === 'devolvida') {
      const d = DS.diasEntre(f.entrouEm, hoje());
      return { estado: 'soon', texto: 'Devolvida ' + fmt.ha(d), dias: d };
    }
    const prazo = prazoDe(f);
    const usados = DS.diasEntre(f.entrouEm, hoje());
    const resta = prazo - usados;
    if (resta < 0) return { estado: 'late', texto: 'Atrasada ' + fmt.dias(-resta), dias: resta, prazo };
    if (resta <= 1) return { estado: 'soon', texto: resta === 0 ? 'Vence hoje' : 'Vence amanhã', dias: resta, prazo };
    return { estado: 'ok', texto: 'Faltam ' + fmt.dias(resta), dias: resta, prazo };
  }
  function clock(f) {
    const r = relogio(f);
    const ic = { ok: 'clock', soon: 'hourglass', late: 'alert', done: 'check-circle' }[r.estado];
    return h('span', { class: 'clock clock--' + r.estado }, icon(ic), r.texto);
  }

  const TOM_PRIO = { 'Rede Prima': 'signal', 'Prioridade': 'accent', 'Normal': '' };
  const prioBadge = (p) => DS.badge(p, TOM_PRIO[p], true);
  const nomePrestador = (c) => (R.prestador(c) || { nome: c }).nome;
  const nomePessoa = (m) => (R.pessoa(m) || { nome: '—' }).nome;

  // Move a ficha registrando o movimento (fecha o anterior, abre o novo).
  function mover(f, novaEtapa, quem, nota) {
    const hj = hoje();
    const aberto = f.movimentos[f.movimentos.length - 1];
    if (aberto && !aberto.ate) aberto.ate = hj;
    if (novaEtapa === 'concluida') {
      f.concluidaEm = hj;
    } else if (novaEtapa !== 'devolvida') {
      f.movimentos.push({ etapa: novaEtapa, de: hj, ate: null, quem, nota: nota || '' });
    }
    f.etapa = novaEtapa;
    f.entrouEm = hj;
    f.responsavel = quem;
    db.save();
  }

  /* ------------------------------------------------------------- Estrutura */

  const NAV = [
    { chave: 'esteira', href: 'esteira.html', label: 'Esteira', icone: 'kanban' },
    { chave: 'nova', href: 'nova-ficha.html', label: 'Nova ficha', icone: 'plus' },
    { chave: 'distribuicao', href: 'distribuicao.html', label: 'Distribuição', icone: 'users' },
    { chave: 'prazos', href: 'prazos.html', label: 'Prazos', icone: 'clock' },
    { chave: 'relatorio', href: 'relatorio.html', label: 'Relatório', icone: 'chart' },
    { chave: 'cadastros', href: 'cadastros.html', label: 'Cadastros', icone: 'layers' }
  ];

  function shell(op) {
    const u = DS.requireLogin();
    if (!u) return null;
    const rail = document.querySelector('.rail');
    const topbar = document.querySelector('.topbar');
    const lista = h('ul');
    NAV.forEach((it) => lista.appendChild(h('li', null, h('a', { href: it.href, 'aria-current': it.chave === op.ativo ? 'page' : null }, icon(it.icone), it.label))));
    DS.fill(rail,
      h('a', { class: 'brand', href: 'esteira.html', 'aria-label': 'Orla Esteira, início' }, h('img', { class: 'brand__mark', src: 'img/favicon.svg', alt: '', width: '44', height: '44' })),
      h('nav', { 'aria-label': 'Menu principal' }, lista));
    DS.fill(topbar,
      DS.brand(),
      h('div', { class: 'topbar__title' }, h('strong', { text: 'Orla Esteira' }), h('span', { text: 'Fichas de aditivo da Orla Saúde' })),
      h('div', { class: 'topbar__end' }, DS.appSwitcher(), DS.userBox(u)));
    const rodape = document.querySelector('.app-foot');
    if (rodape) DS.caseNote(rodape, db);
    return u;
  }

  window.ESTEIRA = {
    db, FASES, ETAPAS, PRIORIDADES, TIPOS_ADITIVO, ESPECIALIDADES, NAV,
    etapa, proxima, pessoasDa, prazoDe, relogio, clock, prioBadge, nomePrestador, nomePessoa, mover, shell
  };

  if (document.getElementById('login-form')) DS.loginPage();
})();
