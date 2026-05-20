import AsyncStorage from '@react-native-async-storage/async-storage';

export interface DayRecord {
  mugCount: number;
  plateCount: number;
}

export type Records = Record<string, DayRecord>;

const STORAGE_KEY = 'stackDrinkRecords';

export function todayKey(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-');
}

export async function loadRecords(): Promise<Records> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Records) : {};
  } catch {
    return {};
  }
}

export async function saveRecords(records: Records): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}
