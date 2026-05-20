// expo-notifications は Expo が提供する通知管理ライブラリ
// ローカル通知の表示、通知アクション（ボタン）の登録などができる
import * as Notifications from 'expo-notifications';
import { loadRecords, saveRecords, todayKey } from './storage';

// 通知カテゴリとアクションの識別子（文字列で一意に定まれば何でもよい）
export const CATEGORY_ID = 'drink-counter';    // 通知の種類を識別するID
export const ACTION_ADD_MUG = 'add-mug';       // アクションボタンの識別子
const NOTIFICATION_ID = 'drink-counter-persistent'; // 通知自体のID（更新・削除に使う）

// アプリがフォアグラウンドにいるとき、通知をどう扱うかを設定する
// shouldShowAlert: false = アプリ起動中は通知バナーを出さない
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// 通知に表示するアクションボタンを登録する関数
// カテゴリに複数のボタンを追加することもできる
export async function setupNotificationCategory() {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_ADD_MUG,       // このアクションを識別するID
      buttonTitle: '🍺 +1杯',           // ロック画面に表示されるボタンのテキスト
      options: {
        opensAppToForeground: false,    // タップしてもアプリを前面に出さない（iOSのみ）
      },
    },
  ]);
}

// ユーザーに通知の送信許可を求める関数
// iOS では初回に許可ダイアログが表示される
export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted'; // 'granted'（許可）なら true を返す
}

// 現在のカウントを通知バーに表示する関数
// 毎回古い通知を削除してから新しいものを出すことで「更新」を実現している
export async function updateDrinkNotification(mugCount: number, plateCount: number) {
  // 同じIDの通知が既にあれば削除（二重表示を防ぐ）
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);

  // 新しい通知をすぐに表示する（trigger: null = 即時表示）
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: '今日の記録',
      body: `🍺 ${mugCount}杯  🍽️ ${plateCount}皿`,
      categoryIdentifier: CATEGORY_ID, // このカテゴリのアクションボタンを紐付ける
    },
    trigger: null, // null を指定すると即座に通知が表示される
  });
}

// ロック画面の「+1杯」ボタンが押されたときに呼ばれる関数
// アプリが起動していなくてもストレージを直接更新することでカウントを増やす
export async function handleAddMugAction() {
  const key = todayKey();
  const records = await loadRecords();                          // 現在の記録を読み込む
  const today = records[key] ?? { mugCount: 0, plateCount: 0 }; // 今日の記録（なければ初期値）
  const next = { ...records, [key]: { ...today, mugCount: today.mugCount + 1 } };
  await saveRecords(next);                                      // 更新した記録を保存
  await updateDrinkNotification(next[key].mugCount, next[key].plateCount); // 通知も更新
}
