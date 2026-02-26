import React from 'react';
import { FinancialData, PaymentMethod, TransactionType } from '../types';
import { Trash2, ArrowUpCircle, ArrowDownCircle, FileText, Globe, Link, Users, CreditCard, Smartphone, Landmark, Building2, User } from 'lucide-react';

interface Props {
  transactions: FinancialData[];
  userRole: 'admin' | 'viewer';
  onRemove: (id: string) => void;
  onGenerateInvoice: (transaction: FinancialData) => void;
}

export const TransactionList: React.FC<Props> = ({ transactions, userRole, onRemove, onGenerateInvoice }) => {
  const formatCurrency = (val: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
  };

  const getPaymentIcon = (method?: PaymentMethod) => {
    switch (method) {
      case PaymentMethod.ZELLE: return <Smartphone className="w-3 h-3 text-purple-600" />;
      case PaymentMethod.PARCELADO_USA: return <CreditCard className="w-3 h-3 text-blue-600" />;
      default: return <Landmark className="w-3 h-3 text-slate-500" />;
    }
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-300">
        <p className="text-sm">Nenhuma transação lançada nesta quinzena.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Histórico da Quinzena</h3>
        <span className="text-xs font-mono text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">
          {transactions.length} itens
        </span>
      </div>
      <div className="max-h-[300px] overflow-y-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10">
            <tr>
              <th className="px-4 py-2 text-left">Tipo</th>
              <th className="px-4 py-2 text-left">Detalhes</th>
              <th className="px-4 py-2 text-right">Valor Líq. (USD)</th>
              <th className="px-4 py-2 w-32 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map((t) => {
              const isRevenue = t.type === TransactionType.REVENUE;
              const cost = t.govTaxes + t.externalCommission + t.provisions;
              const val = isRevenue ? (t.grossRevenue - cost) : cost;
              const isConverted = t.currency === 'BRL';

              return (
                <tr key={t.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-4 py-3 align-top">
                    {isRevenue ? (
                      <div className="flex items-center gap-1 text-emerald-600 font-medium">
                        <ArrowUpCircle className="w-4 h-4" />
                        <span className="text-xs">Receita</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 font-medium">
                        <ArrowDownCircle className="w-4 h-4" />
                        <span className="text-xs">Despesa</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-slate-700">
                    <div className="font-medium flex items-center gap-2">
                      {/* Show Service Name for Revenue, Description for Expense */}
                      {isRevenue ? (t.serviceType || 'Serviço Diverso') : t.description}

                      {isConverted && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-50 text-blue-600 border border-blue-100" title={`Conversão: R$ ${t.originalAmount} / ${t.exchangeRate} (Fonte: ${t.exchangeSource})`}>
                          <Globe className="w-3 h-3" />
                          BRL
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col gap-1 mt-1">
                      {/* Client / Description Subtext */}
                      {isRevenue && (
                        <div className="text-xs text-slate-500 flex items-center gap-1">
                          {t.responsibleName ? <Building2 className="w-3 h-3" /> : <User className="w-3 h-3" />}
                          <span className="font-semibold">{t.description}</span>
                          {t.responsibleName && <span className="text-slate-400"> (Attn: {t.responsibleName})</span>}
                        </div>
                      )}

                      {/* Context Info */}
                      <div className="flex gap-2 items-center flex-wrap">
                        <div className="text-xs text-slate-400">{t.originator !== 'Nenhum (Orgânico)' && isRevenue ? t.originator.split(' ')[0] : ''}</div>
                        {isRevenue && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-500 border border-slate-200 rounded px-1 bg-slate-100">
                            {getPaymentIcon(t.paymentMethod)}
                            <span>{t.paymentMethod || 'Wire'}</span>
                          </div>
                        )}
                        {isConverted && t.originalAmount && t.exchangeRate && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            (R$ {t.originalAmount.toFixed(2)} @ {t.exchangeRate.toFixed(3)})
                          </div>
                        )}
                      </div>

                      {/* External Commission Badge */}
                      {t.externalCommission > 0 && t.externalCommissionBeneficiary && (
                        <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 w-fit px-1.5 py-0.5 rounded border border-amber-100">
                          <Users className="w-3 h-3" />
                          Comissão: {t.externalCommissionBeneficiary} ({formatCurrency(t.externalCommission)})
                        </div>
                      )}

                      {/* Linked Client Badge */}
                      {t.linkedClient && (
                        <div className="flex items-center gap-1 text-[10px] text-slate-500 bg-slate-100 w-fit px-1.5 py-0.5 rounded border border-slate-200">
                          <Link className="w-3 h-3 text-slate-400" />
                          Ref: <span className="font-medium">{t.linkedClient}</span>
                        </div>
                      )}
                    </div>

                  </td>
                  <td className={`px-4 py-3 text-right font-mono align-top ${isRevenue ? 'text-emerald-700' : 'text-red-700'}`}>
                    {isRevenue ? '+' : '-'}{formatCurrency(val)}
                  </td>
                  <td className="px-4 py-3 text-right align-top">
                    <div className="flex items-center justify-end gap-2">
                      {isRevenue && (
                        <button
                          onClick={() => onGenerateInvoice(t)}
                          className="flex items-center gap-1.5 px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase rounded border border-emerald-200 transition-colors"
                          title="Gerar Invoice"
                        >
                          <FileText className="w-3 h-3" />
                          Invoice
                        </button>
                      )}

                      {userRole === 'admin' && (
                        <button
                          onClick={() => t.id && onRemove(t.id)}
                          className="text-slate-300 hover:text-red-500 transition-colors p-1"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};