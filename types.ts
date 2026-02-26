export enum Partner {
  EVANDRO = 'Evandro (Profiscal)',
  JULIA_SAMUEL = 'Julia/Samuel (Elevated)',
  WALTER = 'Walter (Moraes D\'Angelo)',
  NONE = 'Nenhum (Orgânico)'
}

export enum TransactionType {
  REVENUE = 'revenue',
  EXPENSE = 'expense'
}

export enum PaymentMethod {
  WIRE = 'Wire Transfer',
  ZELLE = 'Zelle',
  PARCELADO_USA = 'ParceladoUSA'
}

export enum ClientType {
  INDIVIDUAL = 'Pessoa Física',
  COMPANY = 'Pessoa Jurídica'
}

export interface Company {
  id: string;
  name: string;
  ein: string;
  logoUrl?: string;
  address?: string;
}

export interface FinancialData {
  id?: string;
  companyId: string; // Mandatory for multi-tenant isolation
  date?: string;
  type: TransactionType;
  description: string; // Stores Client Name for Revenue, Description for Expense

  // Service & Client Details (New)
  serviceType?: string; // The specific service from the list
  clientType?: ClientType;
  responsibleName?: string; // For Company clients

  // Core Values (Always in USD for calculation)
  grossRevenue: number;
  govTaxes: number;
  externalCommission: number;
  provisions: number;
  originator: Partner;

  // Beneficiary details
  externalCommissionBeneficiary?: string; // Who receives the external commission
  linkedClient?: string; // Link expense to a specific client/project

  // Payment Details
  paymentMethod?: PaymentMethod;
  paymentLink?: string; // For ParceladoUSA or other link-based payments

  // Currency Metadata
  currency: 'USD' | 'BRL';
  originalAmount?: number; // The amount typed in the original currency
  exchangeRate?: number;   // Deprecated: use exchangeRateUsed
  exchangeRateUsed?: number; // The exact rate used at the moment of the transaction
  exchangeSource?: string; // e.g., "AwesomeAPI"
}

export interface DistributionResult {
  grossTotal: number;
  totalExpenses: number;
  netIncome: number;
  originationFee: number;
  companyReserve: number;
  distributableBalance: number;
  partnerShares: {
    evandro: number;
    juliaSamuel: number;
    walter: number;
  };
  finalPayouts: {
    evandro: number;
    juliaSamuel: number;
    walter: number;
    reserve: number;
  };
}

export const SHARES = {
  EVANDRO: 0.3334,
  JULIA_SAMUEL: 0.3333,
  WALTER: 0.3333
};

export const RATES = {
  ORIGINATION: 0.10,
  RESERVE: 0.12,
  DISTRIBUTION: 0.78
};