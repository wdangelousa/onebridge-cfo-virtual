import React, { useState, useEffect } from 'react';
import { FinancialData, Partner, TransactionType, PaymentMethod, ClientType } from '../types';
import { getExchangeRate, calculateUSDEquivalent } from '../services/exchangeService';
import { Calculator, DollarSign, FileText, AlertTriangle, TrendingDown, TrendingUp, PlusCircle, Globe, RefreshCw, Link, User, CreditCard, Landmark, Smartphone, ExternalLink, Building2, UserCheck, BriefcaseBusiness } from 'lucide-react';
import { financialSchema } from '../schemas/financialSchema';
import { z } from 'zod';

interface Props {
  data: FinancialData;
  onChange: (data: FinancialData) => void;
  onAdd: (openInvoice?: boolean) => void;
}

const SERVICES_LIST = [
  "Abertura Conta Bancária", "Abertura Delaware", "Abertura Flórida", "Abertura Off Shore B.V.I",
  "Abertura Wyoming", "Agente Registrado DE", "Agente Registrado FL", "Agente Registrado WY",
  "Apostilamento e Tradução", "Business Plan", "Compliance Anual Flórida", "Compliance B.V.I",
  "Compliance Delaware CORP", "Compliance Delaware LLC", "Compliance Wyoming",
  "Consultoria Contadores (hora)", "Customização Documentos", "Dissolução Delaware",
  "Dissolução Flórida", "Dissolução Wyoming", "Mudanças/Amendments", "Planej.Tributário Avançado",
  "Planej.Tributário Básico", "Registro Marca USPTO p/ classe", "Visto EB-1", "Visto EB-2",
  "Visto EB-3", "Visto E-2", "Visto L-1", "Visto O-1", "Visto - RFE", "Visto - Appeal / Motion", "Visto - Refile"
];

const EXPENSE_TYPES = [
  "Apostilamento", "Tradução Juramentada", "Certidão de Good Standing"
];

export const FinancialForm: React.FC<Props> = ({ data, onChange, onAdd }) => {
  const [loadingRate, setLoadingRate] = useState(false);
  const [currentRate, setCurrentRate] = useState<number | null>(null);
  const [inputAmount, setInputAmount] = useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (data.originalAmount) {
      setInputAmount(data.originalAmount.toString());
    } else {
      setInputAmount('');
    }
    setErrors({});
  }, [data.id, data.type]);

  const fetchRate = async () => {
    setLoadingRate(true);
    const rate = await getExchangeRate();
    if (rate) {
      setCurrentRate(rate);
      if (inputAmount && data.currency === 'BRL') {
        updateConversion(parseFloat(inputAmount), rate);
      }
    }
    setLoadingRate(false);
  };

  const handleCurrencyChange = (currency: 'USD' | 'BRL') => {
    onChange({ ...data, currency, exchangeRate: undefined, originalAmount: undefined });
    setInputAmount('');
    if (currency === 'BRL') fetchRate();
  };

  const updateConversion = (amount: number, rate: number) => {
    const usdValue = parseFloat((amount / rate).toFixed(2));
    if (data.type === TransactionType.REVENUE) {
      onChange({
        ...data,
        grossRevenue: usdValue,
        originalAmount: amount,
        exchangeRateUsed: rate,
        exchangeRate: rate,
        exchangeSource: 'AwesomeAPI',
        currency: 'BRL'
      });
    } else {
      onChange({
        ...data,
        provisions: usdValue,
        originalAmount: amount,
        exchangeRateUsed: rate,
        exchangeRate: rate,
        exchangeSource: 'AwesomeAPI',
        currency: 'BRL'
      });
    }
  };

  const handleAmountChange = (val: string) => {
    setInputAmount(val);
    const numericVal = parseFloat(val);
    if (isNaN(numericVal)) return;

    if (data.currency === 'USD') {
      if (data.type === TransactionType.REVENUE) {
        onChange({ ...data, grossRevenue: numericVal, originalAmount: numericVal });
      } else {
        onChange({ ...data, provisions: numericVal, originalAmount: numericVal });
      }
    } else if (currentRate) {
      updateConversion(numericVal, currentRate);
    }
  };

  const handleChange = (field: keyof FinancialData, value: any) => {
    setErrors(prev => ({ ...prev, [field]: '' }));
    if (field === 'type') {
      setInputAmount('');
      onChange({
        ...data, type: value, grossRevenue: 0, provisions: 0, originalAmount: 0,
        originator: Partner.NONE, currency: 'USD', linkedClient: '', externalCommissionBeneficiary: '',
        paymentMethod: PaymentMethod.WIRE, serviceType: '', responsibleName: '', clientType: ClientType.INDIVIDUAL,
        companyId: data.companyId // Keep companyId on reset
      });
    } else {
      onChange({ ...data, [field]: value });
    }
  };

  const handleValidateAndAdd = async (openInvoice: boolean = false) => {
    try {
      setLoadingRate(true);
      const conversion = await calculateUSDEquivalent(parseFloat(inputAmount), data.currency);

      const stabilizedData = {
        ...data,
        originalAmount: conversion.originalAmount,
        exchangeRateUsed: conversion.rateUsed,
        exchangeSource: 'AwesomeAPI (Fixed)',
      };

      if (data.type === TransactionType.REVENUE) {
        stabilizedData.grossRevenue = conversion.usdAmount;
      } else {
        stabilizedData.provisions = conversion.usdAmount;
      }

      financialSchema.parse(stabilizedData);
      setErrors({});
      onChange(stabilizedData);
      setTimeout(() => onAdd(openInvoice), 0);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path) newErrors[err.path[0]] = err.message;
        });
        setErrors(newErrors);
      } else {
        alert("Erro na conversão de câmbio. Verifique sua conexão.");
      }
    } finally {
      setLoadingRate(false);
    }
  };

  const isExpense = data.type === TransactionType.EXPENSE;

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-6 text-slate-800 border-b border-slate-100 pb-4">
        <div className={`p-2 rounded-lg ${isExpense ? 'bg-red-50' : 'bg-emerald-50'}`}>
          <Calculator className={`w-5 h-5 ${isExpense ? 'text-red-600' : 'text-emerald-600'}`} />
        </div>
        <h2 className="text-lg font-bold">Lançamento</h2>
      </div>

      <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
        <button onClick={() => handleChange('type', TransactionType.REVENUE)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${!isExpense ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TrendingUp className="w-4 h-4" /> Receita</button>
        <button onClick={() => handleChange('type', TransactionType.EXPENSE)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-md transition-all ${isExpense ? 'bg-white text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><TrendingDown className="w-4 h-4" /> Despesa</button>
      </div>

      <div className="space-y-5 flex-grow">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Moeda</label>
          <div className="flex bg-slate-100 p-0.5 rounded-lg">
            <button onClick={() => handleCurrencyChange('USD')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${data.currency === 'USD' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-400'}`}>USD ($)</button>
            <button onClick={() => handleCurrencyChange('BRL')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${data.currency === 'BRL' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-400'}`}>BRL (R$)</button>
          </div>
        </div>

        {!isExpense ? (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Serviço Prestado</label>
              <div className="relative">
                <BriefcaseBusiness className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <select value={data.serviceType || ''} onChange={(e) => handleChange('serviceType', e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm bg-white ${errors.serviceType ? 'border-red-500 ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`}>
                  <option value="" disabled>Selecione um serviço...</option>
                  {SERVICES_LIST.map((svc) => <option key={svc} value={svc}>{svc}</option>)}
                </select>
              </div>
              {errors.serviceType && <p className="text-[10px] text-red-500 mt-1">{errors.serviceType}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Tipo de Cliente</label>
              <div className="flex gap-2">
                <button onClick={() => handleChange('clientType', ClientType.INDIVIDUAL)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-lg border transition-all ${data.clientType === ClientType.INDIVIDUAL ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><User className="w-3.5 h-3.5" /> Pessoa Física</button>
                <button onClick={() => handleChange('clientType', ClientType.COMPANY)} className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs rounded-lg border transition-all ${data.clientType === ClientType.COMPANY ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}><Building2 className="w-3.5 h-3.5" /> Pessoa Jurídica</button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nome do Cliente</label>
              <div className="relative">
                <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input type="text" value={data.description} onChange={(e) => handleChange('description', e.target.value)} className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm transition-all ${errors.description ? 'border-red-500 ring-red-200' : 'border-slate-300 focus:ring-emerald-500'}`} placeholder="Ex: João da Silva" />
              </div>
              {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
            </div>

            {data.clientType === ClientType.COMPANY && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Responsável Legal</label>
                <div className="relative">
                  <UserCheck className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                  <input type="text" value={data.responsibleName || ''} onChange={(e) => handleChange('responsibleName', e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all" placeholder="Ex: Maria Oliveira" />
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Descrição da Despesa</label>
            <div className="relative">
              <FileText className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" value={data.description} onChange={(e) => handleChange('description', e.target.value)} list="expense-suggestions" className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm transition-all ${errors.description ? 'border-red-500 ring-red-200' : 'border-slate-300 focus:ring-red-500'}`} placeholder="Despesa..." />
              <datalist id="expense-suggestions">{EXPENSE_TYPES.map((type) => <option key={type} value={type} />)}</datalist>
            </div>
            {errors.description && <p className="text-[10px] text-red-500 mt-1">{errors.description}</p>}
          </div>
        )}

        {isExpense && (
          <div className="animate-in fade-in slide-in-from-top-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Vinculado a Cliente/Projeto</label>
            <div className="relative">
              <Link className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input type="text" value={data.linkedClient || ''} onChange={(e) => handleChange('linkedClient', e.target.value)} className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all" placeholder="Ex: Projeto Alpha" />
            </div>
          </div>
        )}

        {!isExpense && (
          <div className="animate-in fade-in slide-in-from-top-2 space-y-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Método de Recebimento</label>
            <div className="flex gap-2">
              {[PaymentMethod.WIRE, PaymentMethod.ZELLE, PaymentMethod.PARCELADO_USA].map((m) => (
                <button key={m} onClick={() => handleChange('paymentMethod', m)} className={`flex-1 flex flex-col items-center p-2 rounded-lg border text-[10px] transition-all ${data.paymentMethod === m ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'}`}>
                  {m === PaymentMethod.WIRE ? <Landmark className="w-4 h-4 mb-1" /> : m === PaymentMethod.ZELLE ? <Smartphone className="w-4 h-4 mb-1" /> : <CreditCard className="w-4 h-4 mb-1" />}
                  {m}
                </button>
              ))}
            </div>
            {data.paymentMethod === PaymentMethod.PARCELADO_USA && (
              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 animate-in fade-in slide-in-from-top-1">
                <input type="text" value={data.paymentLink || ''} onChange={(e) => handleChange('paymentLink', e.target.value)} className={`w-full px-3 py-1.5 border rounded text-sm outline-none transition-all ${errors.paymentLink ? 'border-red-500' : 'border-blue-200 focus:ring-2 focus:ring-blue-500'}`} placeholder="Cole o link do ParceladoUSA" />
                {errors.paymentLink && <p className="text-[10px] text-red-500 mt-1">{errors.paymentLink}</p>}
              </div>
            )}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Valor do Lançamento</label>
          <div className="relative">
            {data.currency === 'USD' ? <DollarSign className={`absolute left-3 top-2.5 w-4 h-4 ${isExpense ? 'text-red-500' : 'text-emerald-500'}`} /> : <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-500">R$</span>}
            <input type="number" step="0.01" value={inputAmount} onChange={(e) => handleAmountChange(e.target.value)} disabled={loadingRate} className={`w-full pl-9 pr-4 py-2 border rounded-lg focus:ring-2 outline-none text-sm font-medium transition-all ${errors.grossRevenue || errors.provisions ? 'border-red-500' : 'border-slate-300 focus:ring-emerald-500'}`} placeholder="0.00" />
            {loadingRate && <RefreshCw className="absolute right-3 top-2.5 w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          {(errors.grossRevenue || errors.provisions) && <p className="text-[10px] text-red-500 mt-1">{errors.grossRevenue || errors.provisions}</p>}

          {/* Conversion Info Box */}
          {data.currency === 'BRL' && currentRate && inputAmount && (
            <div className="mt-3 bg-blue-50 border border-blue-100 rounded-lg p-3 animate-in fade-in zoom-in-95">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] font-bold text-blue-700 uppercase">Estimativa USD</span>
                <span className="text-[10px] text-blue-400 font-mono">Rate: {currentRate.toFixed(4)}</span>
              </div>
              <div className="text-sm font-bold text-slate-800">
                ≈ $ {isExpense ? (data.provisions || 0).toFixed(2) : (data.grossRevenue || 0).toFixed(2)} USD
              </div>
            </div>
          )}
        </div>

        {!isExpense ? (
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Sócio Originador</label>
            <select value={data.originator} onChange={(e) => handleChange('originator', e.target.value)} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm bg-white transition-all">
              {Object.values(Partner).map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        ) : (
          <div className="p-3 bg-slate-50 rounded text-[10px] text-slate-500 text-center">Despesas operacionais impactam o resultado real.</div>
        )}
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => handleValidateAndAdd(false)}
          disabled={loadingRate}
          className={`flex-1 py-3 rounded-lg font-bold text-sm shadow-md transition-all ${isExpense ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'} text-white disabled:opacity-50`}
        >
          {loadingRate ? <span className="flex items-center justify-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Processando...</span> : 'Adicionar'}
        </button>
        {!isExpense && (
          <button
            onClick={() => handleValidateAndAdd(true)}
            disabled={loadingRate}
            className="flex-1 py-3 rounded-lg font-bold text-sm bg-slate-800 text-white hover:bg-slate-900 shadow-md transition-all disabled:opacity-50"
          >
            {loadingRate ? '...' : 'Salvar & Invoice'}
          </button>
        )}
      </div>
    </div>
  );
};
