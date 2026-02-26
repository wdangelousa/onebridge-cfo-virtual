interface ExchangeRateResponse {
  USDBRL: {
    bid: string;
    timestamp: string;
  };
}

// In-memory cache
let cachedRate: number | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 60 * 60 * 1000; // 1 hour in milliseconds

export const getExchangeRate = async (force: boolean = false): Promise<number | null> => {
  const now = Date.now();

  if (!force && cachedRate && (now - lastFetchTime < CACHE_DURATION)) {
    console.log("Using cached exchange rate:", cachedRate);
    return cachedRate;
  }

  try {
    const response = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL');
    if (!response.ok) throw new Error('Falha ao obter cotação');

    const data: ExchangeRateResponse = await response.json();
    const rate = parseFloat(data.USDBRL.bid);

    cachedRate = rate;
    lastFetchTime = now;

    return rate;
  } catch (error) {
    console.error('Erro na API de Câmbio:', error);
    return cachedRate; // Return stale cache if API fails
  }
};

/**
 * Calculates the USD equivalent of a given amount.
 * Ensures accounting stability by returning both the rate and the result.
 */
export const calculateUSDEquivalent = async (amount: number, currency: string) => {
  if (currency === 'USD') {
    return {
      usdAmount: amount,
      rateUsed: 1,
      originalAmount: amount
    };
  }

  const rate = await getExchangeRate();
  if (!rate) throw new Error("Não foi possível obter a taxa de câmbio.");

  return {
    usdAmount: parseFloat((amount / rate).toFixed(2)),
    rateUsed: rate,
    originalAmount: amount
  };
};