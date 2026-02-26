import React, { useState, useMemo, useEffect } from 'react';
import { DistributionResult, FinancialData, TransactionType } from '../types';
import { calculateDistribution } from '../utils/calculations';
import { Logo } from './Logo';
import { X, Printer, CalendarRange, Users, AlertCircle, ArrowDownCircle, ArrowUpCircle, Settings2, Calendar, FileCheck, Loader2 } from 'lucide-react';
import { generateAndUploadPDF } from '../lib/pdfService';

interface Props {
  result: DistributionResult;
  transactions: FinancialData[];
  onClose: () => void;
}

enum ReportPeriod {
  QUINZENAL = 'Quinzenal',
  MENSAL = 'Mensal',
  SEMESTRAL = 'Semestral',
  ANUAL = 'Anual',
  CUSTOM = 'Personalizado'
}

type FortnightMode = '1' | '2';

export const ReportModal: React.FC<Props> = ({ transactions, onClose }) => {
  const [period, setPeriod] = useState<ReportPeriod>(ReportPeriod.QUINZENAL);

  // Advanced Configuration State
  const [referenceMonth, setReferenceMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [fortnightMode, setFortnightMode] = useState<FortnightMode>(new Date().getDate() <= 15 ? '1' : '2');
  const [cutoffDay, setCutoffDay] = useState(15); // Default split day

  // Final Date State
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Initial Calculation
  useEffect(() => {
    recalculateDates(ReportPeriod.QUINZENAL, referenceMonth, fortnightMode, cutoffDay);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const recalculateDates = (
    selectedPeriod: ReportPeriod,
    refMonth: string,
    mode: FortnightMode,
    cutoff: number
  ) => {
    const [yearStr, monthStr] = refMonth.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr) - 1; // JS 0-indexed

    let start = '';
    let end = '';

    const formatDate = (date: Date) => date.toISOString().split('T')[0];

    switch (selectedPeriod) {
      case ReportPeriod.QUINZENAL:
        if (mode === '1') {
          // 1st to Cutoff
          start = formatDate(new Date(year, month, 1));
          end = formatDate(new Date(year, month, cutoff));
        } else {
          // (Cutoff + 1) to End of Month
          start = formatDate(new Date(year, month, cutoff + 1));
          end = formatDate(new Date(year, month + 1, 0)); // Last day
        }
        break;
      case ReportPeriod.MENSAL:
        start = formatDate(new Date(year, month, 1));
        end = formatDate(new Date(year, month + 1, 0));
        break;
      case ReportPeriod.SEMESTRAL:
        if (month < 6) {
          start = formatDate(new Date(year, 0, 1)); // Jan 1
          end = formatDate(new Date(year, 5, 30)); // Jun 30
        } else {
          start = formatDate(new Date(year, 6, 1)); // Jul 1
          end = formatDate(new Date(year, 11, 31)); // Dec 31
        }
        break;
      case ReportPeriod.ANUAL:
        start = formatDate(new Date(year, 0, 1));
        end = formatDate(new Date(year, 11, 31));
        break;
      case ReportPeriod.CUSTOM:
        return; // Don't overwrite if custom
    }

    setStartDate(start);
    setEndDate(end);
    setPeriod(selectedPeriod);
  };

  const handlePeriodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newPeriod = e.target.value as ReportPeriod;
    recalculateDates(newPeriod, referenceMonth, fortnightMode, cutoffDay);
  };

  // Specific Handlers for Quinzenal Config
  const handleReferenceMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setReferenceMonth(val);
    if (period !== ReportPeriod.CUSTOM) {
      recalculateDates(period, val, fortnightMode, cutoffDay);
    }
  };

  const handleFortnightChange = (mode: FortnightMode) => {
    setFortnightMode(mode);
    if (period === ReportPeriod.QUINZENAL) {
      recalculateDates(ReportPeriod.QUINZENAL, referenceMonth, mode, cutoffDay);
    }
  };

  const handleCutoffChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value) || 15;
    const safeVal = Math.min(Math.max(val, 1), 28); // Clamp between 1 and 28
    setCutoffDay(safeVal);
    if (period === ReportPeriod.QUINZENAL) {
      recalculateDates(ReportPeriod.QUINZENAL, referenceMonth, fortnightMode, safeVal);
    }
  };

  // Filter transactions based on date range
  const filteredTransactions = useMemo(() => {
    if (!startDate || !endDate) return [];
    return transactions.filter(t => {
      if (!t.date) return false;
      const tDate = t.date.split('T')[0];
      return tDate >= startDate && tDate <= endDate;
    });
  }, [transactions, startDate, endDate]);

  // Split transactions for detailed views
  const revenueTransactions = useMemo(() =>
    filteredTransactions.filter(t => t.type === TransactionType.REVENUE),
    [filteredTransactions]);

  const expenseTransactions = useMemo(() =>
    filteredTransactions.filter(t => t.type === TransactionType.EXPENSE),
    [filteredTransactions]);

  // Recalculate distribution based on filtered data
  const filteredResult = useMemo(() => {
    return calculateDistribution(filteredTransactions);
  }, [filteredTransactions]);

  // Calculate External Commissions Breakdown based on filtered data
  const externalBeneficiaries = useMemo((): Record<string, number> => {
    const breakdown: Record<string, number> = {};
    filteredTransactions.forEach(t => {
      if (t.externalCommission > 0 && t.externalCommissionBeneficiary) {
        breakdown[t.externalCommissionBeneficiary] = (breakdown[t.externalCommissionBeneficiary] || 0) + t.externalCommission;
      }
    });
    return breakdown;
  }, [filteredTransactions]);

  const hasExternalCommissions = Object.keys(externalBeneficiaries).length > 0;

  const [isGenerating, setIsGenerating] = useState(false);

  const handleGeneratePDF = async () => {
    if (filteredTransactions.length === 0) return;
    setIsGenerating(true);
    try {
      const url = await generateAndUploadPDF(
        'report-capture-area',
        `Relatorio_${period}_${referenceMonth}.pdf`
      );
      if (url) alert("Relatório gerado e arquivado com sucesso!");
    } catch (error) {
      alert("Erro ao gerar PDF do relatório.");
    } finally {
      setIsGenerating(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  const formatDateDisplay = (isoDate?: string) => {
    if (!isoDate) return '-';
    return new Date(isoDate).toLocaleDateString();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm print:bg-white print:p-0">

      {/* Container */}
      <div className="bg-white w-full max-w-5xl h-[95vh] rounded-xl shadow-2xl flex flex-col print:h-auto print:shadow-none print:w-full print:max-w-none print:rounded-none">

        {/* Header / Controls (Hidden on Print) */}
        <div className="flex justify-between items-center p-4 border-b border-slate-200 print:hidden">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            Gerar Relatório de Pagamento
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleGeneratePDF}
              disabled={filteredTransactions.length === 0 || isGenerating}
              className={`flex items-center gap-2 px-4 py-2 text-white rounded-lg text-sm font-medium transition-colors ${filteredTransactions.length === 0 || isGenerating ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700'}`}
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileCheck className="w-4 h-4" />
              )}
              Gerar e Arquivar PDF
            </button>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-500">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Bar (Hidden on Print) */}
        <div className="bg-slate-50 border-b border-slate-200 print:hidden">
          <div className="p-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Tipo de Relatório</label>
              <select
                value={period}
                onChange={handlePeriodChange}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
              >
                {Object.values(ReportPeriod).map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* Dynamic Controls based on Period */}
            {period === ReportPeriod.QUINZENAL ? (
              <>
                <div className="md:col-span-2 flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Mês de Referência</label>
                    <input
                      type="month"
                      value={referenceMonth}
                      onChange={handleReferenceMonthChange}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Dia de Corte (Split)</label>
                    <div className="relative">
                      <Settings2 className="absolute left-3 top-2.5 w-3 h-3 text-slate-400" />
                      <input
                        type="number"
                        min="1"
                        max="28"
                        value={cutoffDay}
                        onChange={handleCutoffChange}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                        title="Dia que encerra a primeira quinzena (Padrão: 15)"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Seleção do Período</label>
                  <div className="flex gap-1 bg-white p-1 border border-slate-300 rounded-lg">
                    <button
                      onClick={() => handleFortnightChange('1')}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${fortnightMode === '1' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      1ª (1-{cutoffDay})
                    </button>
                    <button
                      onClick={() => handleFortnightChange('2')}
                      className={`flex-1 text-xs font-medium py-1.5 rounded-md transition-all ${fortnightMode === '2' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      2ª ({cutoffDay + 1}-Fim)
                    </button>
                  </div>
                </div>
              </>
            ) : (
              /* Standard Date Inputs for Other Modes */
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      setPeriod(ReportPeriod.CUSTOM);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data Fim</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => {
                      setEndDate(e.target.value);
                      setPeriod(ReportPeriod.CUSTOM);
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-slate-500 outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <div className="text-xs text-slate-400 italic">
                    {period === ReportPeriod.CUSTOM ? 'Intervalo Manual' : 'Intervalo Automático'}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Report Content Area */}
        <div className="flex-1 overflow-auto bg-slate-100 p-8 print:p-0 print:bg-white print:overflow-visible">

          <div
            id="report-capture-area"
            className="bg-white max-w-[210mm] mx-auto min-h-[297mm] shadow-lg p-[15mm] print:shadow-none print:m-0 print:w-full print:max-w-none print:h-auto text-slate-900 relative"
          >

            {/* Report Header */}
            <div className="flex justify-between items-start mb-8 border-b-2 border-slate-900 pb-6">
              <div className="scale-75 origin-top-left">
                <Logo />
              </div>
              <div className="text-right">
                <h1 className="text-2xl font-bold text-slate-900 uppercase tracking-wide">Relatório Financeiro</h1>
                <p className="text-sm font-medium text-emerald-600 uppercase tracking-widest mt-1">
                  Demonstrativo de Resultado
                  {period === ReportPeriod.QUINZENAL && (
                    <span className="ml-1 text-slate-500">
                      ({fortnightMode}ª Quinzena)
                    </span>
                  )}
                </p>
                <div className="flex items-center justify-end gap-2 text-xs text-slate-500 mt-2">
                  <Calendar className="w-3 h-3" />
                  <span>{new Date(startDate).toLocaleDateString()} até {new Date(endDate).toLocaleDateString()}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  ID do Lote: {crypto.randomUUID().split('-')[0].toUpperCase()}
                </p>
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                <AlertCircle className="w-12 h-12 mb-4 text-slate-300" />
                <p className="text-lg font-medium text-slate-500">Nenhuma transação encontrada</p>
                <p className="text-sm">Não há registros financeiros para o período selecionado.</p>
              </div>
            ) : (
              <>
                {/* Executive Summary */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Resumo Executivo</h3>
                  <div className="grid grid-cols-4 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Receita Bruta</p>
                      <p className="text-lg font-bold text-slate-900">{formatCurrency(filteredResult.grossTotal)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Despesas (OpEx)</p>
                      <p className="text-lg font-bold text-red-600">{formatCurrency(filteredResult.totalExpenses)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Lucro Líquido</p>
                      <p className={`text-lg font-bold ${filteredResult.netIncome >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                        {formatCurrency(filteredResult.netIncome)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 uppercase">Reserva Retida (12%)</p>
                      <p className="text-lg font-bold text-slate-700">{formatCurrency(filteredResult.companyReserve)}</p>
                    </div>
                  </div>
                </div>

                {/* DETAILED REVENUE TABLE */}
                {revenueTransactions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowUpCircle className="w-4 h-4 text-emerald-500" />
                      Detalhamento de Entradas (Receitas)
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-2">Data</th>
                            <th className="px-4 py-2">Cliente / Responsável</th>
                            <th className="px-4 py-2">Serviço Prestado</th>
                            <th className="px-4 py-2 text-right">Valor Bruto</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {revenueTransactions.map(t => (
                            <tr key={t.id}>
                              <td className="px-4 py-2 text-xs text-slate-500">{formatDateDisplay(t.date)}</td>
                              <td className="px-4 py-2">
                                <div className="font-medium text-slate-800">{t.description}</div>
                                {t.responsibleName && <div className="text-[10px] text-slate-400">Resp: {t.responsibleName}</div>}
                              </td>
                              <td className="px-4 py-2 text-slate-600">{t.serviceType}</td>
                              <td className="px-4 py-2 text-right font-medium text-emerald-700">
                                {formatCurrency(t.grossRevenue)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* DETAILED EXPENSE TABLE */}
                {expenseTransactions.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <ArrowDownCircle className="w-4 h-4 text-red-500" />
                      Detalhamento de Saídas (Despesas Operacionais)
                    </h3>
                    <div className="border border-slate-200 rounded-lg overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-500 uppercase">
                          <tr>
                            <th className="px-4 py-2">Data</th>
                            <th className="px-4 py-2">Descrição da Despesa</th>
                            <th className="px-4 py-2">Referência / Vinculação</th>
                            <th className="px-4 py-2 text-right">Valor Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {expenseTransactions.map(t => {
                            const totalCost = t.provisions + t.govTaxes + t.externalCommission;
                            return (
                              <tr key={t.id}>
                                <td className="px-4 py-2 text-xs text-slate-500">{formatDateDisplay(t.date)}</td>
                                <td className="px-4 py-2 font-medium text-slate-700">{t.description}</td>
                                <td className="px-4 py-2 text-xs text-slate-500 italic">
                                  {t.linkedClient ? (
                                    <span className="flex items-center gap-1">
                                      Ref: {t.linkedClient}
                                    </span>
                                  ) : '-'}
                                </td>
                                <td className="px-4 py-2 text-right font-medium text-red-600">
                                  {formatCurrency(totalCost)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Main Payouts Table */}
                <div className="mb-8">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <CalendarRange className="w-4 h-4" />
                    Distribuição de Lucros (Sócios)
                  </h3>
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-xs uppercase tracking-wider">
                        <th className="px-4 py-3 rounded-tl-lg">Beneficiário</th>
                        <th className="px-4 py-3">Referência</th>
                        <th className="px-4 py-3 text-right">Participação</th>
                        <th className="px-4 py-3 text-right rounded-tr-lg">Valor a Transferir</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border border-slate-200">
                      <tr>
                        <td className="px-4 py-4 font-bold text-slate-800">EVANDRO (PROFISCAL)</td>
                        <td className="px-4 py-4 text-xs text-slate-500">Div. Distribution / Series 2024</td>
                        <td className="px-4 py-4 text-right text-slate-500">33.34% + Origin.</td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-lg text-slate-900">
                          {formatCurrency(filteredResult.finalPayouts.evandro)}
                        </td>
                      </tr>
                      <tr className="bg-slate-50">
                        <td className="px-4 py-4 font-bold text-slate-800">JULIA/SAMUEL (ELEVATED)</td>
                        <td className="px-4 py-4 text-xs text-slate-500">Div. Distribution / Series 2024</td>
                        <td className="px-4 py-4 text-right text-slate-500">33.33% + Origin.</td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-lg text-slate-900">
                          {formatCurrency(filteredResult.finalPayouts.juliaSamuel)}
                        </td>
                      </tr>
                      <tr>
                        <td className="px-4 py-4 font-bold text-slate-800">WALTER (MORAES D'ANGELO)</td>
                        <td className="px-4 py-4 text-xs text-slate-500">Div. Distribution / Series 2024</td>
                        <td className="px-4 py-4 text-right text-slate-500">33.33% + Origin.</td>
                        <td className="px-4 py-4 text-right font-mono font-bold text-lg text-slate-900">
                          {formatCurrency(filteredResult.finalPayouts.walter)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* External Commissions Table */}
                {hasExternalCommissions && (
                  <div className="mb-12">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Pagamentos a Parceiros Externos (Comissões)
                    </h3>
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-amber-100 text-amber-900 text-xs uppercase tracking-wider border-b border-amber-200">
                          <th className="px-4 py-2">Beneficiário Externo</th>
                          <th className="px-4 py-2">Tipo</th>
                          <th className="px-4 py-2 text-right">Total Provisionado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 border border-slate-200">
                        {Object.entries(externalBeneficiaries).map(([name, amount]) => (
                          <tr key={name}>
                            <td className="px-4 py-3 font-medium text-slate-700">{name}</td>
                            <td className="px-4 py-3 text-xs text-slate-500">Comissionamento (Gross-Up)</td>
                            <td className="px-4 py-3 text-right font-mono font-medium text-amber-700">
                              {formatCurrency(amount as number)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Grand Total */}
                <div className="flex justify-end mb-12">
                  <div className="w-1/2 bg-slate-50 p-6 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Geral de Saídas</span>
                      <span className="text-2xl font-bold text-slate-900">
                        {/* Sum of Partner Payouts + External Commissions */}
                        {formatCurrency(
                          filteredResult.finalPayouts.evandro +
                          filteredResult.finalPayouts.juliaSamuel +
                          filteredResult.finalPayouts.walter +
                          (Object.values(externalBeneficiaries).reduce((a: number, b: number) => a + b, 0))
                        )}
                      </span>
                    </div>
                    <p className="text-[10px] text-right text-slate-400 mt-1">Inclui Sócios + Comissões Externas</p>
                  </div>
                </div>

                <p className="text-[10px] text-slate-400 mt-2 italic border-t border-slate-100 pt-2">
                  * Valores calculados conforme Operating Agreement (Seção 4.2) e provisionamentos de despesas aprovados para o período selecionado.
                </p>

                {/* Approval Section */}
                <div className="mt-auto pt-12 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <div className="border-b border-slate-400 mb-2 h-12"></div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Preparado por</p>
                      <p className="text-xs text-slate-500">OneBridge CFO Virtual</p>
                      <p className="text-xs text-slate-400 mt-1">Date: {new Date().toLocaleDateString()}</p>
                    </div>
                    <div>
                      <div className="border-b border-slate-400 mb-2 h-12"></div>
                      <p className="text-xs font-bold text-slate-900 uppercase">Aprovado por (Sócio Adm.)</p>
                      <p className="text-xs text-slate-500">Assinatura Autorizada</p>
                    </div>
                  </div>
                </div>
              </>
            )}

            <div className="absolute bottom-6 left-0 right-0 text-center">
              <p className="text-[10px] text-slate-300 font-mono">
                GENERATED BY ONEBRIDGE FINANCIAL SYSTEM • ID: {crypto.randomUUID().split('-')[0].toUpperCase()}
              </p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};