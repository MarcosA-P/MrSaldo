/**
 * Módulo de Interface do Usuário (UI).
 * Centraliza a escuta de eventos (cliques, formulários) e a renderização das telas.
 * Comunica as ações do usuário ao controlador principal (app.js) através de 'handlers'.
 */
window.UI = {
    // Configura os escutadores de eventos de toda a aplicação (delegação de eventos)
    setupEvents: function(handlers) {
        // Alternar entre abas (Histórico, Home, Extras) na navegação inferior
        document.querySelectorAll('.nav-item').forEach(nav => {
            nav.addEventListener('click', (e) => {
                const target = e.currentTarget.dataset.target;
                this.switchView(target, e.currentTarget);
            });
        });

        // Formulário para registrar um novo gasto extra
        const formGasto = document.getElementById('formGasto');
        if(formGasto) {
            formGasto.addEventListener('submit', (e) => {
                e.preventDefault();
                const nInput = document.getElementById('gastoNome');
                const vInput = document.getElementById('gastoValor');
                handlers.onAddGasto(nInput.value.trim(), parseFloat(vInput.value));
                
                // Limpa os campos após registro
                nInput.value = ''; 
                vInput.value = '';

                // Feedback visual temporário no botão
                const btn = e.target.querySelector('button');
                const originalText = btn.innerText;
                btn.innerText = "✓ Adicionado!";
                btn.style.background = "var(--accent-green)";
                setTimeout(() => {
                    btn.innerText = originalText;
                    btn.style.background = "";
                }, 1500);
            });
        }

        // Exclusão de gastos avulsos da aba Extras
        document.getElementById('listaGastos').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-del');
            if(btn) handlers.onRemoveGasto(btn.dataset.index);
        });

        // Abertura de gaveta (Drawer) para configuração de gastos fixos
        document.getElementById('btnOpenConfig').addEventListener('click', () => {
            handlers.onOpenConfig();
        });
        
        // Fechamento genérico de qualquer gaveta (Drawer)
        document.querySelectorAll('.btn-close-drawer').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.closeDrawer(e.currentTarget.dataset.drawer);
            });
        });

        // Adição de novos campos dinâmicos na lista de configuração de despesas fixas
        document.getElementById('btnAddFixoRow').addEventListener('click', () => {
            const list = document.getElementById('cfgGastosFixosList');
            list.insertAdjacentHTML('beforeend', this.getFixoRowHtml());
        });

        // Remoção de campo específico na lista de configuração de despesas fixas
        document.getElementById('cfgGastosFixosList').addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-remove-fixo');
            if(btn) btn.parentElement.remove();
        });

        // Salva as configurações de gastos fixos
        document.getElementById('formConfig').addEventListener('submit', (e) => {
            e.preventDefault();
            const s = parseFloat(document.getElementById('cfgSalario').value) || 0;
            const p = parseFloat(document.getElementById('cfgPoupanca').value) || 0;
            const rows = document.querySelectorAll('#cfgGastosFixosList .input-row');
            const newFixos = [];
            
            rows.forEach((r, idx) => {
                const n = r.querySelector('.cfg-nome').value.trim();
                const v = parseFloat(r.querySelector('.cfg-val').value) || 0;
                if(n && v >= 0) newFixos.push({ id: 'f'+Date.now()+idx, nome: n, valor: v });
            });
            handlers.onSaveConfig(s, p, newFixos);
            this.closeDrawer('configDrawer');
        });

        // Evento principal para arquivar/encerrar o mês ativo
        document.getElementById('btnResetMes').addEventListener('click', () => {
            handlers.onResetMonth();
        });

        // Evento de importação manual de backup (JSON)
        document.getElementById('fileImport').addEventListener('change', (e) => {
            const file = e.target.files[0];
            if(file) handlers.onImportBackup(file);
            e.target.value = '';
        });

        // Cliques na lista da aba Histórico (Ver detalhes ou Excluir mês)
        document.getElementById('listaMesesArquivados').addEventListener('click', (e) => {
            // Verifica se o clique foi no botão de exclusão
            const btnDel = e.target.closest('.btn-del-month');
            if(btnDel) {
                e.stopPropagation(); // Evita que a gaveta de detalhes seja aberta ao clicar no X
                handlers.onDeleteMonth(btnDel.dataset.id);
                return;
            }

            // Verifica se o clique foi no item da lista para abrir detalhes
            const item = e.target.closest('.history-item.clickable');
            if(item) handlers.onShowMonthDetail(item.dataset.id);
        });
    },

    // Alterna a aba ativa e ajusta a exibição do botão superior e título
    switchView: function(viewId, navElement) {
        document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
        document.getElementById(viewId).classList.add('active');
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        if(navElement) navElement.classList.add('active');

        const btnReset = document.getElementById('btnResetMes');
        const topTitle = document.getElementById('topBarTitle');

        if (viewId === 'view-home') {
            btnReset.style.display = 'inline-flex';
            topTitle.innerText = 'MrSaldo';
        } else if (viewId === 'view-history') {
            btnReset.style.display = 'none';
            topTitle.innerText = 'Histórico';
        } else if (viewId === 'view-extras') {
            btnReset.style.display = 'none';
            topTitle.innerText = 'Extras';
        }
    },

    // Abre uma tela sobreposta (Drawer)
    openDrawer: function(id) { 
        document.getElementById(id).classList.add('active'); 
    },
    
    // Fecha uma tela sobreposta (Drawer)
    closeDrawer: function(id) { 
        document.getElementById(id).classList.remove('active'); 
    },

    // Retorna o template HTML de uma linha de despesa fixa
    getFixoRowHtml: function(nome='', valor='') {
        return `
          <div class="input-row">
            <input type="text" class="cfg-nome" value="${nome}" placeholder="Nome (Ex: Internet)" required>
            <input type="number" class="cfg-val" value="${valor}" placeholder="R$" step="0.01" style="max-width: 100px;" required>
            <button type="button" class="btn-secondary btn-remove-fixo" style="padding:0 12px; height:44px; color:var(--accent-red); border:none; background:#21262d;">🗑</button>
          </div>`;
    },

    // Atualiza as estatísticas financeiras na aba Home
    renderHome: function(summary, currentMonth) {
        const elLivre = document.getElementById('dispLivre');
        elLivre.innerText = Finance.formatBRL(summary.saldoRestante);
        elLivre.className = 'hero-amount ' + (summary.saldoRestante < 0 ? 'negative' : '');
        
        document.getElementById('dispTotalGastosExtra').innerText = Finance.formatBRL(summary.totalGastosExtras);
        const diasRestantes = Finance.getDiasRestantesNoMes();
        document.getElementById('dispDiario').innerText = Finance.formatBRL(summary.saldoRestante > 0 ? (summary.saldoRestante / diasRestantes) : 0);

        const pct = summary.orcamentoInicialLivre > 0 ? Math.max(0, Math.min(100, (summary.saldoRestante / summary.orcamentoInicialLivre) * 100)) : 0;
        const bar = document.getElementById('barFill');
        bar.style.width = pct + '%';
        bar.style.background = pct > 50 ? '#2ea043' : (pct > 20 ? '#d29922' : '#f85149');

        document.getElementById('pillSalario').innerText = Finance.formatBRL(Number(currentMonth.salario));
        document.getElementById('pillPoupanca').innerText = Finance.formatBRL(Number(currentMonth.poupanca));
        document.getElementById('pillFixos').innerText = Finance.formatBRL(summary.fixosTotal);
    },

    // Renderiza a lista de gastos do mês na aba Extras
    renderExtras: function(gastosExtras) {
        const lista = document.getElementById('listaGastos');
        lista.innerHTML = '';
        if (gastosExtras.length === 0) {
            lista.innerHTML = '<div class="empty-state">Nenhum gasto avulso registrado ainda este mês! 🎉</div>';
        } else {
            gastosExtras.forEach((gasto, index) => {
                lista.insertAdjacentHTML('beforeend', `
                <li class="history-item">
                    <div class="history-info">
                        <span class="history-name">${gasto.nome}</span>
                        <span class="history-date">${gasto.data}</span>
                    </div>
                    <div class="history-right">
                        <span class="history-val">- ${Finance.formatBRL(Number(gasto.valor))}</span>
                        <button class="btn-del" data-index="${index}">✕</button>
                    </div>
                </li>`);
            });
        }
    },

    // Renderiza a lista de meses arquivados na aba Histórico com botão de exclusão
    renderHistoryList: function(historyData) {
        const list = document.getElementById('listaMesesArquivados');
        list.innerHTML = '';
        if(historyData.length === 0) {
            list.innerHTML = '<div class="empty-state">Nenhum mês arquivado ainda.</div>';
        } else {
            historyData.slice().reverse().forEach(m => {
                const fixosTotal = m.gastosFixos.reduce((a,i) => a + Number(i.valor), 0);
                const extrasTotal = m.gastosExtras.reduce((a,i) => a + Number(i.valor), 0);
                const total = fixosTotal + extrasTotal;
                list.insertAdjacentHTML('beforeend', `
                <li class="history-item clickable" data-id="${m.id}">
                    <div class="history-info">
                        <span class="history-name">${m.monthLabel}</span>
                        <span class="history-date">Gasto Total: ${Finance.formatBRL(total)}</span>
                    </div>
                    <div class="history-right" style="display: flex; align-items: center; gap: 12px;">
                        <span style="color:var(--text-muted); font-size:12px;">Ver ➔</span>
                        <button class="btn-del btn-del-month" data-id="${m.id}" title="Excluir Mês" style="background: rgba(248,81,73,0.1); color: var(--accent-red); padding: 6px 10px; border-radius: 6px; font-size: 14px; display: flex; align-items: center; justify-content: center;">✕</button>
                    </div>
                </li>`);
            });
        }
    },

    // Preenche a gaveta de configurações com as despesas fixas cadastradas
    renderConfigDrawer: function(template) {
        document.getElementById('cfgSalario').value = template.salario;
        document.getElementById('cfgPoupanca').value = template.poupanca;
        const list = document.getElementById('cfgGastosFixosList');
        list.innerHTML = '';
        template.gastosFixos.forEach(item => {
            list.insertAdjacentHTML('beforeend', this.getFixoRowHtml(item.nome, item.valor));
        });
        this.openDrawer('configDrawer');
    },

    // Popula a gaveta de detalhes de um mês do histórico
    renderMonthDetail: function(m) {
        document.getElementById('mdTitle').innerText = m.monthLabel;
        document.getElementById('mdSalario').innerText = Finance.formatBRL(Number(m.salario));
        document.getElementById('mdPoupanca').innerText = Finance.formatBRL(Number(m.poupanca));
        document.getElementById('mdFixos').innerText = Finance.formatBRL(m.gastosFixos.reduce((a,i)=>a+Number(i.valor),0));
        
        const fList = document.getElementById('mdFixosList'); 
        fList.innerHTML='';
        m.gastosFixos.forEach(f => fList.insertAdjacentHTML('beforeend', `<li class="history-item"><span class="history-name" style="font-size:13px;">${f.nome}</span><span class="history-val" style="font-size:13px;">${Finance.formatBRL(Number(f.valor))}</span></li>`));
        
        const eList = document.getElementById('mdExtrasList'); 
        eList.innerHTML='';
        if(m.gastosExtras.length===0) eList.innerHTML='<div class="empty-state" style="padding:10px 0;">Sem gastos extras.</div>';
        m.gastosExtras.forEach(e => eList.insertAdjacentHTML('beforeend', `<li class="history-item"><div class="history-info"><span class="history-name" style="font-size:13px;">${e.nome}</span><span class="history-date" style="font-size:10px;">${e.data}</span></div><span class="history-val" style="font-size:13px;">- ${Finance.formatBRL(Number(e.valor))}</span></li>`));

        this.openDrawer('monthDetailDrawer');
    }
};