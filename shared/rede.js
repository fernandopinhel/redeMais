/*
 * Dados de base compartilhados pela suíte Orla: pessoas, sucursais e prestadores.
 * Tudo é fictício e gerado de forma determinística, então os três produtos
 * falam dos mesmos prestadores e das mesmas pessoas.
 */
(function () {
  'use strict';

  const pessoas = [
    { matricula: '0472815', nome: 'Lívia Arruda Fontes', equipe: 'Coordenação', perfis: { placar: 'Analista de metas', esteira: 'Coordenação de aditivos', mesa: 'Negociação Rede Prima' } },
    { matricula: '0318842', nome: 'Caio Brandão Lemos', equipe: 'Distribuição', perfis: { esteira: 'Distribuição' } },
    { matricula: '0527790', nome: 'Helena Prado Simões', equipe: 'Emissão', perfis: { esteira: 'Emissão' } },
    { matricula: '0611204', nome: 'Rafael Moura Tavares', equipe: 'Emissão', perfis: { esteira: 'Emissão' } },
    { matricula: '0284417', nome: 'Beatriz Quintela Rocha', equipe: 'Emissão', perfis: { esteira: 'Emissão' } },
    { matricula: '0739025', nome: 'Diego Albuquerque Sá', equipe: 'Implantação', perfis: { esteira: 'Implantação' } },
    { matricula: '0458163', nome: 'Marina Coutinho Reis', equipe: 'Emissão', perfis: { esteira: 'Emissão', mesa: 'Negociação Rede Prima' } },
    { matricula: '0396570', nome: 'Otávio Nery Campos', equipe: 'Distribuição', perfis: { esteira: 'Distribuição' } },
    { matricula: '0820346', nome: 'Yara Fonseca Lima', equipe: 'Implantação', perfis: { esteira: 'Implantação' } },
    { matricula: '0175238', nome: 'Tomás Vieira Bastos', equipe: 'Negociação', perfis: { placar: 'Negociação', mesa: 'Negociação Rede Prima' } },
    { matricula: '0563981', nome: 'Clara Medeiros Antunes', equipe: 'Negociação', perfis: { placar: 'Negociação', mesa: 'Gestão de premissas' } },
    { matricula: '0947112', nome: 'Gustavo Pires Damasceno', equipe: 'Gestão', perfis: { placar: 'Gestão', esteira: 'Gestão', mesa: 'Gestão' } }
  ];

  const sucursais = [
    { sigla: 'RJ', nome: 'Rio de Janeiro e Espírito Santo', cidades: [['Rio de Janeiro', 'RJ'], ['Niterói', 'RJ'], ['Petrópolis', 'RJ'], ['Vitória', 'ES'], ['Vila Velha', 'ES']] },
    { sigla: 'SPC', nome: 'São Paulo Capital', cidades: [['São Paulo', 'SP'], ['Guarulhos', 'SP'], ['Osasco', 'SP']] },
    { sigla: 'SPI', nome: 'São Paulo Interior', cidades: [['Campinas', 'SP'], ['Ribeirão Preto', 'SP'], ['Sorocaba', 'SP']] },
    { sigla: 'MG', nome: 'Minas Gerais', cidades: [['Belo Horizonte', 'MG'], ['Juiz de Fora', 'MG'], ['Uberlândia', 'MG']] },
    { sigla: 'NE1', nome: 'Nordeste I', cidades: [['Salvador', 'BA'], ['Aracaju', 'SE'], ['Maceió', 'AL']] },
    { sigla: 'NE2', nome: 'Nordeste II', cidades: [['Recife', 'PE'], ['Fortaleza', 'CE'], ['Natal', 'RN']] },
    { sigla: 'CON', nome: 'Centro-Oeste e Norte', cidades: [['Brasília', 'DF'], ['Goiânia', 'GO'], ['Belém', 'PA']] },
    { sigla: 'SUL', nome: 'Sul', cidades: [['Porto Alegre', 'RS'], ['Curitiba', 'PR'], ['Florianópolis', 'SC']] }
  ];

  const clusters = ['Metrópoles com alta oferta', 'Metrópoles com média oferta', 'Capitais regionais', 'Interior com baixa oferta'];
  const empresas = ['Orla Saúde', 'Orla Empresas', 'Orla Odonto'];

  const prefixos = ['Hospital', 'Clínica', 'Instituto', 'Casa de Saúde', 'Centro Médico', 'Hospital e Maternidade', 'Policlínica'];
  const nomes = ['Aurora do Vale', 'Mirante Azul', 'Serra Dourada', 'Jardim Atlântico', 'Boa Esperança', 'Monte Claro', 'Pedra Branca',
    'Sol Nascente', 'Lago Sereno', 'Ipê Amarelo', 'Recanto das Águas', 'Nova Aliança', 'Brisa do Mar', 'Âncora', 'Cedro Alto',
    'Primavera', 'Vila Laguna', 'Horizonte Claro', 'Ilha Verde', 'Marés', 'Bem-te-vi', 'Rosa dos Ventos', 'Pinheiral', 'Coral',
    'Bela Aurora', 'Vale do Sol', 'Quatro Estações', 'Farol', 'Alto da Colina', 'Riacho Fundo', 'Santa Brígida', 'Girassol',
    'Estrela Guia', 'Cais', 'Jequitibá', 'Três Rios', 'Ventura', 'Lírio', 'Arvoredo', 'Canto Verde'];

  // Gerador próprio (o DS pode não estar carregado em todas as páginas).
  let s = 20260421;
  const next = () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (a, b) => a + Math.floor(next() * (b - a + 1));
  const pick = (arr) => arr[Math.floor(next() * arr.length)];

  function cnpj() {
    const base = Array.from({ length: 8 }, () => int(0, 9)).concat([0, 0, 0, 1]);
    const dv = (nums) => {
      let soma = 0;
      let peso = nums.length - 7;
      nums.forEach((n) => { soma += n * peso--; if (peso < 2) peso = 9; });
      const resto = soma % 11;
      return resto < 2 ? 0 : 11 - resto;
    };
    const d1 = dv(base);
    const d = base.concat(d1, dv(base.concat(d1))).join('');
    return d.slice(0, 2) + '.' + d.slice(2, 5) + '.' + d.slice(5, 8) + '/' + d.slice(8, 12) + '-' + d.slice(12);
  }

  const prestadores = nomes.map((nome, i) => {
    const suc = sucursais[i % sucursais.length];
    const cidade = pick(suc.cidades);
    const prefixo = i % 5 === 0 ? 'Hospital' : pick(prefixos);
    return {
      codigo: String(410000 + i * 137 + int(0, 99)),
      nome: prefixo + ' ' + nome,
      cnpj: cnpj(),
      cidade: cidade[0],
      uf: cidade[1],
      sucursal: suc.sigla,
      cluster: suc.sigla === 'SPC' || suc.sigla === 'RJ' ? pick(clusters.slice(0, 2)) : pick(clusters.slice(1)),
      rede: next() < 0.55 ? 'Rede Prima' : 'Rede Essencial',
      qualidade: next() < 0.5 ? '1 e 2' : '3 e 4',
      faturamentoAnual: Math.round((300000 + next() * 9500000) / 1000) * 1000,
      reajusteMes: int(1, 12)
    };
  });

  const sucursalNome = (sigla) => (sucursais.find((x) => x.sigla === sigla) || { nome: sigla }).nome;
  const prestador = (codigo) => prestadores.find((p) => p.codigo === String(codigo)) || null;
  const pessoa = (matricula) => pessoas.find((p) => p.matricula === matricula) || null;

  window.REDE = { pessoas, sucursais, clusters, empresas, prestadores, sucursalNome, prestador, pessoa };
})();
