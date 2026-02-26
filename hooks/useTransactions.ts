import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { FinancialData, Partner, TransactionType, PaymentMethod, ClientType } from '../types';

// ==========================================
// Mapeamento de Dados (Camadas de Integração)
// ==========================================

const mapFromDb = (dbItem: any): FinancialData => ({
    id: dbItem.id,
    date: dbItem.transaction_date,
    type: dbItem.type as TransactionType,
    description: dbItem.description,
    serviceType: dbItem.service_type,
    clientType: dbItem.client_type as ClientType,
    responsibleName: dbItem.responsible_name,
    grossRevenue: Number(dbItem.gross_revenue),
    govTaxes: Number(dbItem.gov_taxes),
    externalCommission: Number(dbItem.external_commission),
    provisions: Number(dbItem.provisions),
    originator: dbItem.originator as Partner,
    externalCommissionBeneficiary: dbItem.external_commission_beneficiary,
    linkedClient: dbItem.linked_client,
    paymentMethod: dbItem.payment_method as PaymentMethod,
    paymentLink: dbItem.payment_link,
    currency: dbItem.currency as 'USD' | 'BRL',
    originalAmount: dbItem.original_amount ? Number(dbItem.original_amount) : undefined,
    exchangeRate: dbItem.exchange_rate ? Number(dbItem.exchange_rate) : undefined,
    exchangeSource: dbItem.exchange_source,
    companyId: dbItem.company_id
});

const mapToDb = (item: FinancialData, userId: string, companyId: string): any => ({
    user_id: userId,
    company_id: companyId,
    transaction_date: item.date || new Date().toISOString(),
    type: item.type,
    description: item.description,
    service_type: item.serviceType,
    client_type: item.clientType,
    responsible_name: item.responsibleName,
    gross_revenue: item.grossRevenue,
    gov_taxes: item.govTaxes,
    external_commission: item.externalCommission,
    provisions: item.provisions,
    originator: item.originator,
    external_commission_beneficiary: item.externalCommissionBeneficiary,
    linked_client: item.linkedClient,
    payment_method: item.paymentMethod,
    payment_link: item.paymentLink,
    currency: item.currency,
    original_amount: item.originalAmount,
    exchange_rate: item.exchangeRate,
    exchange_source: item.exchangeSource
});

// ==========================================
// Hook useTransactions
// ==========================================

export const useTransactions = (userId: string | undefined, companyId: string | undefined) => {
    const queryClient = useQueryClient();

    // 1. Query: Listagem de Transações (Filtrado por Empresa)
    const { data: transactions = [], isLoading, error } = useQuery({
        queryKey: ['transactions', userId, companyId],
        queryFn: async () => {
            if (!userId || !companyId) return [];
            const { data, error } = await supabase
                .from('transactions')
                .select('*')
                .eq('user_id', userId)
                .eq('company_id', companyId)
                .order('transaction_date', { ascending: false });

            if (error) throw error;
            return (data || []).map(mapFromDb);
        },
        enabled: !!userId,
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
    });

    // 2. Mutation: Inserir Transação
    const addMutation = useMutation({
        mutationFn: async (newData: FinancialData) => {
            if (!userId || !companyId) throw new Error("Usuário ou Empresa não selecionados");
            const dbData = mapToDb(newData, userId, companyId);
            const { data, error } = await supabase
                .from('transactions')
                .insert([dbData])
                .select()
                .single();
            if (error) throw error;
            return mapFromDb(data);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', userId, companyId] });
        },
    });

    // 3. Mutation: Remover Transação
    const removeMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', userId, companyId] });
        },
    });

    // 4. Mutation: Limpar Período (Filtrado por Empresa)
    const clearMutation = useMutation({
        mutationFn: async () => {
            if (!userId || !companyId) return;
            const { error } = await supabase
                .from('transactions')
                .delete()
                .eq('user_id', userId)
                .eq('company_id', companyId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['transactions', userId, companyId] });
        },
    });

    return {
        transactions,
        isLoading,
        error,
        addTransaction: addMutation.mutateAsync,
        removeTransaction: removeMutation.mutateAsync,
        clearTransactions: clearMutation.mutateAsync,
        isProcessing: addMutation.status === 'pending' || removeMutation.status === 'pending' || clearMutation.status === 'pending'
    };
};
