'use client';

import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';

interface ChartColors {
  grid: string;
  tick: string;
  stroke: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
}

const darkColors: ChartColors = {
  grid: 'rgba(255,255,255,0.04)',
  tick: '#71717a',
  stroke: '#3A5A8C',
  tooltipBg: '#1a1a2e',
  tooltipBorder: 'rgba(255,255,255,0.10)',
  tooltipText: '#ffffff',
};

const lightColors: ChartColors = {
  grid: 'rgba(0,0,0,0.06)',
  tick: '#6b7280',
  stroke: '#1B2A4A',
  tooltipBg: '#ffffff',
  tooltipBorder: '#E5E5EC',
  tooltipText: '#111118',
};

export function useChartColors(): ChartColors {
  const { resolvedTheme } = useTheme();
  const [colors, setColors] = useState<ChartColors>(darkColors);

  useEffect(() => {
    setColors(resolvedTheme === 'light' ? lightColors : darkColors);
  }, [resolvedTheme]);

  return colors;
}
