/**
 * Módulo Principal (App).
 * Orquestra as ações do usuário (handlers), integra o estado da aplicação
 * e controla as atualizações visuais. Não acessa o localStorage diretamente.
 */
(function(Store, Finance, UI) {
    let template = Store.getTemplate();
    let currentMonth = Store.getCurrentMonth();
    let historyData = Store.getHistory();

    // Cria as configurações e dados de mês inicial se o usuário estiver acessando pela primeira vez
    function initDefaults() {
        if (!template) {
            template = {
                salario: 1500, poupanca: 1000, 
                gastosFixos: [
                    {id: 'f1', nome: 'Internet', valor: 60}, {id: 'f2', nome: 'Ajuda Água e Luz', valor: 50},
                    {id: 'f3', nome: 'Cabelo', valor: 40}, {id: 'f4', nome: 'Fatura do Cartão', valor: 200}
                ]
            };
        }
        if (!currentMonth) {
            startNewMonth();
        }
    }

    // Inicializa os dados de um novo mês preservando as configurações fixas do template
    function startNewMonth() {
        currentMonth = {
            id: "mes_" + Date.now(),
            monthLabel: Finance.generateMonthLabel(),
            salario: template.salario,
            poupanca: template.poupanca,
            gastosFixos: JSON.parse(JSON.stringify(template.gastosFixos)),
            gastosExtras: []
        };
        Store.saveAll(template, currentMonth, historyData);
    }

    // Processa os dados financeiros do mês e aciona a UI para atualizar as views
    function updateApp() {
        const summary = Finance.calculateSummary(currentMonth);
        UI.renderHome(summary, currentMonth);
        UI.renderExtras(currentMonth.gastosExtras);
        UI.renderHistoryList(historyData);
    }

    // Funções executadas em resposta a ações na Interface do Usuário
    const handlers = {
        // Registra um gasto avulso no mês vigente
        onAddGasto(nome, valor) {
            currentMonth.gastosExtras.unshift({
                nome: nome,
                valor: valor,
                data: new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
            });
            Store.saveAll(template, currentMonth, historyData);
            updateApp();
        },
        // Remove um gasto avulso específico do mês vigente
        onRemoveGasto(index) {
            if (confirm('Deseja remover este gasto?')) {
                currentMonth.gastosExtras.splice(index, 1);
                Store.saveAll(template, currentMonth, historyData);
                updateApp();
            }
        },
        // Abre o menu lateral para alterar as despesas base
        onOpenConfig() {
            UI.renderConfigDrawer(template);
        },
        // Atualiza e salva o cadastro base de despesas fixas (futuras e mês atual)
        onSaveConfig(salario, poupanca, fixos) {
            template.salario = salario; 
            template.poupanca = poupanca; 
            template.gastosFixos = fixos;
            
            currentMonth.salario = salario; 
            currentMonth.poupanca = poupanca; 
            currentMonth.gastosFixos = JSON.parse(JSON.stringify(fixos));
            
            Store.saveAll(template, currentMonth, historyData);
            updateApp();
        },
        // Executa o arquivamento seguro do mês ativo para o histórico
        onResetMonth() {
            if (!confirm("Tem certeza que deseja encerrar o mês atual?\nOs dados serão arquivados de forma segura e iniciaremos um novo mês com os gastos extras zerados.")) return;
            
            try {
                // 1. Gera o arquivo backup JSON do mês
                const jsonStr = JSON.stringify(currentMonth, null, 2);
                const blob = new Blob([jsonStr], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `gastos_${currentMonth.monthLabel.replace(/\s+/g, '_').toLowerCase()}_${currentMonth.id}.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);

                // 2. Salva os dados no histórico de meses internos do app
                const existsIdx = historyData.findIndex(h => h.id === currentMonth.id);
                if (existsIdx >= 0) historyData[existsIdx] = JSON.parse(JSON.stringify(currentMonth));
                else historyData.push(JSON.parse(JSON.stringify(currentMonth)));
                
                // 3. Libera o mês atual para reiniciar
                startNewMonth();
                updateApp();
                
                alert("Mês arquivado com sucesso! Os gastos extras foram zerados e você está pronto para o novo período.");
            } catch (err) {
                console.error(err);
                alert("Falha ao salvar o histórico. Os dados atuais não foram apagados para evitar perdas.");
            }
        },
        // Remove permanentemente um mês salvo na aba de Histórico
        onDeleteMonth(monthId) {
            if (confirm("Tem certeza que deseja excluir este mês do histórico?\nEsta ação não afeta seus gastos fixos ou mês atual, mas os dados arquivados deste mês serão apagados.")) {
                historyData = historyData.filter(m => m.id !== monthId);
                Store.saveAll(template, currentMonth, historyData);
                updateApp();
            }
        },
        // Lê um arquivo `.json` validado do histórico e insere localmente
        onImportBackup(file) {
            const reader = new FileReader();
            reader.onload = function(evt) {
                try {
                    const data = JSON.parse(evt.target.result);
                    if (data.id && data.monthLabel && data.gastosExtras && data.gastosFixos) {
                        if (historyData.some(h => h.id === data.id)) {
                            alert("Este mês já está presente no histórico!");
                        } else {
                            historyData.push(data);
                            Store.saveAll(template, currentMonth, historyData);
                            updateApp();
                            alert("Mês importado e adicionado ao histórico com sucesso!");
                        }
                    } else alert("Arquivo de backup inválido ou incompatível.");
                } catch(err) { alert("Erro ao ler o arquivo JSON."); }
            };
            reader.readAsText(file);
        },
        // Exibe a tela em gaveta com detalhes estáticos de um mês passado
        onShowMonthDetail(monthId) {
            const m = historyData.find(x => x.id === monthId);
            if(m) UI.renderMonthDetail(m);
        }
    };

    // Ponto de entrada: inicia valores base e configura eventos de clique
    initDefaults();
    UI.setupEvents(handlers);
    updateApp();

    // Serviço Offline (PWA)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => { 
            navigator.serviceWorker.register('./sw.js').catch(err => console.error('SW falhou', err)); 
        });
    }

})(window.Store, window.Finance, window.UI);