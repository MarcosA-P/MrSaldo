/**
 * Módulo Financeiro (Finance).
 * Responsável exclusivo por cálculos, formatações de moeda e datas.
 * Não interage com a interface (DOM) nem com o armazenamento local.
 */
window.Finance = {
    // Formata valores numéricos para o padrão brasileiro (R$ 0,00)
    formatBRL: function(val) { 
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); 
    },
    // Calcula a quantidade de dias restantes no mês corrente
    getDiasRestantesNoMes: function() {
        const hoje = new Date();
        const fimDoMes = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
        return Math.max(1, fimDoMes.getDate() - hoje.getDate() + 1);
    },
    // Converte a primeira letra da string para maiúscula (capitalização)
    capitalizeFirst: function(str) { 
        return str.charAt(0).toUpperCase() + str.slice(1); 
    },
    // Gera o nome amigável do mês ativo, ex: "Outubro de 2026"
    generateMonthLabel: function() { 
        return this.capitalizeFirst(new Date().toLocaleDateString('pt-BR', {month: 'long', year: 'numeric'})); 
    },
    // Calcula os totais do mês ativo e retorna os resumos financeiros consolidados
    calculateSummary: function(currentMonth) {
        const fixosTotal = currentMonth.gastosFixos.reduce((acc, i) => acc + Number(i.valor), 0);
        const orcamentoInicialLivre = Number(currentMonth.salario) - Number(currentMonth.poupanca) - fixosTotal;
        const totalGastosExtras = currentMonth.gastosExtras.reduce((acc, i) => acc + Number(i.valor), 0);
        const saldoRestante = orcamentoInicialLivre - totalGastosExtras;
        return { fixosTotal, orcamentoInicialLivre, totalGastosExtras, saldoRestante };
    }
};