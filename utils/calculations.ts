import { FinancialData, DistributionResult, Partner, SHARES, RATES, TransactionType } from '../types';

/**
 * Converte valor decimal para cêntimos (inteiro)
 */
const toCents = (val: number): number => Math.round(val * 100);

/**
 * Converte cêntimos (inteiro) de volta para decimal
 */
const fromCents = (val: number): number => val / 100;

export const calculateDistribution = (transactions: FinancialData[]): DistributionResult => {
  let totalGrossCents = 0;
  let totalOpExCents = 0;
  let totalOriginationCents = 0;

  let originationByPartnerCents = {
    [Partner.EVANDRO]: 0,
    [Partner.JULIA_SAMUEL]: 0,
    [Partner.WALTER]: 0,
    [Partner.NONE]: 0
  };

  let revenuePoolCents = 0;

  // 1. Processamento em Cêntimos
  transactions.forEach(t => {
    const grossCents = toCents(t.grossRevenue || 0);
    const taxesCents = toCents(t.govTaxes || 0);
    const commCents = toCents(t.externalCommission || 0);
    const provCents = toCents(t.provisions || 0);

    const deductionsCents = taxesCents + commCents + provCents;

    if (t.type === TransactionType.REVENUE) {
      totalGrossCents += grossCents;
      const dealNetCents = Math.max(0, grossCents - deductionsCents);
      revenuePoolCents += dealNetCents;

      if (t.originator !== Partner.NONE) {
        // Cálculo de taxa de originação (10%)
        const feeCents = Math.round(dealNetCents * RATES.ORIGINATION);
        originationByPartnerCents[t.originator] += feeCents;
        totalOriginationCents += feeCents;
      }
    } else {
      // Despesa (OpEx)
      totalOpExCents += deductionsCents;
    }
  });

  // 2. Waterfall Global em Inteiros
  const globalNetBeforeOriginationCents = revenuePoolCents - totalOpExCents;
  const baseForDistributionCents = Math.max(0, globalNetBeforeOriginationCents - totalOriginationCents);

  // 3. Alocação de Reserva (12%)
  const companyReserveCents = Math.round(baseForDistributionCents * RATES.RESERVE);

  // Total a ser distribuído entre os sócios (Restante)
  const calculatedDistributableCents = Math.max(0, baseForDistributionCents - companyReserveCents);

  // 4. Divisão entre Sócios (33.33% / 33.34%)
  // Para garantir que a soma das partes seja EXATAMENTE igual ao total distribuível:
  let shareEvandroCents = Math.round(calculatedDistributableCents * SHARES.EVANDRO);
  let shareJuliaCents = Math.round(calculatedDistributableCents * SHARES.JULIA_SAMUEL);

  // O último sócio (Walter) recebe o remanescente matemático para evitar sobras/faltas de cêntimos
  let shareWalterCents = calculatedDistributableCents - (shareEvandroCents + shareJuliaCents);

  // 5. Cálculo do Net Income Global para display
  const totalNetCents = Math.max(0, revenuePoolCents - totalOpExCents);

  // 6. Retorno com Conversão para Decimal
  return {
    grossTotal: fromCents(totalGrossCents),
    totalExpenses: fromCents(totalOpExCents),
    netIncome: fromCents(totalNetCents),
    originationFee: fromCents(totalOriginationCents),
    companyReserve: fromCents(companyReserveCents),
    distributableBalance: fromCents(calculatedDistributableCents),
    partnerShares: {
      evandro: fromCents(shareEvandroCents),
      juliaSamuel: fromCents(shareJuliaCents),
      walter: fromCents(shareWalterCents)
    },
    finalPayouts: {
      evandro: fromCents(shareEvandroCents + originationByPartnerCents[Partner.EVANDRO]),
      juliaSamuel: fromCents(shareJuliaCents + originationByPartnerCents[Partner.JULIA_SAMUEL]),
      walter: fromCents(shareWalterCents + originationByPartnerCents[Partner.WALTER]),
      reserve: fromCents(companyReserveCents)
    }
  };
};