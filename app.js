//Salvamento Local
const save = (k, v) => localStorage.setItem(k, JSON.stringify(v));
const load = (k, d) => {
    try { const v = JSON.parse(localStorage.getItem(k) || "null"); return v ?? d; }
    catch { return d; }
};

//Tema
(function initPrefs() {
    const stored = load('iguacu_dark', null);
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const startDark = stored === null ? prefersDark : !!stored;
    document.documentElement.classList.toggle('dark', startDark);

    //Função do botão de tema
    function bindThemeToggleWhenReady() {
        const btn = document.getElementById('darkToggle');
        if (btn) return attach(btn);

        const mo = new MutationObserver(() => {
            const b = document.getElementById('darkToggle');
            if (b) { mo.disconnect(); attach(b); }
        });
        mo.observe(document.documentElement, { childList: true, subtree: true });
    }

    function attach(btn) {
        const icon = document.getElementById('themeIcon');

        const setDarkPressed = () => {
            const isDark = document.documentElement.classList.contains('dark');
            btn.setAttribute('aria-pressed', String(isDark));
            if (icon) icon.textContent = isDark ? '☀️' : '🌑';
        };

        setDarkPressed();
        btn.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            save('iguacu_dark', document.documentElement.classList.contains('dark'));
            setDarkPressed();
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bindThemeToggleWhenReady);
    } else {
        bindThemeToggleWhenReady();
    }

    let fontScale = Number(load('iguacu_font', 100));
    const apply = () => document.documentElement.style.fontSize = fontScale + '%';
    apply();
    document.getElementById('fontUp')?.addEventListener('click', () => {
        fontScale = Math.min(140, fontScale + 10); save('iguacu_font', fontScale); apply();
    });
    document.getElementById('fontDown')?.addEventListener('click', () => {
        fontScale = Math.max(90, fontScale - 10); save('iguacu_font', fontScale); apply();
    });
})();

//Cadastro
(function initCadastro() {
    const form = document.getElementById('cadastroForm');
    if (!form) return;
    const key = 'iguacu_usuarios';
    const tbody = document.querySelector('#usuariosTabela tbody');

    const rows = arr => arr.map(u => `
    <tr>
      <td>${u.nome}</td><td>${u.email}</td>
      <td>${new Date(u.criadoEm).toLocaleString()}</td>
      <td><button class="btn" data-del="${u.id}">Excluir</button></td>
    </tr>`).join('');

    function render() {
        const data = load(key, []);
        tbody.innerHTML = data.length ? rows(data) : `<tr><td colspan="4">Nenhum usuário cadastrado.</td></tr>`;
    }

    document.getElementById('verSenha')?.addEventListener('click', () => {
        const input = document.getElementById('fSenha');
        const show = input.type === 'password'; input.type = show ? 'text' : 'password';
        document.getElementById('verSenha').textContent = show ? 'Ocultar senha' : 'Mostrar senha';
    });

    form.addEventListener('submit', e => {
        e.preventDefault();
        const nome = document.getElementById('fNome').value.trim();
        const email = document.getElementById('fEmail').value.trim();
        const senha = document.getElementById('fSenha').value;
        const aceita = document.getElementById('fAceita').checked;
        if (!nome || !/.+@.+\..+/.test(email) || senha.length < 6 || !aceita) return;

        const lista = load(key, []);
        lista.push({ id: crypto.randomUUID(), nome, email, senha, criadoEm: new Date().toISOString() });
        save(key, lista); form.reset(); render();
        const msg = document.getElementById('msg');
        if (msg) { msg.textContent = 'Cadastro Salvo Apenas Localmente Para Demonstração!'; setTimeout(() => msg.textContent = '', 3000); }
    });

    tbody.addEventListener('click', e => {
        const btn = e.target.closest('[data-del]'); if (!btn) return;
        let lista = load(key, []); lista = lista.filter(u => u.id !== btn.dataset.del); save(key, lista); render();
    });

    render();
})();

//Calculadora
(function initCalcSolar() {
    const form = document.getElementById('calcForm');
    if (!form) return;

    const getNum = (id, fallback = 0) => {
        const raw = (document.getElementById(id).value || '').toString().replace(/\./g, '').replace(',', '.');
        const n = Number(raw);
        return Number.isFinite(n) ? n : fallback;
    };
    const set = (id, v) => document.getElementById(id).textContent = v;

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const conta = Math.max(0, getNum('fConta', 0));
        const tarifa = Math.max(0.5, getNum('fTarifa', 1.20));
        const hsp = Math.min(6, Math.max(3, getNum('fHsp', 4.8)));
        const pr = Math.min(0.9, Math.max(0.6, getNum('fPR', 0.78)));
        const wp = Math.max(330, getNum('fWp', 330));
        const meta = Math.min(100, Math.max(40, getNum('fMeta', 45)));

        //Consumo, Geração, Produção
        const consumo = conta / tarifa;
        const geracaoAlvo = consumo * (meta / 100);
        const prodPorKwp = hsp * 30 * pr;
        const kwp = geracaoAlvo / prodPorKwp;

        //Módulos e área
        const modKw = wp / 1000;
        const modQtd = Math.max(1, Math.ceil(kwp / modKw));
        const area = Math.round(modQtd * 2);

        //Economia
        const econAnual = conta * 12 * (meta / 100);
        const custoSistema = kwp * 3500;
        const paybackMeses = Math.max(1, Math.round((custoSistema / econAnual) * 12));

        const f2 = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        const r$ = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        set('rConsumo', f2(consumo));
        set('rGeracao', f2(geracaoAlvo));
        set('rKwp', f2(kwp));
        set('rMod', String(modQtd));
        set('rArea', String(area));
        set('rEcon', r$(econAnual));
        set('rCusto', r$(custoSistema));
        set('rPayback', String(paybackMeses));

        if (document.getElementById('rProdMensal')) {
            const prodMensal = kwp * prodPorKwp;
            set('rProdMensal', f2(prodMensal));
        }
        if (document.getElementById('rPrecoMin') && document.getElementById('rPrecoMax')) {
            const precoMin = kwp * 3000, precoMax = kwp * 3600;
            set('rPrecoMin', r$(precoMin));
            set('rPrecoMax', r$(precoMax));
        }
    });
})();
//Calculo usando o CEP
(function initCalcCEP() {
    const form = document.getElementById('calcForm');
    if (!form) return;

    const el = id => document.getElementById(id);
    const set = (id, v) => el(id).textContent = v;

    function cepToUF(cep) {
        const n = parseInt(String(cep).replace(/\D/g, ''), 10);
        if (isNaN(n)) return null;
        if (n >= 1000000 && n <= 19999999) return 'SP';
        if (n >= 20000000 && n <= 28999999) return 'RJ';
        if (n >= 29000000 && n <= 29999999) return 'ES';
        if (n >= 30000000 && n <= 39999999) return 'MG';
        if (n >= 40000000 && n <= 48999999) return 'BA';
        if (n >= 49000000 && n <= 49999999) return 'SE';
        if (n >= 50000000 && n <= 56999999) return 'PE';
        if (n >= 57000000 && n <= 57999999) return 'AL';
        if (n >= 58000000 && n <= 58999999) return 'PB';
        if (n >= 59000000 && n <= 59999999) return 'RN';
        if (n >= 60000000 && n <= 63999999) return 'CE';
        if (n >= 64000000 && n <= 64999999) return 'PI';
        if (n >= 65000000 && n <= 65999999) return 'MA';
        if (n >= 66000000 && n <= 68899999) return 'PA';
        if (n >= 68900000 && n <= 68999999) return 'AP';
        if (n >= 69000000 && n <= 69299999) return 'AM';
        if (n >= 69300000 && n <= 69389999) return 'RR';
        if (n >= 69400000 && n <= 69899999) return 'AM';
        if (n >= 69900000 && n <= 69999999) return 'AC';
        if (n >= 70000000 && n <= 73699999) return 'DF';
        if (n >= 73700000 && n <= 76799999) return 'GO';
        if (n >= 76800000 && n <= 76999999) return 'RO';
        if (n >= 77000000 && n <= 77999999) return 'TO';
        if (n >= 78000000 && n <= 78899999) return 'MT';
        if (n >= 79000000 && n <= 79999999) return 'MS';
        if (n >= 80000000 && n <= 87999999) return 'PR';
        if (n >= 88000000 && n <= 89999999) return 'SC';
        if (n >= 90000000 && n <= 99999999) return 'RS';
        return null;
    }

    const HSP_UF = {
        AC: 4.5, AL: 5.4, AM: 4.4, AP: 4.7, BA: 5.3, CE: 5.6, DF: 5.5, ES: 4.8,
        GO: 5.5, MA: 5.4, MG: 5.0, MS: 5.5, MT: 5.6, PA: 5.0, PB: 5.5, PE: 5.7,
        PI: 5.7, PR: 4.6, RJ: 4.8, RN: 5.6, RO: 5.0, RR: 4.8, RS: 4.3, SC: 4.5,
        SE: 5.3, SP: 4.7, TO: 5.5
    };

    const DIST = {
        RJ: [{ n: 'LIGHT', t: 1.20 }, { n: 'ENEL RJ', t: 1.18 }],
        SP: [{ n: 'ENEL SP', t: 1.05 }, { n: 'CPFL', t: 1.09 }, { n: 'EDP SP', t: 1.08 }],
        MG: [{ n: 'CEMIG', t: 1.10 }],
        ES: [{ n: 'EDP ES', t: 1.08 }],
        PR: [{ n: 'COPEL', t: 1.05 }],
        SC: [{ n: 'CELESC', t: 1.05 }],
        RS: [{ n: 'CEEE/Equatorial', t: 1.04 }],
        DF: [{ n: 'Neoenergia Brasília', t: 1.10 }],
        GO: [{ n: 'ENEL GO', t: 1.12 }],
        BA: [{ n: 'COELBA', t: 1.12 }],
        PE: [{ n: 'CELPE/Neoenergia', t: 1.15 }],
        CE: [{ n: 'ENEL CE', t: 1.12 }],
        XX: [{ n: 'Ajustado Automaticamente', t: 1.10 }]
    };

    const ufLabel = el('ufLabel');
    const selCons = el('fCompanhia');

    function popularCompanhia(uf) {
        const arr = DIST[uf] || DIST.XX;
        selCons.innerHTML = arr.map((d, i) => `<option value="${i}">${d.n}</option>`).join('');
        el('fTarifa').value = (arr[0]?.t ?? 1.10).toFixed(2);
    }

    function onCepChange() {
        const uf = cepToUF(el('fCEP').value);
        ufLabel.textContent = uf || '—';
        if (uf && HSP_UF[uf]) el('fHsp').value = HSP_UF[uf].toFixed(1);
        popularCompanhia(uf || 'XX');
    }

    el('fCEP').addEventListener('input', onCepChange);
    el('fCEP').addEventListener('blur', onCepChange);

    selCons.addEventListener('change', () => {
        const uf = ufLabel.textContent;
        const arr = DIST[uf] || DIST.XX;
        const i = parseInt(selCons.value, 10) || 0;
        if (arr[i]) el('fTarifa').value = arr[i].t.toFixed(2);
    });

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const conta = Math.max(0, Number(el('fConta').value) || 0);
        const tarifa = Math.max(0.5, Number(el('fTarifa').value) || 1.20);
        const hsp = Math.min(6, Math.max(3, Number(el('fHsp').value) || 4.8));
        const pr = Math.min(0.9, Math.max(0.6, Number(el('fPR').value) || 0.78));
        const wp = Math.max(330, Number(el('fWp').value) || 330);
        const meta = Math.min(100, Math.max(40, Number(el('fMeta').value) || 45));


        //Consumo, Produção e Geração e Mensal
        const consumo = conta / tarifa;
        const prodPorKwp = hsp * 30 * pr;
        const geracaoAlvo = consumo * (meta / 100);
        const kwp = geracaoAlvo / prodPorKwp;
        const prodMensal = kwp * prodPorKwp;

        //Módulos e área
        const modKw = wp / 1000;
        const modQtd = Math.max(1, Math.ceil(kwp / modKw));
        const area = Math.round(modQtd * 2);

        //Economia
        const econAnual = conta * 12 * (meta / 100);
        const precoMin = kwp * 3000;
        const precoMax = kwp * 3600;
        const paybackMeses = Math.max(1, Math.round((((precoMin + precoMax) / 2) / econAnual) * 12));

        const f2 = n => n.toLocaleString('pt-BR', { maximumFractionDigits: 2 });
        const r$ = n => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

        set('rProdMensal', f2(prodMensal));
        set('rEconAnual', r$(econAnual));
        set('rPayback', String(paybackMeses));

        set('rArea', String(area));
        set('rKwp', f2(kwp));
        set('rMod', String(modQtd));
        set('rConsumo', f2(consumo));

        set('rPrecoMin', r$(precoMin));
        set('rPrecoMax', r$(precoMax));
    });

    popularCompanhia('XX');
})();