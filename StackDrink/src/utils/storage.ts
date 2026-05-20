// AsyncStorage は React Native でデータをスマホ内に保存するためのライブラリ
// ブラウザの localStorage に相当するもの（キーと値のペアで保存する）
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1日分の記録を表す型定義
// TypeScript では interface や type でデータの"形"を定義できる
export interface DayRecord {
  mugCount: number;   // その日のジョッキ数
  plateCount: number; // その日のお皿数
}

// 全日付の記録をまとめた型
// Record<K, V> は「キーがK型、値がV型のオブジェクト」を意味する組み込み型
// 例: { "2024-01-01": { mugCount: 3, plateCount: 2 }, "2024-01-02": { ... } }
export type Records = Record<string, DayRecord>;

// AsyncStorage に保存する際のキー名（衝突を避けるため固有の名前にする）
const STORAGE_KEY = 'stackDrinkRecords';

// 今日の日付を "YYYY-MM-DD" 形式の文字列で返す関数
// これをオブジェクトのキーとして使うことで、日付ごとに記録を管理する
export function todayKey(): string {
  const d = new Date();
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'), // 月は0始まりなので+1、2桁にゼロ埋め
    String(d.getDate()).padStart(2, '0'),        // 日も2桁にゼロ埋め
  ].join('-');
}

// AsyncStorage から全記録を読み込む非同期関数
// async/await を使うことで、非同期処理を同期的に書ける
export async function loadRecords(): Promise<Records> {
  try {
    // getItem はキーに対応する文字列（JSON）を返す。なければ null
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    // JSON.parse で文字列をオブジェクトに変換。データがなければ空オブジェクトを返す
    return raw ? (JSON.parse(raw) as Records) : {};
  } catch {
    // 読み込みに失敗した場合も空オブジェクトを返してアプリを継続させる
    return {};
  }
}

// 全記録を AsyncStorage に保存する非同期関数
export async function saveRecords(records: Records): Promise<void> {
  try {
    // JSON.stringify でオブジェクトを文字列に変換してから保存
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {}
}
