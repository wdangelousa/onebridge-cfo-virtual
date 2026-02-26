import React from 'react';
import { DistributionResult, FinancialData, TransactionType } from '../types';
import { Download, FileText } from 'lucide-react';

interface Props {
    result: DistributionResult;
    transactions: FinancialData[];
}

export const PnLStatement: React.FC<Props> = ({ result, transactions }) => {

    const exportToAccountingCSV = (transactions: FinancialData[]) => {
        // CSV Header: QuickBooks / Xero standard
        const headers = ['Date', 'Description', 'Account/Category', 'Amount', 'Memo'];

        const rows = transactions.map(t => {
            const date = t.date ? new Date(t.date).toLocaleDateString('en-US') : '';
            const description = t.description || '';
            const category = t.type === TransactionType.REVENUE ? (t.serviceType || 'Revenue') : 'Expense';

            // Revenue is positive, Expenses (COGS/OpEx) are negative
            let amount = 0;
            if (t.type === TransactionType.REVENUE) {
                amount = t.grossRevenue;
            } else {
                // For accounting, we sum the total outflow (provisions + taxes + comm)
                amount = -(t.provisions + t.govTaxes + t.externalCommission);
            }

            const memo = `Currency: ${t.currency}${t.exchangeRateUsed ? ` | Rate: ${t.exchangeRateUsed}` : ''}`;

            return [
                `"${date}"`,
                `"${description.replace(/"/g, '""')}"`,
                `"${category}"`,
                amount.toFixed(2),
                `"${memo.replace(/"/g, '""')}"`
            ].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `accounting_export_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-slate-400" />
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">DRE - P&L Statement</h3>
                </div>
                <button
                    onClick={() => exportToAccountingCSV(transactions)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                >
                    <Download className="w-3.5 h-3.5" />
                    Exportar CSV (CPA)
                </button>
            </div>

            <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Receita Bruta (Gross)</p>
                        <p className="text-xl font-bold text-slate-900">{formatCurrency(result.grossTotal)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Custos & Despesas</p>
                        <p className="text-xl font-bold text-red-600">{formatCurrency(result.totalExpenses)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Lucro Líquido (Net)</p>
                        <p className="text-xl font-bold text-emerald-600">{formatCurrency(result.netIncome)}</p>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                    <div className="flex justify-between items-center text-xs text-slate-500">
                        <span>Margem Operacional: {result.grossTotal > 0 ? ((result.netIncome / result.grossTotal) * 100).toFixed(1) : '0'}%</span>
                        <span className="italic text-[10px]">Data ready for QuickBooks / Xero import</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
