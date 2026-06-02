import type { EChartsOption } from 'echarts';
import type { EnrichedInvoice, RankingItem } from '@/types/logistics';
import { formatCurrency, formatPercent } from '@/utils/formatters';

const textColor = '#cbd5e1';
const grid = { left: 52, right: 28, top: 34, bottom: 42 };

export const revenueCostComboOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis' },
  legend: { textStyle: { color: textColor } },
  grid,
  xAxis: { type: 'category', data: data.map((item) => item.label), axisLabel: { color: textColor } },
  yAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatCurrency(value) } },
  series: [
    { name: 'Receita', type: 'bar', data: data.map((item) => item.value), itemStyle: { color: '#65b7ff', borderRadius: 8 } },
    { name: 'Custo logístico', type: 'line', smooth: true, data: data.map((item) => item.secondary ?? 0), lineStyle: { color: '#f4b860', width: 3 }, symbolSize: 8 },
  ],
});

export const customerCostRankingOption = (data: RankingItem[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: {
    confine: true,
    borderWidth: 1,
    borderColor: 'rgba(101, 183, 255, 0.28)',
    backgroundColor: 'rgba(7, 9, 13, 0.94)',
    formatter: (params: unknown) => {
      const item = params as { data?: { customer?: string; rank?: number; value?: number } };
      return `${item.data?.rank ?? ''}º ${item.data?.customer ?? ''}<br/>Índice Logístico: ${formatPercent(Number(item.data?.value ?? 0))}`;
    },
  },
  grid: { left: 260, right: 88, top: 24, bottom: 24, containLabel: false },
  xAxis: { type: 'value', axisLabel: { color: textColor, formatter: (value: number) => formatPercent(value) } },
  yAxis: {
    type: 'category',
    data: data.map((item, index) => `${index + 1}º ${item.label}`),
    axisLabel: {
      color: textColor,
      width: 238,
      overflow: 'break',
      lineHeight: 15,
      fontSize: 11,
    },
  },
  series: [
    {
      type: 'bar',
      data: data.map((item, index) => ({
        value: item.value,
        customer: item.label,
        rank: index + 1,
        itemStyle: { color: index < 3 ? '#f4b860' : '#ff7a7a', borderRadius: [0, 10, 10, 0] },
      })),
      barWidth: 18,
      label: {
        show: true,
        position: 'right',
        color: '#f8fafc',
        fontWeight: 700,
        formatter: (params: unknown) => formatPercent(Number((params as { value?: unknown }).value ?? 0)),
      },
      emphasis: {
        focus: 'series',
        itemStyle: {
          shadowBlur: 18,
          shadowColor: 'rgba(255,122,122,.35)',
        },
      },
      animationDuration: 700,
      animationEasing: 'quarticOut',
    },
  ],
});

export const weightIndexScatterOption = (invoices: EnrichedInvoice[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: {
    formatter: (params: unknown) => {
      const value = (params as { value: [number, number, string] }).value;
      return `${value[2]}<br/>Peso: ${value[0].toLocaleString('pt-BR')} kg<br/>Índice: ${formatPercent(value[1])}`;
    },
  },
  grid,
  xAxis: { type: 'value', name: 'Peso bruto', axisLabel: { color: textColor } },
  yAxis: { type: 'value', name: 'Índice', axisLabel: { color: textColor, formatter: (value: number) => formatPercent(value) } },
  series: [
    {
      type: 'scatter',
      symbolSize: 14,
      data: invoices.map((invoice) => [invoice.grossWeight, invoice.logisticsIndex, invoice.customer]),
      itemStyle: { color: '#6ee7b7' },
    },
  ],
});
