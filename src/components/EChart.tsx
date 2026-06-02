import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface EChartProps {
  option: EChartsOption;
  height?: number;
  onEvents?: Record<string, (params: unknown) => void>;
}

export function EChart({ option, height = 320, onEvents }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ height, width: '100%' }}
      notMerge
      lazyUpdate
      theme="dark"
      onEvents={onEvents}
    />
  );
}
