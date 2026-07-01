import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import * as echarts from 'echarts';
import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';
import type { BrazilMapDatum } from '@/features/executive/types/map';
import { publicUrl } from '@/shared/publicUrl';
import { formatCurrency, formatDecimal, formatPercent } from '@/utils/formatters';

const BRAZIL_MAP_NAME = 'brazil-logistic-states';
const BRAZIL_GEOJSON_URL = publicUrl('/data/brazil-states.geojson');
const VALID_BRAZIL_UFS = new Set([
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO',
]);
let isBrazilMapRegistered = false;

const isValidBrazilUf = (value: unknown): value is string =>
  typeof value === 'string' && VALID_BRAZIL_UFS.has(value.toUpperCase());

const buildTooltip = (datum?: BrazilMapDatum, fallbackName?: string): string => {
  if (!datum || datum.invoiceCount === 0) {
    return `
      <div style="min-width:220px;padding:12px 14px;color:#e8edf5">
        <div style="font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#65b7ff">UF sem operação</div>
        <div style="margin-top:6px;font-size:18px;font-weight:700">${fallbackName ?? 'Sem dados no filtro atual'}</div>
      </div>
    `;
  }

  const rows = [
    ['Receita', formatCurrency(datum.revenue)],
    ['Custo Transporte', formatCurrency(datum.transportCost)],
    ['Custo Operacional', formatCurrency(datum.operationalCost)],
    ['Custo Logístico Total', formatCurrency(datum.totalLogisticsCost)],
    ['Índice Logístico', formatPercent(datum.logisticsIndex)],
    ['Quantidade NF', formatDecimal(datum.invoiceCount)],
  ];

  return `
    <div style="min-width:270px;padding:14px 16px;color:#e8edf5">
      <div style="font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:#f4b860">Inteligência logística</div>
      <div style="margin-top:6px;font-size:22px;font-weight:800;color:#fff">${datum.uf}</div>
      <div style="margin-top:12px;display:grid;gap:8px">
        ${rows
          .map(
            ([label, value]) => `
              <div style="display:flex;justify-content:space-between;gap:18px;border-top:1px solid rgba(255,255,255,.08);padding-top:8px">
                <span style="color:#94a3b8">${label}</span>
                <strong style="color:#fff">${value}</strong>
              </div>
            `,
          )
          .join('')}
      </div>
    </div>
  `;
};

const buildMapOption = (data: BrazilMapDatum[], activeUfs: string[]): EChartsOption => {
  const values = data.map((item) => (Number.isFinite(item.value) ? item.value : 0));
  const min = 0;
  const max = values.some((value) => value > 0) ? Math.max(...values) : 1;

  return {
    backgroundColor: 'transparent',
    animation: true,
    tooltip: {
      trigger: 'item',
      confine: true,
      borderWidth: 1,
      borderColor: 'rgba(101, 183, 255, 0.28)',
      backgroundColor: 'rgba(7, 9, 13, 0.94)',
      extraCssText: 'border-radius:18px;box-shadow:0 22px 60px rgba(0,0,0,.42);backdrop-filter:blur(18px);',
      formatter: (params: unknown) => {
        const item = Array.isArray(params) ? params[0] : params;
        if (!item || typeof item !== 'object') {
          return '';
        }

        const seriesType = (item as { seriesType?: string }).seriesType;
        const componentType = (item as { componentType?: string }).componentType;
        if (componentType !== 'series' || seriesType !== 'map') {
          return '';
        }

        const datum =
          ((item as { data?: BrazilMapDatum }).data ?? undefined);
        const name =
          'name' in item ? String((item as { name?: unknown }).name ?? '') : '';

        if (!isValidBrazilUf(name)) {
          return '';
        }

        return buildTooltip(datum, name);
      },
    },
    visualMap: {
      type: 'continuous',
      min,
      max,
      left: 10,
      bottom: 12,
      itemWidth: 12,
      itemHeight: 118,
      text: ['Alto custo', 'Baixo custo'],
      textStyle: { color: '#94a3b8', fontSize: 11 },
      calculable: false,
      inRange: {
        color: ['#2563eb', '#65b7ff', '#f4b860', '#fb923c', '#ef4444'],
      },
    },
    series: [
      {
        name: 'Índice Logístico',
        type: 'map',
        map: BRAZIL_MAP_NAME,
        nameProperty: 'short_name',
        roam: true,
        zoom: 1.16,
        scaleLimit: { min: 0.9, max: 5 },
        layoutCenter: ['52%', '50%'],
        layoutSize: '106%',
        selectedMode: false,
        data,
        emphasis: {
          itemStyle: {
            areaColor: '#ff7a7a',
            borderColor: '#ffffff',
            borderWidth: 1.4,
            shadowBlur: 18,
            shadowColor: 'rgba(255,122,122,.45)',
          },
          label: { show: true, color: '#ffffff', fontWeight: 800 },
        },
        itemStyle: {
          borderColor: 'rgba(226,232,240,.42)',
          borderWidth: 0.75,
          shadowBlur: 10,
          shadowColor: 'rgba(101,183,255,.12)',
          areaColor: '#17202c',
        },
        label: {
          show: true,
          color: 'rgba(255,255,255,.74)',
          fontSize: 10,
          fontWeight: 700,
        },
      },
    ],
    graphic:
      activeUfs.length > 0
        ? [
            {
              type: 'text',
              right: 18,
              top: 14,
              style: {
                text: `UF ativa: ${activeUfs.join(', ')}`,
                fill: '#f8fafc',
                font: '700 13px Manrope',
                backgroundColor: 'rgba(244,184,96,.16)',
                borderColor: 'rgba(244,184,96,.32)',
                borderWidth: 1,
                borderRadius: 10,
                padding: [8, 10],
              },
            },
          ]
        : [],
  };
};

interface BrazilLogisticMapProps {
  data: BrazilMapDatum[];
  activeUfs: string[];
  selectedMetrics: BrazilMapDatum[];
  onSelectUf: (uf: string) => void;
  onClearUf: () => void;
}

function BrazilLogisticMapComponent({
  data,
  activeUfs,
  selectedMetrics,
  onSelectUf,
  onClearUf,
}: BrazilLogisticMapProps) {
  const [isMapReady, setIsMapReady] = useState(isBrazilMapRegistered);

  useEffect(() => {
    if (isBrazilMapRegistered) {
      setIsMapReady(true);
      return;
    }

    let isMounted = true;

    fetch(BRAZIL_GEOJSON_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Falha ao carregar GeoJSON Brasil: ${response.status}`);
        }

        return response.json() as Promise<Parameters<typeof echarts.registerMap>[1]>;
      })
      .then((geoJson) => {
        echarts.registerMap(BRAZIL_MAP_NAME, geoJson);
        isBrazilMapRegistered = true;

        if (isMounted) {
          setIsMapReady(true);
        }
      })
      .catch(() => {
        if (isMounted) {
          setIsMapReady(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const mapData = useMemo(
    () =>
      data.map((item) => ({
        ...item,
        itemStyle: activeUfs.includes(item.uf)
          ? {
              areaColor: '#f4b860',
              borderColor: '#fff7ed',
              borderWidth: 2,
            }
          : undefined,
        label: activeUfs.includes(item.uf) ? { color: '#07090d', fontWeight: 800 } : undefined,
      })),
    [activeUfs, data],
  );

  const option = useMemo(() => buildMapOption(mapData, activeUfs), [activeUfs, mapData]);

  const handleMapClick = useCallback(
    (params: unknown) => {
      const event = params as {
        componentType?: string;
        seriesType?: string;
        data?: { uf?: string };
        name?: string;
      };
      if (event.componentType !== 'series') return;
      if (event.seriesType !== 'map') return;

      const uf = event.data?.uf ?? event.name;
      if (!isValidBrazilUf(uf)) return;
      onSelectUf(uf);
    },
    [onSelectUf],
  );

  const handleMapDoubleClick = useCallback(() => {
    if (activeUfs.length === 0) return;
    onClearUf();
  }, [activeUfs.length, onClearUf]);

  const events = useMemo(
    () => ({
      click: handleMapClick,
      dblclick: handleMapDoubleClick,
    }),
    [handleMapClick, handleMapDoubleClick],
  );

  return (
    <div className="relative min-h-[390px] overflow-hidden rounded-[1.65rem] border border-white/10 bg-graphite-950/40">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(101,183,255,.15),transparent_44%),linear-gradient(145deg,rgba(255,255,255,.04),transparent)]" />
      {isMapReady ? (
        <div
          className={`relative grid min-h-[390px] ${
            selectedMetrics.length > 0 ? 'grid-cols-[minmax(0,1fr)_260px]' : 'grid-cols-1'
          }`}
        >
          <ReactECharts
            option={option}
            notMerge={true}
            lazyUpdate={false}
            onEvents={events}
            style={{ height: 390, width: '100%' }}
            opts={{ renderer: 'canvas' }}
          />
          {selectedMetrics.length > 0 ? <UfExecutivePanel metrics={selectedMetrics} /> : null}
        </div>
      ) : (
        <div className="flex h-[390px] items-center justify-center">
          <div className="h-20 w-20 animate-pulse rounded-full border border-signal-blue/40 bg-signal-blue/10 shadow-[0_0_40px_rgba(101,183,255,.18)]" />
        </div>
      )}
    </div>
  );
}

function UfExecutivePanel({ metrics }: { metrics: BrazilMapDatum[] }) {
  if (metrics.length === 1) {
    const metric = metrics[0];
    const rows = [
      ['Receita', formatCurrency(metric.revenue)],
      ['Custo Transporte', formatCurrency(metric.transportCost)],
      ['Custo Operacional', formatCurrency(metric.operationalCost)],
      ['Custo Logístico Total', formatCurrency(metric.totalLogisticsCost)],
      ['Índice Logístico', formatPercent(metric.logisticsIndex)],
      ['Quantidade NF', formatDecimal(metric.invoiceCount)],
    ];

    return (
      <aside className="relative z-10 m-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal-amber">Painel UF</p>
        <h3 className="mt-2 font-display text-3xl font-semibold text-white">{metric.uf}</h3>
        <div className="mt-4 space-y-2">
          {rows.map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
              <div className="text-[11px] text-slate-500">{label}</div>
              <div className="mt-1 break-words text-sm font-semibold text-white">{value}</div>
            </div>
          ))}
        </div>
      </aside>
    );
  }

  const consolidated = metrics.reduce(
    (acc, metric) => ({
      revenue: acc.revenue + metric.revenue,
      transportCost: acc.transportCost + metric.transportCost,
      operationalCost: acc.operationalCost + metric.operationalCost,
      totalLogisticsCost: acc.totalLogisticsCost + metric.totalLogisticsCost,
      invoiceCount: acc.invoiceCount + metric.invoiceCount,
    }),
    {
      revenue: 0,
      transportCost: 0,
      operationalCost: 0,
      totalLogisticsCost: 0,
      invoiceCount: 0,
    },
  );
  const logisticsIndex = consolidated.revenue === 0 ? 0 : consolidated.totalLogisticsCost / consolidated.revenue;
  const rows = [
    ['UFs selecionadas', metrics.map((item) => item.uf).join(', ')],
    ['Receita', formatCurrency(consolidated.revenue)],
    ['Custo Transporte', formatCurrency(consolidated.transportCost)],
    ['Custo Operacional', formatCurrency(consolidated.operationalCost)],
    ['Custo Logístico Total', formatCurrency(consolidated.totalLogisticsCost)],
    ['Índice Logístico', formatPercent(logisticsIndex)],
    ['Quantidade NF', formatDecimal(consolidated.invoiceCount)],
  ];

  return (
    <aside className="relative z-10 m-4 rounded-3xl border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <p className="text-xs font-bold uppercase tracking-[0.18em] text-signal-amber">Painel UF</p>
      <h3 className="mt-2 font-display text-3xl font-semibold text-white">{metrics.length} UFs</h3>
      <div className="mt-4 space-y-2">
        {rows.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.035] px-3 py-2">
            <div className="text-[11px] text-slate-500">{label}</div>
            <div className="mt-1 break-words text-sm font-semibold text-white">{value}</div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export const BrazilLogisticMap = memo(BrazilLogisticMapComponent);
