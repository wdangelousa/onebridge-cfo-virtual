import React, { useState } from 'react';
import { FinancialData, DistributionResult } from '../types';
import { getCFOAnalysis } from '../services/geminiService';
import { Bot, RefreshCw, Sparkles } from 'lucide-react';

interface Props {
  data: FinancialData;
  result: DistributionResult;
}

export const CfoAssistant: React.FC<Props> = ({ data, result }) => {
  const [analysis, setAnalysis] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    const response = await getCFOAnalysis(data, result);
    setAnalysis(response);
    setLoading(false);
  };

  return (
    <div className="bg-slate-900 text-slate-200 rounded-xl shadow-lg border border-slate-700 overflow-hidden h-full flex flex-col">
      <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-800 rounded-lg border border-slate-700">
             <Bot className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">CFO Virtual AI</h2>
            <p className="text-xs text-slate-400">Powered by Gemini</p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || data.grossRevenue === 0}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            loading || data.grossRevenue === 0
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 border border-emerald-500'
          }`}
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {loading ? 'Analisando...' : 'Gerar Parecer'}
        </button>
      </div>

      <div className="p-6 flex-grow overflow-auto font-mono text-sm leading-relaxed scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent">
        {analysis ? (
          <div className="prose prose-invert max-w-none prose-p:text-slate-300 prose-strong:text-emerald-400">
            <p className="whitespace-pre-wrap">{analysis}</p>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
            <Bot className="w-12 h-12 opacity-10" />
            <p className="text-center max-w-xs text-slate-500">
              Preencha os dados da transação e solicite uma análise estratégica para sua LLC.
            </p>
          </div>
        )}
      </div>
      
      {/* Footer warning */}
      <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 text-center uppercase tracking-wider">
         OneBridge Stalwart LLC • Internal Use Only • Confidential
      </div>
    </div>
  );
};