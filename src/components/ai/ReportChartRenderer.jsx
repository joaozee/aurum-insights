import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const COLORS = ['#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#14B8A6', '#F97316'];

const parseChartData = (text) => {
  const charts = [];
  
  // Detectar tabelas com dados de gastos
  const expensesMatch = text.match(/despesas?\s*[\s\S]*?(?:categoria|categor)[\s\S]*?(\|[\s\S]*?\|)/i);
  if (expensesMatch) {
    const rows = expensesMatch[1].split('\n').filter(r => r.trim());
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const value = parseFloat(cells[cells.length - 1].replace(/[^\d.]/g, ''));
        if (!isNaN(value) && value > 0) {
          data.push({
            name: cells[0],
            value: value
          });
        }
      }
    }
    
    if (data.length > 0) {
      charts.push({
        type: 'pie',
        title: 'Distribuição de Despesas',
        data: data
      });
    }
  }
  
  // Detectar investimentos por setor
  const sectorMatch = text.match(/setor[\s\S]*?(?:\|[\s\S]*?\|)/i);
  if (sectorMatch) {
    const rows = sectorMatch[0].split('\n').filter(r => r.includes('|'));
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 2) {
        const percentage = parseFloat(cells[cells.length - 1].replace(/[^\d.]/g, ''));
        if (!isNaN(percentage) && percentage > 0) {
          data.push({
            name: cells[0],
            value: percentage
          });
        }
      }
    }
    
    if (data.length > 0) {
      charts.push({
        type: 'pie',
        title: 'Alocação por Setor',
        data: data
      });
    }
  }
  
  // Detectar meta/planejamento
  const goalsMatch = text.match(/meta[\s\S]*?(?:\|[\s\S]*?\|)/i);
  if (goalsMatch) {
    const rows = goalsMatch[0].split('\n').filter(r => r.includes('|'));
    const data = [];
    
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].split('|').map(c => c.trim()).filter(c => c);
      if (cells.length >= 3) {
        const current = parseFloat(cells[1].replace(/[^\d.]/g, ''));
        const target = parseFloat(cells[2].replace(/[^\d.]/g, ''));
        if (!isNaN(current) && !isNaN(target)) {
          data.push({
            name: cells[0],
            current: current,
            target: target
          });
        }
      }
    }
    
    if (data.length > 0) {
      charts.push({
        type: 'bar',
        title: 'Progresso das Metas',
        data: data
      });
    }
  }
  
  return charts;
};

const PieChartComponent = ({ data, title }) => (
  <Card className="bg-gray-800 border border-gray-700">
    <CardHeader>
      <CardTitle className="text-white text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value.toFixed(0)}`}
            outerRadius={80}
            fill="#8B5CF6"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => value.toFixed(2)} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

const BarChartComponent = ({ data, title }) => (
  <Card className="bg-gray-800 border border-gray-700">
    <CardHeader>
      <CardTitle className="text-white text-base">{title}</CardTitle>
    </CardHeader>
    <CardContent>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }} />
          <Bar dataKey="current" fill="#8B5CF6" name="Atual" />
          <Bar dataKey="target" fill="#F59E0B" name="Meta" />
        </BarChart>
      </ResponsiveContainer>
    </CardContent>
  </Card>
);

export default function ReportChartRenderer({ content }) {
  const charts = parseChartData(content);
  
  if (charts.length === 0) return null;
  
  return (
    <div className="grid gap-4 my-4">
      {charts.map((chart, idx) => (
        chart.type === 'pie' ? (
          <PieChartComponent key={idx} data={chart.data} title={chart.title} />
        ) : (
          <BarChartComponent key={idx} data={chart.data} title={chart.title} />
        )
      ))}
    </div>
  );
}