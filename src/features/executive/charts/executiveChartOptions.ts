import type { EChartsOption } from 'echarts';
import type { MonthlyLogisticsTrend } from '@/types/logistics';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const textColor = '#cbd5e1';
const grid = { left: 72, right: 58, top: 44, bottom: 42 };

const formatShortCurrency = (value: number): string => {
  const normalizedValue = Number.isFinite(value) ? value : 0;

  if (Math.abs(normalizedValue) >= 1000) {
    return `${formatCurrency(normalizedValue / 1000)} mil`;
  }

  return formatCurrency(normalizedValue);
};

export const logisticsCostIndexByCompetenceOption = (data: MonthlyLogisticsTrend[]): EChartsOption => ({
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'axis',
    axisPointer: { type: 'cross' },
    formatter: (params) => {
      const items = Array.isArray(params) ? params : [params];
      const index = Number(items[0]?.dataIndex ?? 0);
      const item = data[index];

      if (!item) {
        return '';
      }

      return [
        `<strong>Competência: ${item.label}</strong>`,
        `Receita: ${formatCurrency(item.recognizedRevenue)}`,
        `Custo Logístico: ${formatCurrency(item.totalLogisticsCost)}`,
        `Índice Logístico: ${formatPercent(item.logisticsIndex)}`,
        `NFs: ${formatDecimal(item.invoiceCount)}`,
        `Peso Bruto Operacional: ${formatDecimal(item.operationalGrossWeight)} kg`,
      ].join('<br />');
    },
  },
  legend: { textStyle: { color: textColor } },
  grid,
  xAxis: {
    type: 'category',
    data: data.map((item) => item.label),
    axisLabel: { color: textColor },
  },
  yAxis: [
    {
      type: 'value',
      name: 'Custo',
      axisLabel: { color: textColor, formatter: (value: number) => formatShortCurrency(value) },
      splitLine: { lineStyle: { color: 'rgba(148, 163, 184, 0.12)' } },
    },
    {
      type: 'value',
      name: 'Índice',
      axisLabel: { color: textColor, formatter: (value: number) => formatPercent(value) },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: 'Custo Logístico Total',
      type: 'bar',
      yAxisIndex: 0,
      data: data.map((item) => item.totalLogisticsCost),
      itemStyle: { color: '#f4b860', borderRadius: [8, 8, 2, 2] },
      label: {
        show: true,
        position: 'top',
        color: textColor,
        fontSize: 11,
        formatter: ({ value }) => formatShortCurrency(Number(value)),
      },
    },
    {
      name: 'Índice Logístico %',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: data.map((item) => item.logisticsIndex),
      lineStyle: { color: '#65b7ff', width: 3 },
      itemStyle: { color: '#65b7ff' },
      symbolSize: 8,
      label: {
        show: true,
        position: 'top',
        color: '#dbeafe',
        fontSize: 11,
        formatter: ({ value }) => formatPercent(Number(value)),
      },
    },
  ],
});
