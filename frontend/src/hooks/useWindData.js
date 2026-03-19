import { useState, useCallback, useRef } from 'react';
import { fetchActuals, fetchForecasts, mergeChartData, computeMetrics } from '../utils/api';

export function useWindData() {
  const [state, setState] = useState({
    chartData: [],
    metrics: null,
    loading: false,
    error: null,
    lastFetched: null,
  });

  const abortRef = useRef(null);

  const load = useCallback(async (from, to, horizon) => {
    // Cancel any in-flight request
    if (abortRef.current) abortRef.current = false;
    const token = {};
    abortRef.current = token;

    setState(s => ({ ...s, loading: true, error: null }));

    try {
      const [actualsRes, forecastsRes] = await Promise.all([
        fetchActuals(from, to),
        fetchForecasts(from, to, horizon),
      ]);

      if (token !== abortRef.current) return; // stale

      const chartData = mergeChartData(actualsRes.data, forecastsRes.data);
      const metrics = computeMetrics(chartData);

      setState({
        chartData,
        metrics,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });
    } catch (err) {
      if (token !== abortRef.current) return;
      setState(s => ({ ...s, loading: false, error: err.message }));
    }
  }, []);

  return { ...state, load };
}
