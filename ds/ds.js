/*
 * Orla DS: comportamento compartilhado pelos produtos da suíte.
 * JavaScript puro, sem dependências. Nada é enviado a servidor:
 * a sessão e os dados ficam só no sessionStorage do navegador.
 *
 * Cada produto chama DS.app({...}) antes de usar o resto. A sessão
 * (quem entrou) é compartilhada pela suíte; os dados são de cada produto.
 */
(function () {
  'use strict';

  // Caminho da pasta do DS, deduzido do próprio script (serve na raiz e nos produtos).
  const BASE = (document.currentScript && document.currentScript.src || '').replace(/ds\.js(\?.*)?$/, '');
  const SUITE = BASE.replace(/ds\/$/, '');

  const APPS = [
    { chave: 'placar', nome: 'Orla Placar', resumo: 'Metas e resultados das negociações', pasta: 'controle-aditamento', inicio: 'placar.html' },
    { chave: 'esteira', nome: 'Orla Esteira', resumo: 'Fluxo das fichas de aditivo', pasta: 'novo-controle-aditamento', inicio: 'esteira.html' },
    { chave: 'mesa', nome: 'Orla Mesa', resumo: 'Negociação de pacotes da Rede Prima', pasta: 'novo-painel-sgta', inicio: 'mesa.html' }
  ];

  let APP = { chave: 'ds', nome: 'Orla DS', inicio: 'index.html' };
  function app(config) {
    APP = Object.assign({}, APP, APPS.find((a) => a.chave === config.chave) || {}, config);
    return APP;
  }

  /* --------------------------------------------------------- Armazenamento */

  // sessionStorage pode lançar exceção (modo privado, cota, bloqueio de cookies).
  function criaStore(prefixo) {
    return {
      get(chave, padrao) {
        try {
          const bruto = window.sessionStorage.getItem(prefixo() + chave);
          return bruto === null ? padrao : JSON.parse(bruto);
        } catch (e) {
          return padrao;
        }
      },
      set(chave, valor) {
        try {
          window.sessionStorage.setItem(prefixo() + chave, JSON.stringify(valor));
        } catch (e) { /* sem persistência: a página atual segue funcionando */ }
      },
      remove(chave) {
        try { window.sessionStorage.removeItem(prefixo() + chave); } catch (e) { /* idem */ }
      }
    };
  }
  const store = criaStore(() => 'orla:' + APP.chave + ':');
  const suiteStore = criaStore(() => 'orla:');

  /*
   * Banco de exemplo de cada produto: coleções de objetos com id,
   * criadas pelo gerador na primeira visita e guardadas na sessão.
   */
  function createDb(gerar) {
    let dados = store.get('db', null);
    if (!dados) {
      dados = gerar();
      store.set('db', dados);
    }
    const salvar = () => store.set('db', dados);
    const col = (nome) => {
      if (!dados[nome]) dados[nome] = [];
      return dados[nome];
    };
    return {
      all: (nome) => col(nome),
      get: (nome, id) => col(nome).find((r) => String(r.id) === String(id)) || null,
      meta: (chave, valor) => {
        dados.meta = dados.meta || {};
        if (valor === undefined) return dados.meta[chave];
        dados.meta[chave] = valor;
        salvar();
        return valor;
      },
      insert(nome, registro) {
        const lista = col(nome);
        const id = lista.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;
        const novo = Object.assign({ id }, registro);
        lista.push(novo);
        salvar();
        return novo;
      },
      update(nome, id, mudancas) {
        const r = col(nome).find((x) => String(x.id) === String(id));
        if (r) Object.assign(r, mudancas);
        salvar();
        return r;
      },
      remove(nome, id) {
        dados[nome] = col(nome).filter((r) => String(r.id) !== String(id));
        salvar();
      },
      save: salvar,
      reset() {
        dados = gerar();
        salvar();
      }
    };
  }

  /* ------------------------------------------------------------- Aleatório */

  // Gerador determinístico: os dados de exemplo são sempre os mesmos.
  function rand(semente) {
    let s = semente >>> 0;
    const next = () => {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    const r = {
      next,
      int: (a, b) => a + Math.floor(next() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(next() * arr.length)],
      chance: (p) => next() < p,
      money: (a, b) => Math.round((a + next() * (b - a)) * 100) / 100,
      cnpj() {
        const base = Array.from({ length: 8 }, () => r.int(0, 9)).concat([0, 0, 0, 1]);
        const dv = (nums) => {
          let soma = 0;
          let peso = nums.length - 7;
          nums.forEach((n) => { soma += n * peso--; if (peso < 2) peso = 9; });
          const resto = soma % 11;
          return resto < 2 ? 0 : 11 - resto;
        };
        const d1 = dv(base);
        const d2 = dv(base.concat(d1));
        return masks.cnpj(base.concat(d1, d2).join(''));
      }
    };
    return r;
  }

  /* -------------------------------------------------------------------- DOM */

  // Monta elementos sem innerHTML: todo texto entra como textContent.
  function h(tag, props, ...filhos) {
    const el = document.createElement(tag);
    if (props) {
      Object.keys(props).forEach((k) => {
        const v = props[k];
        if (v === undefined || v === null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'text') el.textContent = v;
        else if (k === 'dataset') Object.assign(el.dataset, v);
        else if (k.indexOf('on') === 0 && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked' || k === 'selected' || k === 'disabled' || k === 'hidden' || k === 'required' || k === 'readOnly') el[k] = !!v;
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    append(el, filhos);
    return el;
  }

  function append(el, filhos) {
    filhos.flat(Infinity).forEach((f) => {
      if (f === null || f === undefined || f === false) return;
      el.appendChild(typeof f === 'string' || typeof f === 'number' ? document.createTextNode(String(f)) : f);
    });
    return el;
  }

  // Substitui o conteúdo ignorando null/false (replaceChildren escreveria "null").
  function fill(el, ...filhos) {
    el.replaceChildren();
    return append(el, filhos);
  }

  function icon(nome, classe) {
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('class', 'icon' + (classe ? ' ' + classe : ''));
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');
    const use = document.createElementNS(ns, 'use');
    use.setAttribute('href', BASE + 'icons.svg#i-' + nome);
    svg.appendChild(use);
    return svg;
  }

  let seq = 0;
  function uid(prefixo) { seq += 1; return (prefixo || 'id') + '-' + seq; }
  function param(nome) { return new URLSearchParams(window.location.search).get(nome); }
  const $ = (sel, raiz) => (raiz || document).querySelector(sel);
  const $$ = (sel, raiz) => Array.from((raiz || document).querySelectorAll(sel));

  /* ------------------------------------------------------------- Formatação */

  const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
  const moedaCurta = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact', maximumFractionDigits: 1 });
  const numero = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const inteiro = new Intl.NumberFormat('pt-BR');
  const pct = new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

  const vazio = (n) => n === null || n === undefined || n === '' || isNaN(n);
  const fmt = {
    money: (n) => (vazio(n) ? '' : moeda.format(n)),
    moneyShort: (n) => (vazio(n) ? '' : moedaCurta.format(n)),
    decimal: (n) => (vazio(n) ? '' : numero.format(n)),
    int: (n) => inteiro.format(n || 0),
    pct: (n) => (isFinite(n) && n !== null ? pct.format(n) : ''),
    date(iso) {
      if (!iso) return '';
      const p = String(iso).slice(0, 10).split('-');
      return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso);
    },
    dateTime(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    },
    // '2026-03' -> 'mar/2026'
    competencia(ym) {
      if (!ym) return '';
      const p = String(ym).split('-');
      return MESES[Number(p[1]) - 1] + '/' + p[0];
    },
    plural: (n, um, varios) => fmt.int(n) + ' ' + (n === 1 ? um : varios),
    dias: (n) => (n === 1 || n === -1 ? n + ' dia' : n + ' dias'),
    ha: (n) => (n <= 0 ? 'hoje' : n === 1 ? 'ontem' : 'há ' + n + ' dias')
  };

  function parseMoney(txt) {
    if (typeof txt === 'number') return txt;
    const limpo = String(txt || '').replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
    const n = parseFloat(limpo);
    return isNaN(n) ? null : Math.round(n * 100) / 100;
  }

  function hoje() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  }
  function somaDias(iso, dias) {
    const d = new Date(iso.slice(0, 10) + 'T12:00:00');
    d.setDate(d.getDate() + dias);
    return d.toISOString().slice(0, 10);
  }
  function diasEntre(a, b) {
    return Math.round((new Date(b.slice(0, 10) + 'T12:00:00') - new Date(a.slice(0, 10) + 'T12:00:00')) / 86400000);
  }
  const diasAte = (iso) => diasEntre(hoje(), iso);
  function trimestre(iso) {
    const d = (iso || hoje()).slice(0, 10).split('-');
    return { ano: Number(d[0]), t: Math.floor((Number(d[1]) - 1) / 3) + 1 };
  }
  const rotuloTrimestre = (t, ano) => t + 'º trimestre de ' + ano;

  function normaliza(txt) {
    return String(txt || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  }
  const digitos = (txt) => String(txt || '').replace(/\D/g, '');

  function iniciais(nome) {
    const p = String(nome || '').trim().split(/\s+/);
    return (((p[0] || '')[0] || '') + ((p.length > 1 ? p[p.length - 1][0] : '') || '')).toUpperCase();
  }

  /* --------------------------------------------------------------- Máscaras */

  const masks = {
    cnpj(v) {
      const d = digitos(v).slice(0, 14);
      return d.replace(/^(\d{2})(\d)/, '$1.$2').replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2').replace(/(\d{4})(\d)/, '$1-$2');
    },
    phone(v) {
      const d = digitos(v).slice(0, 11);
      if (d.length <= 2) return d.length ? '(' + d : '';
      if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
      if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
      return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
    },
    digits(v, el) { return digitos(v).slice(0, Number(el && el.getAttribute('maxlength')) || 30); },
    upper(v) { return String(v).toUpperCase(); },
    money(v) { return String(v).replace(/[^\d,.]/g, ''); },
    decimal(v) { return String(v).replace(/[^\d,.-]/g, ''); }
  };

  function applyMasks(raiz) {
    $$('[data-mask]', raiz).forEach((el) => {
      if (el.dataset.maskReady) return;
      el.dataset.maskReady = '1';
      const tipo = el.dataset.mask;
      el.addEventListener('input', () => {
        const antes = el.value;
        const depois = masks[tipo](antes, el);
        if (antes !== depois) el.value = depois;
      });
      if (tipo === 'money' || tipo === 'decimal') {
        el.addEventListener('blur', () => {
          const n = parseMoney(el.value);
          if (n !== null) el.value = fmt.decimal(n);
        });
      }
    });
  }

  /* -------------------------------------------------------------- Validação */

  const valida = {
    cnpj(v) {
      const d = digitos(v);
      if (d.length !== 14 || /^(\d)\1+$/.test(d)) return false;
      const calc = (base) => {
        let soma = 0;
        let peso = base.length - 7;
        for (let i = 0; i < base.length; i++) {
          soma += Number(base[i]) * peso--;
          if (peso < 2) peso = 9;
        }
        const r = soma % 11;
        return r < 2 ? 0 : 11 - r;
      };
      const d1 = calc(d.slice(0, 12));
      const d2 = calc(d.slice(0, 12) + d1);
      return d.endsWith(String(d1) + String(d2));
    },
    email: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim()),
    phone: (v) => { const d = digitos(v); return d.length >= 10 && d.length <= 11 && Number(d.slice(0, 2)) >= 11; },
    matricula: (v) => /^\d{7}$/.test(String(v).trim()),
    pp: (v) => /^\d{8}$/.test(digitos(v)),
    money: (v) => { const n = parseMoney(v); return n !== null && n > 0; },
    percent: (v) => { const n = parseMoney(v); return n !== null && n >= 0 && n <= 100; },
    ano: (v) => /^\d{4}$/.test(String(v).trim()) && Number(v) >= 2015 && Number(v) <= 2040,
    positivo: (v) => { const n = parseMoney(v); return n !== null && n >= 0; }
  };

  const mensagens = {
    cnpj: 'Esse CNPJ não parece válido. Pode conferir os números?',
    email: 'Esse e-mail parece incompleto. Use o formato nome@empresa.com.br.',
    phone: 'Coloque o telefone com DDD, assim: (21) 91234-5678.',
    matricula: 'A matrícula tem 7 números, como 0472815.',
    pp: 'O código do pacote tem 8 números, como 84561159.',
    money: 'Informe um valor maior que zero, por exemplo 1.250,00.',
    percent: 'Use um percentual entre 0 e 100, por exemplo 12,5.',
    ano: 'Use o ano com 4 números, entre 2015 e 2040.',
    positivo: 'Use um número igual ou maior que zero.'
  };

  function rotulo(el) {
    if (el.dataset.label) return el.dataset.label;
    const grupo = el.closest('fieldset.choice-group');
    if ((el.type === 'radio' || el.type === 'checkbox') && grupo) {
      const lg = grupo.querySelector('legend');
      if (lg) return lg.textContent.replace('*', '').trim();
    }
    const lb = el.id && document.querySelector('label[for="' + el.id + '"]');
    return lb ? lb.textContent.replace('*', '').replace('(opcional)', '').trim() : (el.name || 'campo');
  }

  function erroEl(el) {
    const alvo = el.type === 'radio' ? el.closest('fieldset') : el;
    const id = (alvo.id || el.name) + '-erro';
    let p = document.getElementById(id);
    if (!p) {
      p = h('p', { class: 'field-error', id, hidden: true });
      const campo = el.closest('.field, .choice-group') || el.parentNode;
      campo.appendChild(p);
      const desc = (alvo.getAttribute('aria-describedby') || '').split(' ').filter(Boolean);
      if (desc.indexOf(id) < 0) desc.push(id);
      alvo.setAttribute('aria-describedby', desc.join(' '));
    }
    return p;
  }

  function setErro(el, msg) {
    const p = erroEl(el);
    const alvo = el.type === 'radio' ? el.closest('fieldset') : el;
    if (msg) {
      p.replaceChildren(icon('alert'), h('span', { text: msg }));
      p.hidden = false;
      if (el.type === 'radio') alvo.querySelectorAll('input').forEach((r) => r.setAttribute('aria-invalid', 'true'));
      else el.setAttribute('aria-invalid', 'true');
    } else {
      p.hidden = true;
      p.replaceChildren();
      if (el.type === 'radio') alvo.querySelectorAll('input').forEach((r) => r.removeAttribute('aria-invalid'));
      else el.removeAttribute('aria-invalid');
    }
  }

  // Regras vêm do próprio HTML: required, data-rules="cnpj money ..." e min.
  function checaCampo(el) {
    if (el.disabled || el.closest('[hidden]')) return '';
    const regras = (el.dataset.rules || '').split(' ').filter(Boolean);
    const nome = rotulo(el);
    if (el.type === 'radio') {
      const grupo = el.closest('fieldset');
      const req = grupo && grupo.dataset.required === 'true';
      return req && !grupo.querySelector('input:checked') ? 'Escolha uma opção em "' + nome + '".' : '';
    }
    const v = (el.value || '').trim();
    if (!v) {
      if (!el.required) return '';
      return el.tagName === 'SELECT' ? 'Escolha uma opção em "' + nome + '".' : 'Faltou preencher "' + nome + '".';
    }
    for (const r of regras) {
      if (valida[r] && !valida[r](v)) return mensagens[r];
    }
    if (el.type === 'number' && el.min !== '' && Number(v) < Number(el.min)) return '"' + nome + '" precisa ser pelo menos ' + el.min + '.';
    if (el.type === 'number' && el.max !== '' && Number(v) > Number(el.max)) return '"' + nome + '" pode ser no máximo ' + el.max + '.';
    if (el.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(v)) return 'Use uma data válida em "' + nome + '".';
    if (el.type === 'month' && !/^\d{4}-\d{2}$/.test(v)) return 'Use mês e ano válidos em "' + nome + '".';
    return '';
  }

  function controles(form) {
    const vistos = new Set();
    return $$('input, select, textarea', form).filter((el) => {
      if (el.type === 'hidden' || el.type === 'button' || el.type === 'submit' || el.type === 'file' || el.dataset.novalidate) return false;
      if (el.type === 'checkbox') return false;
      if (el.type === 'radio') {
        if (vistos.has(el.name)) return false;
        vistos.add(el.name);
      }
      return true;
    });
  }

  /*
   * Valida o formulário e mostra os erros no campo e num resumo com links.
   * `extra(addErro)` recebe as regras de negócio. Retorna true se está tudo certo.
   */
  function validateForm(form, opcoes) {
    const op = opcoes || {};
    const erros = [];
    controles(form).forEach((el) => {
      const msg = checaCampo(el);
      setErro(el, msg);
      if (msg) erros.push({ el, msg });
    });
    if (op.extra) {
      op.extra((el, msg) => {
        if (erros.some((e) => e.el === el)) return;
        setErro(el, msg);
        erros.push({ el, msg });
      });
    }
    renderResumo(form, erros, op.resumoTitulo);
    if (!form.dataset.liveValidate) {
      form.dataset.liveValidate = '1';
      // Depois da primeira tentativa, revalida enquanto a pessoa corrige:
      // texto ao digitar, opções ao escolher. Nunca no blur, porque mudar
      // o layout nessa hora desloca o botão que a pessoa está clicando.
      const revalida = (ev) => {
        const el = ev.target;
        if (!el.matches('input, select, textarea') || el.type === 'checkbox') return;
        const textual = el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type !== 'radio' && el.type !== 'date' && el.type !== 'month');
        if (textual !== (ev.type === 'input')) return;
        if (el.getAttribute('aria-invalid') !== 'true') return;
        setErro(el, checaCampo(el));
        atualizaResumo(form);
      };
      form.addEventListener('input', revalida);
      form.addEventListener('change', revalida);
    }
    if (erros.length) {
      const resumo = form.querySelector('.error-summary');
      if (resumo && erros.length > 1) resumo.focus();
      else focusField(erros[0].el);
      announce(erros.length === 1 ? 'Falta corrigir um ponto: ' + erros[0].msg : 'Faltam corrigir ' + erros.length + ' pontos. A lista está no topo do formulário.');
    }
    return erros.length === 0;
  }

  function focusField(el) {
    const alvo = el.type === 'radio' ? (el.closest('fieldset').querySelector('input:checked') || el) : el;
    alvo.focus();
    if (alvo.scrollIntoView) alvo.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  function renderResumo(form, erros, titulo) {
    let resumo = form.querySelector('.error-summary');
    if (erros.length < 2) {
      if (resumo) resumo.remove();
      return;
    }
    if (!resumo) {
      resumo = h('div', { class: 'alert alert--error error-summary', tabindex: '-1', role: 'group', 'aria-labelledby': form.id + '-resumo-titulo' });
      const ancora = form.querySelector('[data-summary-anchor]');
      if (ancora) ancora.after(resumo); else form.prepend(resumo);
    }
    const lista = h('ul');
    erros.forEach((e) => {
      lista.appendChild(h('li', null, h('a', {
        href: '#' + e.el.id,
        text: e.msg,
        onClick(ev) { ev.preventDefault(); focusField(e.el); }
      })));
    });
    resumo.replaceChildren(
      icon('alert'),
      h('div', { class: 'alert__body' },
        h('p', { class: 'alert__title', id: form.id + '-resumo-titulo', text: titulo || 'Antes de salvar, confira estes ' + erros.length + ' pontos:' }),
        lista)
    );
  }

  function atualizaResumo(form) {
    const resumo = form.querySelector('.error-summary');
    if (!resumo) return;
    const unicos = [];
    const nomes = new Set();
    $$('[aria-invalid="true"]', form).forEach((el) => {
      const chave = el.type === 'radio' ? el.name : el.id;
      if (nomes.has(chave)) return;
      nomes.add(chave);
      const p = document.getElementById((el.type === 'radio' ? el.closest('fieldset').id : el.id) + '-erro');
      unicos.push({ el, msg: p ? p.textContent : '' });
    });
    if (unicos.length < 2) resumo.remove();
    else renderResumo(form, unicos);
  }

  function clearErrors(form) {
    $$('[aria-invalid="true"]', form).forEach((el) => setErro(el, ''));
    const resumo = form.querySelector('.error-summary');
    if (resumo) resumo.remove();
  }

  /* ----------------------------------------------------- Anúncios e toast */

  let regiao;
  function announce(mensagem) {
    if (!regiao) {
      regiao = document.getElementById('anuncios');
      if (!regiao) {
        regiao = h('div', { id: 'anuncios', class: 'visually-hidden', role: 'status', 'aria-live': 'polite' });
        document.body.appendChild(regiao);
      }
    }
    // Limpa antes para que a mesma mensagem repetida seja anunciada de novo.
    regiao.textContent = '';
    window.setTimeout(() => { regiao.textContent = mensagem; }, 60);
  }

  let toastTimer;
  function toast(mensagem, tipo) {
    const atual = document.querySelector('.toast');
    if (atual) atual.remove();
    window.clearTimeout(toastTimer);
    // O texto vai para a região viva, então o toast visual fica aria-hidden.
    const el = h('div', { class: 'toast' + (tipo === 'error' ? ' toast--error' : ''), 'aria-hidden': 'true' },
      icon(tipo === 'error' ? 'alert' : 'check-circle'), h('span', { text: mensagem }));
    document.body.appendChild(el);
    announce(mensagem);
    toastTimer = window.setTimeout(() => el.remove(), 5000);
  }

  // Mensagem que sobrevive a um redirecionamento (ex.: "Ficha criada").
  function flash(mensagem, extra) { store.set('flash', Object.assign({ mensagem }, extra || {})); }
  function takeFlash() {
    const f = store.get('flash', null);
    store.remove('flash');
    return f;
  }

  /* --------------------------------------------------------------- Diálogos */

  /*
   * Diálogo modal nativo (<dialog>): prende o foco, fecha com Esc e
   * devolve o foco a quem abriu. `montar(corpo, fechar, form)` preenche o conteúdo.
   * Resolve com o valor de aoConfirmar() (ou true) e com null se cancelado.
   */
  function dialog(op) {
    return new Promise((resolve) => {
      const origem = document.activeElement;
      const tituloId = uid('dlg-titulo');
      const corpo = h('div', { class: 'dialog__body' });
      const rodape = h('div', { class: 'dialog__foot' });
      const form = h('form', { class: 'dialog__form', method: 'dialog', novalidate: true, id: uid('dlg-form') });
      const dlg = h('dialog', { class: 'dialog' + (op.wide ? ' dialog--wide' : ''), 'aria-labelledby': tituloId }, form);
      let resultado = null;

      const fechar = (valor) => {
        resultado = valor === undefined ? null : valor;
        dlg.close();
      };

      const cab = h('div', { class: 'dialog__head' },
        h('div', null,
          op.icone ? h('div', { class: 'dialog__icon' + (op.tom ? ' dialog__icon--' + op.tom : '') }, icon(op.icone)) : null,
          h('h2', { id: tituloId, text: op.titulo })),
        h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--sm', 'aria-label': 'Fechar', onClick: () => fechar(null) }, icon('x')));

      form.append(cab, corpo, rodape);
      corpo.appendChild(h('div', { 'data-summary-anchor': '' }));
      if (op.descricao) corpo.appendChild(h('p', { text: op.descricao }));
      if (op.montar) op.montar(corpo, fechar, form);

      const cancelar = h('button', { type: 'button', class: 'btn', text: op.cancelar || 'Cancelar', onClick: () => fechar(null) });
      const confirmar = h('button', {
        type: 'submit',
        class: 'btn ' + (op.tomBotao === 'danger' ? 'btn--danger-solid' : op.tomBotao === 'success' ? 'btn--success-solid' : 'btn--primary'),
        text: op.confirmar || 'Confirmar'
      });
      if (op.somenteOk) rodape.append(confirmar);
      else rodape.append(cancelar, confirmar);

      form.addEventListener('submit', (ev) => {
        ev.preventDefault();
        if (op.aoConfirmar) {
          const valor = op.aoConfirmar(form);
          if (valor === false || valor === undefined) return; // validação falhou: continua aberto
          fechar(valor);
        } else {
          fechar(true);
        }
      });
      dlg.addEventListener('close', () => {
        dlg.remove();
        if (origem && document.contains(origem)) origem.focus();
        resolve(resultado);
      });

      document.body.appendChild(dlg);
      applyMasks(dlg);
      dlg.showModal();
      // Corpo com rolagem e sem nada focável: precisa receber foco para rolar pelo teclado.
      if (corpo.scrollHeight > corpo.clientHeight && !corpo.querySelector('a, button, input, select, textarea, [tabindex]')) {
        corpo.setAttribute('tabindex', '0');
        corpo.setAttribute('role', 'region');
        corpo.setAttribute('aria-labelledby', tituloId);
      }
      const foco = dlg.querySelector('[autofocus]') || (op.focoNoConfirmar ? confirmar : corpo.querySelector('input:not([type="checkbox"]), select, textarea')) || confirmar;
      foco.focus();
    });
  }

  function confirmDialog(op) {
    return dialog(Object.assign({ icone: 'alert', tom: op.tomBotao === 'danger' ? 'danger' : '', focoNoConfirmar: false }, op));
  }

  /* -------------------------------------------------- Campos de formulário */

  /*
   * Campo com rótulo visível, dica e área de erro ligadas por aria.
   * tipo: text | email | tel | number | date | month | select | textarea | money | decimal
   */
  function field(op) {
    const id = op.id || uid('campo');
    const dicaId = op.dica ? id + '-dica' : null;
    const label = h('label', { for: id },
      op.label,
      op.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null,
      !op.required && op.opcional ? h('span', { class: 'opt' }, ' (opcional)') : null);
    const numerico = op.tipo === 'money' || op.tipo === 'decimal';
    let ctrl;
    const comum = {
      id,
      name: op.name || id,
      required: !!op.required,
      'aria-describedby': dicaId,
      'data-rules': op.rules || (op.tipo === 'money' && op.required ? 'money' : null),
      'data-mask': op.mask || (numerico ? op.tipo : null),
      'data-label': op.dataLabel || null,
      disabled: op.disabled,
      autocomplete: op.autocomplete || 'off'
    };
    if (op.tipo === 'select') {
      ctrl = h('select', Object.assign({ class: 'select' }, comum));
      if (op.vazio !== false) ctrl.appendChild(h('option', { value: '', text: op.vazio || 'Selecione' }));
      (op.opcoes || []).forEach((o) => {
        const val = typeof o === 'object' ? o.value : o;
        const txt = typeof o === 'object' ? o.label : o;
        ctrl.appendChild(h('option', { value: val, text: txt }));
      });
      if (op.valor !== undefined && op.valor !== null) ctrl.value = String(op.valor);
    } else if (op.tipo === 'textarea') {
      ctrl = h('textarea', Object.assign({ class: 'textarea', maxlength: op.max || 1000, rows: op.rows || 4 }, comum));
      if (op.valor) ctrl.value = op.valor;
    } else {
      ctrl = h('input', Object.assign({
        class: 'input' + (numerico ? ' input--money' : ''),
        type: numerico ? 'text' : (op.tipo || 'text'),
        inputmode: op.inputmode || (numerico ? 'decimal' : null),
        maxlength: op.max || null,
        min: op.min !== undefined ? op.min : null,
        max: op.maxValor !== undefined ? op.maxValor : null,
        step: op.step || null,
        placeholder: op.placeholder || null,
        readOnly: op.readOnly,
        spellcheck: op.spellcheck === undefined ? null : String(op.spellcheck)
      }, comum));
      if (op.valor !== undefined && op.valor !== null) ctrl.value = numerico && typeof op.valor === 'number' ? fmt.decimal(op.valor) : op.valor;
    }
    const controle = op.sufixo ? h('div', { class: 'input-group' }, ctrl, h('span', { class: 'input-group__suffix', 'aria-hidden': 'true', text: op.sufixo })) : ctrl;
    const wrap = h('div', { class: 'field ' + (op.span ? 'span-' + op.span : '') },
      label,
      op.dica ? h('p', { class: 'hint', id: dicaId, text: op.dica }) : null,
      controle);
    wrap.control = ctrl;
    return wrap;
  }

  function choiceGroup(op) {
    const id = op.id || uid('grupo');
    const fs = h('fieldset', { class: 'choice-group field ' + (op.span ? 'span-' + op.span : ''), id, 'data-required': op.required ? 'true' : null },
      h('legend', null, op.label, op.required ? h('span', { class: 'req', 'aria-hidden': 'true' }, ' *') : null));
    (op.opcoes || []).forEach((o, i) => {
      const val = typeof o === 'object' ? o.value : o;
      const txt = typeof o === 'object' ? o.label : o;
      const marcado = Array.isArray(op.valor) ? op.valor.indexOf(val) >= 0 : String(op.valor) === String(val);
      const inp = h('input', { type: op.multiplo ? 'checkbox' : 'radio', name: op.name || id, id: id + '-' + i, value: val, checked: marcado });
      fs.appendChild(h('label', { class: 'choice' + (op.box ? ' choice--box' : ''), for: id + '-' + i }, inp, txt));
    });
    return fs;
  }

  function selectOptions(select, opcoes, vazioTxt) {
    const atual = select.value;
    select.replaceChildren(h('option', { value: '', text: vazioTxt || 'Todos' }));
    opcoes.forEach((o) => {
      const val = typeof o === 'object' ? o.value : o;
      const txt = typeof o === 'object' ? o.label : o;
      select.appendChild(h('option', { value: val, text: txt }));
    });
    select.value = atual;
  }

  /* ------------------------------------------------------- Tabela de dados */

  /*
   * Tabela com ordenação (aria-sort), paginação e seleção opcional.
   * columns: [{ key, label, sort?: fn|bool, render?: fn(row) => Node|string, num?: bool, class? }]
   */
  function dataTable(op) {
    const estado = { sortKey: op.sortKey || null, sortDir: op.sortDir || 'asc', page: 1, size: op.pageSize || 10, selecionados: new Set() };
    const raiz = op.container;
    const capId = uid('cap');

    function ordenados() {
      const linhas = op.rows.slice();
      if (!estado.sortKey) return linhas;
      const col = op.columns.find((c) => c.key === estado.sortKey);
      const valor = typeof col.sort === 'function' ? col.sort : (r) => r[col.key];
      linhas.sort((a, b) => {
        const va = valor(a);
        const vb = valor(b);
        let r;
        if (typeof va === 'number' && typeof vb === 'number') r = va - vb;
        else r = normaliza(va).localeCompare(normaliza(vb), 'pt-BR', { numeric: true });
        return estado.sortDir === 'asc' ? r : -r;
      });
      return linhas;
    }

    function render(focoSort) {
      const linhas = ordenados();
      const total = linhas.length;
      const paginas = Math.max(1, Math.ceil(total / estado.size));
      if (estado.page > paginas) estado.page = paginas;
      const ini = (estado.page - 1) * estado.size;
      const visiveis = op.paginate === false ? linhas : linhas.slice(ini, ini + estado.size);

      raiz.replaceChildren();
      if (!total) {
        raiz.appendChild(h('div', { class: 'empty' },
          icon(op.emptyIcon || 'search'),
          h('strong', { text: op.emptyTitle || 'Nada por aqui' }),
          h('p', { text: op.emptyText || 'Tente ajustar os filtros.' })));
        return;
      }

      const thead = h('tr');
      if (op.selectable) {
        const selecionaveis = visiveis.filter((r) => !op.isSelectable || op.isSelectable(r));
        thead.appendChild(h('th', { scope: 'col', class: 'col-check' }, h('input', {
          type: 'checkbox',
          'aria-label': 'Selecionar todos desta página',
          checked: selecionaveis.length > 0 && selecionaveis.every((r) => estado.selecionados.has(op.rowKey(r))),
          onChange(ev) {
            selecionaveis.forEach((r) => {
              if (ev.target.checked) estado.selecionados.add(op.rowKey(r)); else estado.selecionados.delete(op.rowKey(r));
            });
            render();
            mudouSelecao();
            const cab = raiz.querySelector('thead .col-check input');
            if (cab) cab.focus();
          }
        })));
      }
      op.columns.forEach((c) => {
        const th = h('th', { scope: 'col', class: (c.num ? 'num ' : '') + (c.class || '') });
        if (c.sort) {
          const ativo = estado.sortKey === c.key;
          th.setAttribute('aria-sort', ativo ? (estado.sortDir === 'asc' ? 'ascending' : 'descending') : 'none');
          th.appendChild(h('button', {
            type: 'button',
            class: 'sort-btn',
            'data-sort': c.key,
            onClick() {
              if (estado.sortKey === c.key) estado.sortDir = estado.sortDir === 'asc' ? 'desc' : 'asc';
              else { estado.sortKey = c.key; estado.sortDir = 'asc'; }
              render(c.key);
              announce('Ordenado por ' + c.label + ', ' + (estado.sortDir === 'asc' ? 'crescente' : 'decrescente') + '.');
            }
          }, c.label, icon(ativo ? (estado.sortDir === 'asc' ? 'sort-up' : 'sort-down') : 'sort')));
        } else if (c.srOnly) {
          th.appendChild(h('span', { class: 'visually-hidden', text: c.label }));
        } else {
          th.textContent = c.label;
        }
        thead.appendChild(th);
      });

      const tbody = h('tbody');
      visiveis.forEach((r) => {
        const chave = op.rowKey ? op.rowKey(r) : null;
        const tr = h('tr', { class: (op.highlight && op.highlight(r) ? 'is-highlight ' : '') + (estado.selecionados.has(chave) ? 'is-selected' : '') });
        if (op.selectable) {
          const pode = !op.isSelectable || op.isSelectable(r);
          tr.appendChild(h('td', { class: 'col-check' }, h('input', {
            type: 'checkbox',
            disabled: !pode,
            'aria-label': 'Selecionar ' + op.rowLabel(r),
            checked: estado.selecionados.has(chave),
            onChange(ev) {
              if (ev.target.checked) estado.selecionados.add(chave); else estado.selecionados.delete(chave);
              tr.classList.toggle('is-selected', ev.target.checked);
              mudouSelecao();
            }
          })));
        }
        op.columns.forEach((c, i) => {
          const conteudo = c.render ? c.render(r) : (r[c.key] === undefined || r[c.key] === null ? '' : String(r[c.key]));
          const cabecalho = i === 0 && op.rowHeader !== false;
          tr.appendChild(h(cabecalho ? 'th' : 'td', { class: (c.num ? 'num ' : '') + (c.class || ''), scope: cabecalho ? 'row' : null }, conteudo));
        });
        tbody.appendChild(tr);
      });

      const tabela = h('table', { class: 'table' + (op.compact ? ' table--compact' : '') },
        h('caption', { class: 'visually-hidden', id: capId, text: op.caption + (estado.sortKey ? ', ordenada por ' + op.columns.find((c) => c.key === estado.sortKey).label : '') }),
        h('thead', null, thead),
        tbody,
        op.footer ? op.footer(linhas) : null);

      raiz.appendChild(h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': capId, tabindex: '0' }, tabela));

      if (op.paginate !== false && paginas > 1) {
        const lista = h('ul');
        const botao = (rotuloTxt, pagina, conteudo, atual) => h('li', null, h('button', {
          type: 'button',
          'aria-label': rotuloTxt,
          'aria-current': atual ? 'page' : null,
          disabled: pagina < 1 || pagina > paginas,
          onClick() {
            estado.page = pagina;
            render();
            raiz.querySelector('.table-wrap').focus();
            announce('Página ' + pagina + ' de ' + paginas + '.');
          }
        }, conteudo));
        lista.appendChild(botao('Página anterior', estado.page - 1, icon('chevron-left')));
        paginasVisiveis(estado.page, paginas).forEach((p) => {
          if (p === '…') lista.appendChild(h('li', { 'aria-hidden': 'true', class: 'muted', text: '…' }));
          else lista.appendChild(botao('Página ' + p, p, String(p), p === estado.page));
        });
        lista.appendChild(botao('Próxima página', estado.page + 1, icon('chevron-right')));
        raiz.appendChild(h('nav', { class: 'pager', 'aria-label': 'Paginação de ' + op.caption },
          h('p', { text: 'Mostrando ' + (ini + 1) + ' a ' + Math.min(ini + estado.size, total) + ' de ' + fmt.int(total) }),
          lista));
      }
      if (focoSort) {
        const b = raiz.querySelector('[data-sort="' + focoSort + '"]');
        if (b) b.focus();
      }
    }

    function mudouSelecao() {
      if (op.onSelect) op.onSelect(Array.from(estado.selecionados));
    }

    render();
    return {
      update(linhas, manterPagina) {
        op.rows = linhas;
        if (!manterPagina) {
          // Abre na página do registro destacado (ex.: o que acabou de ser salvo).
          const i = op.highlight ? ordenados().findIndex(op.highlight) : -1;
          estado.page = i >= 0 ? Math.floor(i / estado.size) + 1 : 1;
        }
        const validos = new Set(linhas.map(op.rowKey || (() => null)));
        estado.selecionados.forEach((k) => { if (!validos.has(k)) estado.selecionados.delete(k); });
        render();
        mudouSelecao();
      },
      selected: () => Array.from(estado.selecionados),
      clearSelection() { estado.selecionados.clear(); render(); mudouSelecao(); },
      rows: () => ordenados()
    };
  }

  function paginasVisiveis(atual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const out = [1];
    const ini = Math.max(2, atual - 1);
    const fim = Math.min(total - 1, atual + 1);
    if (ini > 2) out.push('…');
    for (let i = ini; i <= fim; i++) out.push(i);
    if (fim < total - 1) out.push('…');
    out.push(total);
    return out;
  }

  /* ---------------------------------------------- Selos, medidores e barras */

  function badge(texto, tom, semPonto) {
    return h('span', { class: 'badge' + (tom ? ' badge--' + tom : '') + (semPonto ? ' badge--plain' : ''), text: texto });
  }

  // Barra de progresso com o número visível: o texto é a informação, a barra é reforço.
  function meter(op) {
    const proporcao = op.max > 0 ? op.valor / op.max : 0;
    const largura = Math.max(0, Math.min(1, proporcao)) * 100;
    const tom = op.tom || (proporcao >= 1 ? 'success' : proporcao >= (op.alerta || .7) ? '' : 'warning');
    return h('div', { class: 'meter' + (tom ? ' meter--' + tom : '') },
      op.label ? h('div', { class: 'meter__label' }, h('span', { text: op.label }), h('strong', { text: op.texto || fmt.pct(proporcao) })) : null,
      h('div', { class: 'meter__track', 'aria-hidden': 'true' },
        h('div', { class: 'meter__fill', 'data-w': Math.round(largura) })));
  }

  // Larguras vêm de data-w para não precisar de style inline (a CSP bloqueia).
  function aplicaLarguras(raiz) {
    $$('[data-w]', raiz).forEach((el) => { el.style.width = el.dataset.w + '%'; });
  }

  function bars(itens, formatar) {
    const max = Math.max.apply(null, itens.map((i) => i.valor).concat([0]));
    const ul = h('ul', { class: 'bars', 'aria-hidden': 'true' });
    itens.forEach((i) => {
      ul.appendChild(h('li', null,
        h('span', { text: i.label }),
        h('span', { class: 'bars__track' }, h('span', { class: 'bars__fill', 'data-w': max ? Math.round(i.valor / max * 100) : 0 })),
        h('span', { class: 'bars__value', text: formatar ? formatar(i.valor) : String(i.valor) })));
    });
    return ul;
  }

  /* ------------------------------------------------------------------ Abas */

  /*
   * Abas acessíveis (padrão APG): setas, Home e End trocam de aba.
   * Marcação: [data-tabs] > [role=tablist] > button[role=tab][aria-controls], e os painéis.
   */
  function tabs(raiz, aoTrocar) {
    const lista = raiz.querySelector('[role="tablist"]');
    const abas = $$('[role="tab"]', lista);
    const ativa = (aba, foco) => {
      abas.forEach((a) => {
        const sel = a === aba;
        a.setAttribute('aria-selected', String(sel));
        a.tabIndex = sel ? 0 : -1;
        const painel = document.getElementById(a.getAttribute('aria-controls'));
        if (painel) painel.hidden = !sel;
      });
      if (foco) aba.focus();
      if (raiz.dataset.tabsMemo) store.set('aba:' + raiz.dataset.tabsMemo, aba.id);
      if (aoTrocar) aoTrocar(aba);
    };
    abas.forEach((a, i) => {
      a.addEventListener('click', () => ativa(a));
      a.addEventListener('keydown', (ev) => {
        let alvo = null;
        if (ev.key === 'ArrowRight') alvo = abas[(i + 1) % abas.length];
        else if (ev.key === 'ArrowLeft') alvo = abas[(i - 1 + abas.length) % abas.length];
        else if (ev.key === 'Home') alvo = abas[0];
        else if (ev.key === 'End') alvo = abas[abas.length - 1];
        if (alvo) { ev.preventDefault(); ativa(alvo, true); }
      });
    });
    const pedida = param('aba');
    const lembrada = raiz.dataset.tabsMemo ? store.get('aba:' + raiz.dataset.tabsMemo, null) : null;
    const inicial = abas.find((a) => a.dataset.aba === pedida) || abas.find((a) => a.id === lembrada) || abas[0];
    ativa(inicial);
    return { ativa: (chave) => { const a = abas.find((x) => x.dataset.aba === chave); if (a) ativa(a); } };
  }

  /* ------------------------------------------------------------- Exportação */

  function downloadCsv(nomeArquivo, colunas, linhas) {
    const esc = (v) => {
      const s = v === null || v === undefined ? '' : String(v);
      // Evita injeção de fórmula ao abrir no Excel.
      const seguro = /^[=+\-@]/.test(s) ? "'" + s : s;
      return /[";\n]/.test(seguro) ? '"' + seguro.replace(/"/g, '""') + '"' : seguro;
    };
    const csv = [colunas.map((c) => esc(c.label)).join(';')]
      .concat(linhas.map((r) => colunas.map((c) => esc(c.csv ? c.csv(r) : r[c.key])).join(';')))
      .join('\r\n');
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = h('a', { href: url, download: nomeArquivo });
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('Arquivo ' + nomeArquivo + ' gerado.');
  }

  /* ---------------------------------------------------------- Formulário sujo */

  function guardDirty(form) {
    let sujo = false;
    const marca = () => { sujo = true; };
    form.addEventListener('input', marca);
    form.addEventListener('change', marca);
    window.addEventListener('beforeunload', (ev) => {
      if (!sujo) return;
      ev.preventDefault();
      ev.returnValue = '';
    });
    return { clean() { sujo = false; }, isDirty: () => sujo, mark: marca };
  }

  // Lembra os filtros de uma lista durante a sessão.
  function lembrarFiltros(form, chave) {
    const ler = () => {
      const dados = {};
      $$('input, select', form).forEach((el) => {
        if (!el.name) return;
        if (el.type === 'radio') { if (el.checked) dados[el.name] = el.value; } else if (el.type === 'checkbox') dados[el.name] = el.checked;
        else dados[el.name] = el.value;
      });
      return dados;
    };
    return {
      restore() {
        const salvo = store.get('filtros:' + chave, null);
        if (!salvo) return;
        $$('input, select', form).forEach((el) => {
          if (!el.name || !(el.name in salvo)) return;
          if (el.type === 'radio') el.checked = el.value === salvo[el.name];
          else if (el.type === 'checkbox') el.checked = !!salvo[el.name];
          else el.value = salvo[el.name];
        });
      },
      save() { store.set('filtros:' + chave, ler()); return ler(); },
      read: ler,
      clear() { store.remove('filtros:' + chave); }
    };
  }

  /* --------------------------------------------------- Sessão compartilhada */

  const sessao = {
    get: () => suiteStore.get('sessao', null),
    set: (u) => suiteStore.set('sessao', u),
    clear: () => suiteStore.remove('sessao')
  };

  function usuario() { return sessao.get(); }

  // Sem sessão, volta ao login do produto. Retorna a pessoa logada.
  function requireLogin() {
    const u = sessao.get();
    if (!u) {
      window.location.replace('login.html');
      return null;
    }
    return u;
  }

  function perfilNoApp(u) {
    return (u && u.perfis && u.perfis[APP.chave]) || 'Acesso de demonstração';
  }

  /*
   * Liga o formulário de login padrão da suíte (ids login-*).
   * As pessoas vêm de REDE.pessoas (dados compartilhados e fictícios).
   */
  function loginPage() {
    const form = document.getElementById('login-form');
    const matricula = document.getElementById('login-matricula');
    const senha = document.getElementById('login-senha');
    const verSenha = document.getElementById('login-ver-senha');
    const destino = APP.inicio;

    if (sessao.get()) {
      window.location.replace(destino);
      return;
    }
    applyMasks(form);
    const f = takeFlash();
    if (f) toast(f.mensagem, f.tipo);

    verSenha.addEventListener('click', () => {
      const mostrar = senha.type === 'password';
      senha.type = mostrar ? 'text' : 'password';
      verSenha.setAttribute('aria-pressed', String(mostrar));
      verSenha.setAttribute('aria-label', mostrar ? 'Esconder senha' : 'Mostrar senha');
      verSenha.querySelector('use').setAttribute('href', BASE + 'icons.svg#i-' + (mostrar ? 'eye-off' : 'eye'));
    });

    document.getElementById('login-demo').addEventListener('click', () => {
      matricula.value = window.REDE.pessoas[0].matricula;
      senha.value = 'demo1234';
      clearErrors(form);
      announce('Matrícula e senha de demonstração preenchidas. Agora é só entrar.');
      form.querySelector('[type="submit"]').focus();
    });

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      let pessoa = null;
      const ok = validateForm(form, {
        resumoTitulo: 'Para entrar, confira estes pontos:',
        extra(addErro) {
          if (senha.value && senha.value.length < 6) {
            addErro(senha, 'A senha tem pelo menos 6 caracteres.');
            return;
          }
          if (!valida.matricula(matricula.value) || !senha.value) return;
          pessoa = window.REDE.pessoas.find((p) => p.matricula === matricula.value.trim());
          if (!pessoa) addErro(matricula, 'Não encontramos essa matrícula. Que tal usar o acesso de demonstração?');
          else if (!pessoa.perfis || !pessoa.perfis[APP.chave]) addErro(matricula, 'Essa matrícula não tem acesso ao ' + APP.nome + '. Use o acesso de demonstração.');
        }
      });
      if (!ok) return;
      sessao.set({ matricula: pessoa.matricula, nome: pessoa.nome, perfis: pessoa.perfis });
      window.location.href = destino;
    });
  }

  function sair() {
    sessao.clear();
    window.location.href = 'login.html';
  }

  /* ----------------------------------------------------- Peças da estrutura */

  /*
   * Abre e fecha um painel suspenso: Esc fecha e devolve o foco,
   * clique fora fecha. Retorna { abrir, fechar }.
   */
  function disclosure(botao, painel) {
    const set = (aberto, foco) => {
      painel.hidden = !aberto;
      botao.setAttribute('aria-expanded', String(aberto));
      if (!aberto && foco) botao.focus();
    };
    set(false);
    botao.addEventListener('click', () => set(painel.hidden));
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && !painel.hidden) set(false, true);
    });
    document.addEventListener('click', (ev) => {
      if (!painel.hidden && !painel.contains(ev.target) && !botao.contains(ev.target)) set(false);
    });
    painel.addEventListener('focusout', (ev) => {
      if (!painel.hidden && ev.relatedTarget && !painel.contains(ev.relatedTarget) && ev.relatedTarget !== botao) set(false);
    });
    return { abrir: () => set(true), fechar: () => set(false) };
  }

  // Alternador entre os produtos da suíte (mesma sessão).
  function appSwitcher() {
    const painelId = uid('apps');
    const botao = h('button', { type: 'button', class: 'btn btn--ghost btn--icon', 'aria-label': 'Outros produtos da suíte Orla', 'aria-controls': painelId }, icon('apps'));
    const lista = h('ul');
    APPS.forEach((a) => {
      const atual = a.chave === APP.chave;
      lista.appendChild(h('li', null, h('a', {
        class: 'app-link',
        href: SUITE + a.pasta + '/' + a.inicio,
        'aria-current': atual ? 'page' : null
      },
      h('img', { src: SUITE + a.pasta + '/img/favicon.svg', alt: '', width: '34', height: '34' }),
      h('span', null, h('strong', { text: a.nome }), h('small', { text: a.resumo })))));
    });
    lista.appendChild(h('li', null, h('a', { class: 'app-link', href: SUITE + 'ds/index.html' },
      h('img', { src: BASE + 'favicon.svg', alt: '', width: '34', height: '34' }),
      h('span', null, h('strong', { text: 'Orla DS' }), h('small', { text: 'O design system da suíte' })))));
    const painel = h('div', { class: 'menu__panel', id: painelId },
      h('h2', { text: 'Suíte Orla' }), h('nav', { 'aria-label': 'Produtos da suíte' }, lista));
    const raiz = h('div', { class: 'menu' }, botao, painel);
    disclosure(botao, painel);
    return raiz;
  }

  // Avatar, nome, perfil e botão de sair.
  function userBox(u, classe) {
    return h('div', { class: 'user-box ' + (classe || '') },
      h('span', { class: 'avatar', 'aria-hidden': 'true', text: iniciais(u.nome) }),
      h('span', { class: 'user-box__name' }, h('strong', { text: u.nome }), h('span', { text: perfilNoApp(u) })),
      h('button', { type: 'button', class: 'btn btn--sm user-box__sair', onClick: sair }, icon('logout'), h('span', { class: 'user-box__sair-txt', text: 'Sair' })));
  }

  function brand(classe) {
    return h('a', { class: 'brand ' + (classe || ''), href: APP.inicio },
      h('img', { class: 'brand__mark', src: 'img/favicon.svg', alt: '', width: '36', height: '36' }),
      h('span', { class: 'brand__text' },
        h('span', { class: 'brand__name', text: APP.nome }),
        h('span', { class: 'brand__sub', text: 'Orla Saúde' })));
  }

  /*
   * Gaveta modal para o menu no celular: o resto da página fica inert,
   * Esc fecha e o foco volta ao botão que abriu.
   */
  function drawer(op) {
    const { painel, abrir, fechar, fundo, mq } = op;
    const scrim = h('div', { class: 'scrim', hidden: true });
    document.body.appendChild(scrim);
    const set = (aberto) => {
      painel.classList.toggle('is-open', aberto);
      scrim.hidden = !aberto;
      abrir.setAttribute('aria-expanded', String(aberto));
      if (aberto) {
        fundo.forEach((el) => el.setAttribute('inert', ''));
        painel.setAttribute('role', 'dialog');
        painel.setAttribute('aria-modal', 'true');
        painel.setAttribute('aria-label', op.rotulo || 'Menu');
        fechar.focus();
      } else {
        fundo.forEach((el) => el.removeAttribute('inert'));
        painel.removeAttribute('role');
        painel.removeAttribute('aria-modal');
        painel.removeAttribute('aria-label');
      }
    };
    abrir.setAttribute('aria-expanded', 'false');
    abrir.addEventListener('click', () => set(true));
    fechar.addEventListener('click', () => { set(false); abrir.focus(); });
    scrim.addEventListener('click', () => { set(false); abrir.focus(); });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && painel.classList.contains('is-open')) { set(false); abrir.focus(); }
    });
    if (mq) window.matchMedia(mq).addEventListener('change', (m) => { if (m.matches) set(false); });
    return { set };
  }

  // Rodapé com a nota do case e o botão de restaurar os dados de exemplo.
  function caseNote(alvo, db) {
    const restaurar = h('button', { type: 'button', class: 'btn btn--ghost btn--sm' }, icon('refresh'), 'Restaurar dados de exemplo');
    restaurar.addEventListener('click', async () => {
      const ok = await confirmDialog({
        titulo: 'Restaurar os dados de exemplo?',
        descricao: 'Tudo o que você cadastrou ou alterou no ' + APP.nome + ' nesta aba volta ao estado original. Sua sessão continua aberta.',
        confirmar: 'Restaurar dados',
        tomBotao: 'danger'
      });
      if (!ok) return;
      db.reset();
      flash('Pronto, os dados de exemplo foram restaurados.');
      window.location.reload();
    });
    alvo.classList.add('case-note');
    alvo.replaceChildren(
      h('p', { text: 'Case de UX/UI. A Orla Saúde é uma operadora fictícia que representa a empresa onde o projeto nasceu. Pessoas, prestadores, códigos e valores são de exemplo, e o que você cadastrar fica só nesta aba do navegador.' }),
      restaurar);
  }

  function breadcrumbs(itens) {
    const ol = h('ol');
    itens.forEach((m, i) => {
      const ultimo = i === itens.length - 1;
      ol.appendChild(h('li', null, ultimo || !m.href
        ? h('span', { 'aria-current': ultimo ? 'page' : null, text: m.label })
        : h('a', { href: m.href, text: m.label })));
    });
    return h('nav', { class: 'breadcrumbs', 'aria-label': 'Você está em' }, ol);
  }

  // Finaliza a montagem de qualquer página: título da aba e mensagem pendente.
  function pronto(titulo) {
    if (titulo) document.title = titulo + ' | ' + APP.nome;
    aplicaLarguras(document);
    const f = takeFlash();
    if (f) window.setTimeout(() => toast(f.mensagem, f.tipo), 150);
  }

  /* ---------------------------------------------------- CRUD por esquema */

  /*
   * Lista com busca, filtros, exportação e cadastro em diálogo, a partir de um esquema.
   * Usado nos cadastros de apoio dos três produtos.
   *
   * op: { container, db, colecao, singular, plural, novo ('Nova alçada'),
   *       campos: [{ key, label, tipo, opcoes, required, rules, span, dica, padrao, max, sufixo }],
   *       colunas: [{ key, label, render, num, sort, csv }],
   *       busca: [keys], filtros: [{ key, label, opcoes }],
   *       unicos: [{ keys, msg }], validar(dados, addErro, registro),
   *       podeExcluir(row) => motivo|null, rotulo(row), arquivo, aoMudar() }
   */
  function crud(op) {
    const raiz = op.container;
    const lista = () => op.db.all(op.colecao);
    let destaque = null;

    const buscaId = uid('busca');
    const busca = h('input', { class: 'input', type: 'search', id: buscaId, placeholder: 'Buscar', autocomplete: 'off' });
    const filtrosEls = (op.filtros || []).map((f) => {
      const id = uid('filtro');
      const sel = h('select', { class: 'select select--sm', id, 'aria-label': f.label });
      selectOptions(sel, typeof f.opcoes === 'function' ? f.opcoes() : f.opcoes, f.todos || 'Todos: ' + f.label.toLowerCase());
      if (f.inicial) sel.value = f.inicial;
      sel.addEventListener('change', atualizar);
      return { f, sel };
    });
    busca.addEventListener('input', atualizar);

    const info = h('p', { class: 'toolbar__info', 'aria-live': 'polite' });
    const novo = h('button', { type: 'button', class: 'btn btn--primary', onClick: () => editar(null) }, icon('plus'), op.novo || 'Cadastrar');
    const exportar = h('button', { type: 'button', class: 'btn', onClick: exportarCsv }, icon('download'), 'Exportar CSV');
    const tabelaEl = h('div');

    fill(raiz,
      h('div', { class: 'toolbar' },
        h('div', { class: 'cluster' },
          h('div', { class: 'search' }, h('label', { class: 'visually-hidden', for: buscaId, text: 'Buscar ' + op.plural }), icon('search'), busca),
          filtrosEls.map((x) => x.sel)),
        h('div', { class: 'btn-row' }, exportar, op.somenteLeitura ? null : novo)),
      info,
      tabelaEl);

    const colunas = op.colunas.concat(op.somenteLeitura ? [] : [{
      key: '_acoes',
      label: 'Ações',
      srOnly: true,
      class: 'col-actions',
      render: (r) => h('div', { class: 'btn-row' },
        op.acoesExtras ? op.acoesExtras(r, atualizar) : null,
        h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--sm', 'aria-label': 'Editar ' + op.rotulo(r), onClick: () => editar(r) }, icon('edit')),
        h('button', { type: 'button', class: 'btn btn--ghost btn--icon btn--sm', 'aria-label': 'Excluir ' + op.rotulo(r), onClick: () => excluir(r) }, icon('trash')))
    }]);

    const tabela = dataTable({
      container: tabelaEl,
      caption: op.plural,
      columns: colunas,
      rows: [],
      rowKey: (r) => r.id,
      sortKey: op.sortKey || op.colunas[0].key,
      highlight: (r) => destaque !== null && r.id === destaque,
      emptyTitle: 'Nenhum registro encontrado',
      emptyText: 'Ajuste a busca ou os filtros, ou cadastre um novo.'
    });

    function filtrados() {
      const termo = normaliza(busca.value);
      return lista().filter((r) => {
        if (termo && !(op.busca || []).some((k) => normaliza(r[k]).indexOf(termo) >= 0)) return false;
        return filtrosEls.every(({ f, sel }) => !sel.value || String(f.valor ? f.valor(r) : r[f.key]) === sel.value);
      });
    }

    function atualizar() {
      const linhas = filtrados();
      info.textContent = linhas.length === lista().length
        ? fmt.plural(linhas.length, op.singular, op.plural) + ' no total.'
        : fmt.plural(linhas.length, op.singular, op.plural) + ' de ' + fmt.int(lista().length) + ' com os filtros atuais.';
      tabela.update(linhas);
      aplicaLarguras(raiz);
    }

    function lerValor(campo, form) {
      if (campo.tipo === 'radio') {
        const marcado = form.querySelector('input[name="' + campo.key + '"]:checked');
        return marcado ? marcado.value : '';
      }
      if (campo.tipo === 'checkbox') return !!form.querySelector('[name="' + campo.key + '"]').checked;
      const el = form.querySelector('[name="' + campo.key + '"]');
      if (!el) return null;
      if (campo.tipo === 'money' || campo.tipo === 'decimal') return parseMoney(el.value);
      if (campo.tipo === 'number') return el.value === '' ? null : Number(el.value);
      return el.value.trim();
    }

    function editar(registro) {
      const titulo = registro ? 'Editar ' + op.singular : (op.novo || 'Cadastrar');
      dialog({
        titulo,
        wide: op.campos.length > 4,
        confirmar: registro ? 'Salvar alterações' : 'Cadastrar',
        montar(corpo, fechar, form) {
          const grade = h('div', { class: 'form-grid' });
          op.campos.forEach((c) => {
            const valor = registro ? registro[c.key] : (typeof c.padrao === 'function' ? c.padrao() : c.padrao);
            const opcoes = typeof c.opcoes === 'function' ? c.opcoes() : c.opcoes;
            if (c.tipo === 'radio') {
              grade.appendChild(choiceGroup({ id: uid('f-' + c.key), name: c.key, label: c.label, opcoes, valor, required: c.required, span: c.span, box: true }));
            } else if (c.tipo === 'checkbox') {
              grade.appendChild(h('div', { class: 'field span-' + (c.span || 12) },
                h('label', { class: 'switch' }, h('input', { type: 'checkbox', name: c.key, checked: !!valor }), c.label)));
            } else {
              grade.appendChild(field(Object.assign({}, c, { name: c.key, opcoes, valor, id: uid('f-' + c.key), tipo: c.tipo })));
            }
          });
          corpo.appendChild(grade);
          if (op.aoMontar) op.aoMontar(form, registro);
        },
        aoConfirmar(form) {
          const dados = {};
          op.campos.forEach((c) => { dados[c.key] = lerValor(c, form); });
          const el = (k) => form.querySelector('[name="' + k + '"]');
          const ok = validateForm(form, {
            extra(addErro) {
              (op.unicos || []).forEach((u) => {
                const repetido = lista().find((r) => (!registro || r.id !== registro.id) &&
                  u.keys.every((k) => normaliza(r[k]) === normaliza(dados[k])));
                if (repetido && u.keys.every((k) => dados[k] !== '' && dados[k] !== null)) addErro(el(u.keys[0]), u.msg);
              });
              if (op.validar) op.validar(dados, (k, msg) => addErro(el(k), msg), registro);
            }
          });
          if (!ok) return false;
          return op.antesSalvar ? op.antesSalvar(dados, registro) : dados;
        }
      }).then((dados) => {
        if (!dados) return;
        const salvo = registro ? op.db.update(op.colecao, registro.id, dados) : op.db.insert(op.colecao, dados);
        destaque = salvo.id;
        busca.value = '';
        filtrosEls.forEach(({ sel }) => { sel.value = ''; });
        atualizar();
        toast(registro
          ? 'Alterações salvas em ' + op.rotulo(salvo) + '.'
          : capitaliza(op.singular) + ' ' + op.rotulo(salvo) + (op.feminino ? ' cadastrada' : ' cadastrado') + ' com sucesso.');
        if (op.aoMudar) op.aoMudar();
      });
    }

    async function excluir(r) {
      const motivo = op.podeExcluir ? op.podeExcluir(r) : null;
      if (motivo) {
        await dialog({ titulo: 'Não dá para excluir ' + op.rotulo(r), descricao: motivo, icone: 'lock', somenteOk: true, confirmar: 'Entendi' });
        return;
      }
      const ok = await confirmDialog({
        titulo: 'Excluir ' + op.rotulo(r) + '?',
        descricao: 'Essa ação não pode ser desfeita. Se quiser só tirar de uso, edite o registro.',
        confirmar: 'Excluir',
        tomBotao: 'danger'
      });
      if (!ok) return;
      op.db.remove(op.colecao, r.id);
      atualizar();
      toast(capitaliza(op.singular) + ' excluíd' + (op.feminino ? 'a' : 'o') + '.');
      const alvo = raiz.querySelector('.table-wrap') || busca;
      alvo.focus();
      if (op.aoMudar) op.aoMudar();
    }

    function exportarCsv() {
      const cols = op.colunas.map((c) => ({ label: c.label, key: c.key, csv: c.csv }));
      downloadCsv(op.arquivo || 'cadastro.csv', cols, tabela.rows());
    }

    atualizar();
    return { atualizar, editar };
  }

  const capitaliza = (s) => String(s).charAt(0).toUpperCase() + String(s).slice(1);

  window.DS = {
    BASE, SUITE, APPS, app, get APP() { return APP; },
    store, suiteStore, createDb, rand,
    h, append, fill, icon, uid, param, $, $$,
    fmt, parseMoney, hoje, somaDias, diasEntre, diasAte, trimestre, rotuloTrimestre, normaliza, digitos, iniciais, capitaliza,
    masks, applyMasks, valida, validateForm, clearErrors, setErro, focusField,
    announce, toast, flash, takeFlash, dialog, confirmDialog, field, choiceGroup, selectOptions,
    dataTable, badge, meter, bars, aplicaLarguras, tabs, downloadCsv, guardDirty, lembrarFiltros,
    sessao, usuario, requireLogin, perfilNoApp, loginPage, sair,
    disclosure, appSwitcher, userBox, brand, drawer, caseNote, breadcrumbs, pronto, crud
  };
})();
