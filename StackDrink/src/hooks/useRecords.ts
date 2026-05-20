import { useState, useEffect, useCallback } from 'react';
import { AppState } from 'react-native';
import { DayRecord, Records, loadRecords, saveRecords, todayKey } from '../utils/storage';
import { updateDrinkNotification } from '../utils/notifications';

export function useRecords() {
  const [records, setRecords] = useState<Records>({});

  const reload = useCallback(() => {
    loadRecords().then(setRecords);
  }, []);

  useEffect(() => {
    reload();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => sub.remove();
  }, [reload]);

  const mutateToday = useCallback((fn: (r: DayRecord) => DayRecord) => {
    const key = todayKey();
    setRecords(prev => {
      const today = prev[key] ?? { mugCount: 0, plateCount: 0 };
      const updated = fn(today);
      const next = { ...prev, [key]: updated };
      saveRecords(next);
      updateDrinkNotification(updated.mugCount, updated.plateCount);
      return next;
    });
  }, []);

  const addMug      = useCallback(() => mutateToday(r => ({ ...r, mugCount: r.mugCount + 1 })), [mutateToday]);
  const addPlate    = useCallback(() => mutateToday(r => ({ ...r, plateCount: r.plateCount + 1 })), [mutateToday]);
  const removeMug   = useCallback(() => mutateToday(r => ({ ...r, mugCount: Math.max(0, r.mugCount - 1) })), [mutateToday]);
  const removePlate = useCallback(() => mutateToday(r => ({ ...r, plateCount: Math.max(0, r.plateCount - 1) })), [mutateToday]);

  const today = records[todayKey()] ?? { mugCount: 0, plateCount: 0 };

  return { records, today, addMug, addPlate, removeMug, removePlate };
}
