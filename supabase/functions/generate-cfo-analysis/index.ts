// Supabase Edge Function: generate-cfo-analysis
// local path: supabase/functions/generate-cfo-analysis/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { result } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            throw new Error('GEMINI_API_KEY is not set')
        }

        const prompt = `
      Atue como o CFO Virtual da ONEBRIDGE STALWART, uma LLC de Wyoming.
      
      CONTEXTO:
      Você está analisando o FECHAMENTO QUINZENAL (Batch) da empresa.

      RESULTADOS DO PERÍODO:
      - Receita Bruta Total: $${result.grossTotal.toFixed(2)}
      - Despesas Operacionais Totais: $${result.totalExpenses.toFixed(2)}
      - Resultado Líquido Final: $${result.netIncome.toFixed(2)}
      - Reserva Retida: $${result.companyReserve.toFixed(2)}
      - Total Distribuído aos Sócios: $${(result.finalPayouts.evandro + result.finalPayouts.juliaSamuel + result.finalPayouts.walter).toFixed(2)}

      SUA TAREFA:
      Forneça um parecer executivo sobre este fechamento quinzenal.
      1. Analise a relação Receita x Despesa.
      2. Se o resultado for negativo, sugira ações imediatas (Call de capital ou uso de reserva).
      3. Se for positivo, comente sobre a saúde do cash flow.
      4. Mantenha o tom profissional e direto. Máximo 3 parágrafos.
    `;

        // Calling Gemini API via REST
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }]
            })
        })

        const data = await response.json()
        const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || "Análise indisponível."

        return new Response(
            JSON.stringify({ analysis }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400
            }
        )
    }
})
