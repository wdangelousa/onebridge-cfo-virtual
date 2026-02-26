import React from 'react';
import { DistributionResult } from '../types';
import { PieChart, Landmark, Users, ArrowDown, Calendar, TrendingUp, TrendingDown, AlertTriangle, FileCheck, FileBarChart } from 'lucide-react';
import { CashFlowChart } from './CashFlowChart';
import { PnLStatement } from './PnLStatement';

interface Props {
  result: DistributionResult;
  transactions: FinancialData[];
  userRole: 'admin' | 'viewer';
  onGenerateReport: () => void;
}

export const DistributionResults: React.FC<Props> = ({ result, transactions, userRole, onGenerateReport }) => {

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const isNegative = result.netIncome < 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden h-full flex flex-col">
      <div className="p-6 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Fechamento Financeiro
          </h2>
          <p className="text-sm text-slate-500 mt-1">Consolidado de Receitas e Despesas</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <p className="text-xs uppercase text-slate-400 font-bold">Saldo do Período</p>
            <p className={`text-xl font-bold ${isNegative ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(result.netIncome)}
            </p>
          </div>

          <button
            onClick={onGenerateReport}
            className="flex items-center gap-1.5 px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold uppercase rounded border border-blue-200 transition-colors"
            title="Gerar Relatório Completo"
          >
            <FileBarChart className="w-3 h-3" />
            Relatório
          </button>
        </div>
      </div>

      <div className="p-6 flex-grow overflow-auto">
        <CashFlowChart result={result} />

        <div className="mb-6">
          <PnLStatement result={result} transactions={transactions} />
        </div>

        <div className="space-y-4">

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold text-emerald-800 uppercase">Receita Bruta</span>
              </div>
              <span className="text-lg font-bold text-emerald-900">{formatCurrency(result.grossTotal)}</span>
            </div>
            <div className="p-4 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                <TrendingDown className="w-4 h-4 text-red-600" />
                <span className="text-xs font-bold text-red-800 uppercase">Despesas / OpEx</span>
              </div>
              <span className="text-lg font-bold text-red-900">{formatCurrency(result.totalExpenses)}</span>
            </div>
          </div>

          {/* Waterfall Steps */}
          {result.netIncome > 0 ? (
            <>
              <div className="pl-4 border-l-2 border-slate-200 space-y-3 pt-2 ml-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" /> Originação Acumulada
                  </span>
                  <span className="font-semibold text-slate-700">{formatCurrency(result.originationFee)}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-600 flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-slate-400" /> Reserva Onebridge (12%)
                  </span>
                  <span className="font-semibold text-slate-700">{formatCurrency(result.companyReserve)}</span>
                </div>
              </div>

              <div className="my-6 border-t border-slate-200"></div>

              {/* Step 5: Final Distribution Table (Admin Only) */}
              {userRole === 'admin' && (
                <div>
                  <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" /> Distribuição de Lucros
                  </h3>
                  <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3">Sócio / Entidade</th>
                          <th className="px-4 py-3 text-right">Participação</th>
                          <th className="px-4 py-3 text-right">Pagamento (USD)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        <tr className="group hover:bg-emerald-50/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700">Evandro (Profiscal)</td>
                          <td className="px-4 py-3 text-right text-slate-400">33.34%</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 bg-emerald-50/20 group-hover:bg-emerald-50/40">
                            {formatCurrency(result.finalPayouts.evandro)}
                          </td>
                        </tr>
                        <tr className="group hover:bg-emerald-50/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700">Julia/Samuel (Elevated)</td>
                          <td className="px-4 py-3 text-right text-slate-400">33.33%</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 bg-emerald-50/20 group-hover:bg-emerald-50/40">
                            {formatCurrency(result.finalPayouts.juliaSamuel)}
                          </td>
                        </tr>
                        <tr className="group hover:bg-emerald-50/10 transition-colors">
                          <td className="px-4 py-3 font-medium text-slate-700">Walter (Moraes D'Angelo)</td>
                          <td className="px-4 py-3 text-right text-slate-400">33.33%</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-600 bg-emerald-50/20 group-hover:bg-emerald-50/40">
                            {formatCurrency(result.finalPayouts.walter)}
                          </td>
                        </tr>
                        <tr className="bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-600">Onebridge (Reserva)</td>
                          <td className="px-4 py-3 text-right text-slate-400">12.00%</td>
                          <td className="px-4 py-3 text-right font-bold text-slate-700">
                            {formatCurrency(result.finalPayouts.reserve)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="mt-6 p-6 bg-red-50 border border-red-200 rounded-xl text-center">
              <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-3" />
              <h3 className="text-red-800 font-bold mb-1">Sem Lucro Distribuível</h3>
              <p className="text-red-600 text-sm">
                As despesas do período superaram as receitas. O saldo negativo de <strong>{formatCurrency(result.netIncome)}</strong> deve ser coberto pelo Capital de Giro ou Aporte dos Sócios.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};