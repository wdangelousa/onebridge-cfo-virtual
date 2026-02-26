import React from 'react';
import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Cell
} from 'recharts';
import { DistributionResult } from '../types';

interface Props {
    result: DistributionResult;
}

export const CashFlowChart: React.FC<Props> = ({ result }) => {
    const data = [
        {
            name: 'Resultado do Período',
            revenue: result.grossTotal,
            costs: result.totalExpenses,
            margin: result.netIncome,
        }
    ];

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            maximumFractionDigits: 0
        }).format(val);
    };

    return (
        <div className="w-full h-[300px] mt-2 mb-6 bg-slate-50/50 rounded-xl p-4 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                    data={data}
                    margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
                >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip
                        formatter={(value: number) => formatCurrency(value)}
                        contentStyle={{
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                            padding: '12px'
                        }}
                    />
                    <Legend
                        verticalAlign="top"
                        align="right"
                        iconType="circle"
                        wrapperStyle={{ paddingBottom: '20px', fontSize: '12px', fontWeight: 500 }}
                    />

                    {/* Revenue Bar */}
                    <Bar
                        dataKey="revenue"
                        name="Receita Bruta"
                        fill="#10b981"
                        radius={[4, 4, 0, 0]}
                        barSize={60}
                    />

                    {/* Costs Bar */}
                    <Bar
                        dataKey="costs"
                        name="Custos (OpEx + Tax)"
                        fill="#ef4444"
                        radius={[4, 4, 0, 0]}
                        barSize={60}
                    />

                    {/* Net Profit Line */}
                    <Line
                        type="monotone"
                        dataKey="margin"
                        name="Margem Líquida"
                        stroke="#0ea5e9"
                        strokeWidth={3}
                        dot={{ r: 6, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }}
                        activeDot={{ r: 8 }}
                    />
                </ComposedChart>
            </ResponsiveContainer>
        </div>
    );
};
