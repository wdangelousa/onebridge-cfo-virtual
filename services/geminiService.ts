import { FinancialData, DistributionResult } from "../types";
import { supabase } from "../lib/supabase";

export const getCFOAnalysis = async (_data: FinancialData, result: DistributionResult): Promise<string> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-cfo-analysis', {
      body: { result }
    });

    if (error) {
      console.error("Erro ao chamar Edge Function:", error);
      return "Erro na conexão com o CFO AI.";
    }

    return data.analysis || "Análise indisponível.";
  } catch (error) {
    console.error("Erro inesperado ao chamar Gemini:", error);
    return "Erro na conexão com o CFO AI.";
  }
};