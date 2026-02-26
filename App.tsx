import React, { useState, useEffect, useMemo } from 'react';
import { FinancialForm } from './components/FinancialForm';
import { DistributionResults } from './components/DistributionResults';
import { TransactionList } from './components/TransactionList';
import { CfoAssistant } from './components/CfoAssistant';
import { InvoiceModal } from './components/InvoiceModal';
import { ReportModal } from './components/ReportModal';
import { FinancialData, DistributionResult, Partner, TransactionType, ClientType } from './types';
import { calculateDistribution } from './utils/calculations';
import { Logo } from './components/Logo';
import { RefreshCcw, FilePlus2, FileBarChart, Loader2, LogOut } from 'lucide-react';
import { supabase } from './lib/supabase';
import { useTransactions } from './hooks/useTransactions';
import { CompanyProvider, useCompany } from './contexts/CompanyContext';

const INITIAL_FORM_DATA_BASE: Partial<FinancialData> = {
  type: TransactionType.REVENUE,
  description: '',
  serviceType: '',
  clientType: ClientType.INDIVIDUAL,
  responsibleName: '',
  grossRevenue: 0,
  govTaxes: 0,
  externalCommission: 0,
  provisions: 0,
  originator: Partner.NONE,
  currency: 'USD',
  paymentMethod: undefined,
  paymentLink: ''
};

const INITIAL_RESULT: DistributionResult = {
  grossTotal: 0,
  totalExpenses: 0,
  netIncome: 0,
  originationFee: 0,
  companyReserve: 0,
  distributableBalance: 0,
  partnerShares: { evandro: 0, juliaSamuel: 0, walter: 0 },
  finalPayouts: { evandro: 0, juliaSamuel: 0, walter: 0, reserve: 0 }
};

export default function App() {
  return (
    <CompanyProvider>
      <MainApp />
    </CompanyProvider>
  );
}

function MainApp() {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'admin' | 'viewer'>('viewer'); // Default to viewer
  const { activeCompany, companies, setActiveCompany, isLoading: isCompaniesLoading } = useCompany();

  const [formData, setFormData] = useState<FinancialData>({
    ...INITIAL_FORM_DATA_BASE,
    companyId: '',
  } as FinancialData);

  const { transactions, isLoading: isTransactionsLoading, addTransaction, removeTransaction, clearTransactions } = useTransactions(user?.id, activeCompany?.id);

  const isLoading = isTransactionsLoading || isCompaniesLoading;

  useEffect(() => {
    if (activeCompany) {
      setFormData(prev => ({ ...prev, companyId: activeCompany.id }));
    }
  }, [activeCompany]);

  const extractRole = (sessionUser: any) => {
    const role = sessionUser?.user_metadata?.role;
    setUserRole(role === 'admin' ? 'admin' : 'viewer');
  };

  // Modal States
  const [selectedInvoiceTransaction, setSelectedInvoiceTransaction] = useState<FinancialData | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  // Auth Management
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) extractRole(session.user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) extractRole(session.user);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Recalculate result based on cached transactions
  const result = useMemo(() => calculateDistribution(transactions), [transactions]);

  const handleAddTransaction = async (openInvoice: boolean = false) => {
    if (!user) return alert("Por favor, faça login.");
    if (formData.type === TransactionType.REVENUE && !formData.serviceType) {
      return alert("Por favor, selecione um serviço.");
    }

    try {
      const newTransaction = await addTransaction(formData);

      if (openInvoice && formData.type === TransactionType.REVENUE) {
        setSelectedInvoiceTransaction(newTransaction);
      }

      setFormData({
        ...INITIAL_FORM_DATA_BASE,
        type: formData.type,
        companyId: activeCompany?.id || ''
      } as FinancialData);
    } catch (error: any) {
      alert("Erro ao salvar: " + error.message);
    }
  };

  const handleRemoveTransaction = async (id: string) => {
    if (confirm('Deseja excluir esta transação?')) {
      await removeTransaction(id);
    }
  };

  const handleClearPeriod = async () => {
    if (confirm('Iniciar novo período? Isso apagará os dados atuais.')) {
      await clearTransactions();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleManualInvoice = () => {
    setSelectedInvoiceTransaction({
      ...INITIAL_FORM_DATA_BASE,
      description: 'New Invoice',
      grossRevenue: 0,
      id: 'manual',
      companyId: activeCompany?.id || ''
    } as FinancialData);
  };

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center">
          <Logo />
          <h1 className="text-2xl font-bold mt-6 text-slate-900">OneBridge CFO</h1>
          <button
            onClick={() => supabase.auth.signInWithOAuth({ provider: 'google' })}
            className="w-full mt-8 bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition-colors"
          >
            Entrar com Google
          </button>

          {/* 
            SECURITY NOTE (RBAC Assignment):
            Para ativar o acesso total (Admin), execute este comando no SQL Editor do Supabase para o seu user_id:
            
            update auth.users 
            set raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}' 
            where id = 'SEU_UUID_AQUI';
          */}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 pb-12 print:bg-white print:pb-0">

      <div className="print:hidden">
        <header className="bg-slate-950 text-white shadow-lg sticky top-0 z-50 border-b border-slate-800 h-20">
          <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Logo />

              {/* Company Selector */}
              <div className="flex items-center gap-2 border-l border-slate-800 pl-6">
                <select
                  value={activeCompany?.id || ''}
                  onChange={(e) => {
                    const company = companies.find(c => c.id === e.target.value);
                    if (company) setActiveCompany(company);
                  }}
                  className="bg-slate-900 border border-slate-700 text-slate-300 text-xs px-3 py-1.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 hover:border-slate-500 transition-colors cursor-pointer"
                >
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleManualInvoice} className="flex items-center gap-2 text-slate-300 text-sm hover:text-white">
                <FilePlus2 className="w-4 h-4 text-emerald-500" /> Nova Invoice
              </button>
              <button onClick={() => setIsReportModalOpen(true)} className="flex items-center gap-2 text-slate-300 text-sm hover:text-white">
                <FileBarChart className="w-4 h-4 text-blue-500" /> Relatório
              </button>
              {userRole === 'admin' && (
                <button onClick={handleClearPeriod} className="p-2 bg-slate-800 hover:bg-slate-700 rounded" title="Limpar Período (Admin)">
                  <RefreshCcw className="w-4 h-4" />
                </button>
              )}
              <button onClick={handleLogout} className="p-2 hover:bg-slate-800 rounded">
                <LogOut className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex flex-col items-center py-20 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin mb-4" />
              <p>Sincronizando com a nuvem...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-4">
                <FinancialForm data={formData} onChange={setFormData} onAdd={handleAddTransaction} />
              </div>
              <div className="lg:col-span-8 space-y-6">
                <DistributionResults result={result} transactions={transactions} userRole={userRole} onGenerateReport={() => setIsReportModalOpen(true)} />
                <TransactionList transactions={transactions} userRole={userRole} onRemove={handleRemoveTransaction} onGenerateInvoice={setSelectedInvoiceTransaction} />
              </div>
            </div>
          )}
          {userRole === 'admin' && !isLoading && (
            <div className="mt-8 h-[300px]">
              <CfoAssistant data={formData} result={result} />
            </div>
          )}
        </main>
      </div>

      <InvoiceModal transaction={selectedInvoiceTransaction} userRole={userRole} onClose={() => setSelectedInvoiceTransaction(null)} />
      {isReportModalOpen && <ReportModal result={result} transactions={transactions} onClose={() => setIsReportModalOpen(false)} />}
    </div>
  );
}
