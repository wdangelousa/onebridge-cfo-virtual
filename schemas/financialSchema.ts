import { z } from 'zod';
import { TransactionType, Partner, PaymentMethod, ClientType } from '../types';

export const financialSchema = z.object({
    type: z.nativeEnum(TransactionType),
    description: z.string().min(3, "A descrição deve ter pelo menos 3 caracteres"),

    serviceType: z.string().optional().refine((val) => {
        // Se for receita, serviceType é obrigatório
        return true; // A validação específica pode ser feita no refine do objeto se necessário
    }),

    clientType: z.nativeEnum(ClientType).optional(),
    responsibleName: z.string().optional(),

    grossRevenue: z.number().positive("O valor deve ser maior que zero"),
    govTaxes: z.number().min(0, "Impostos não podem ser negativos"),
    externalCommission: z.number().min(0, "Comissão não pode ser negativa"),
    provisions: z.number().min(0, "Provisões não podem ser negativas"),

    originator: z.nativeEnum(Partner),

    externalCommissionBeneficiary: z.string().optional(),
    linkedClient: z.string().optional(),

    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    paymentLink: z.string().url("Link de pagamento inválido").optional().or(z.literal('')),

    currency: z.enum(['USD', 'BRL']),
    originalAmount: z.number().optional(),
    exchangeRate: z.number().optional(),
    exchangeSource: z.string().optional(),
}).refine((data) => {
    if (data.type === TransactionType.REVENUE && !data.serviceType) {
        return false;
    }
    return true;
}, {
    message: "Por favor, selecione um serviço para receitas",
    path: ["serviceType"]
});

export type FinancialSchema = z.infer<typeof financialSchema>;
