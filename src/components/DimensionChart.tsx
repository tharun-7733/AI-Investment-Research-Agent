"use client";

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

interface DimensionChartProps {
  growth: number;
  moat: number;
  health: number;
  sentiment: number;
  valuation: number;
}

export function DimensionChart({ growth, moat, health, sentiment, valuation }: DimensionChartProps) {
  const data = [
    { subject: 'Growth', A: growth, fullMark: 10 },
    { subject: 'Moat', A: moat, fullMark: 10 },
    { subject: 'Financial Health', A: health, fullMark: 10 },
    { subject: 'Sentiment', A: sentiment, fullMark: 10 },
    { subject: 'Valuation', A: valuation, fullMark: 10 },
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data}>
        <PolarGrid stroke="#e5e7eb" />
        <PolarAngleAxis dataKey="subject" tick={{ fill: '#4b5563', fontSize: 12 }} />
        <PolarRadiusAxis angle={30} domain={[0, 10]} tick={false} axisLine={false} />
        <Radar name="Score" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.5} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
