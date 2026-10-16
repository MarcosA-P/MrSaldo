/**
 * Módulo de Armazenamento (Store).
 * Centraliza toda a leitura e escrita no localStorage do navegador.
 * Garante que a aplicação busque e salve dados em um só lugar.
 */
window.Store = {
    // Recupera as configurações padrão (salário, poupança, gastos fixos recorrentes)
    getTemplate: function() { 
        return JSON.parse(localStorage.getItem('fin_template')); 
    },
    // Recupera os dados do mês atual em andamento (gastos extras, saldo livre)
    getCurrentMonth: function() { 
        return JSON.parse(localStorage.getItem('fin_current_month')); 
    },
    // Recupera a lista de meses já encerrados e arquivados
    getHistory: function() { 
        return JSON.parse(localStorage.getItem('fin_history')) || []; 
    },
    // Salva todo o estado da aplicação simultaneamente para evitar perda de dados
    saveAll: function(template, currentMonth, historyData) {
        localStorage.setItem('fin_template', JSON.stringify(template));
        localStorage.setItem('fin_current_month', JSON.stringify(currentMonth));
        localStorage.setItem('fin_history', JSON.stringify(historyData));
    }
};