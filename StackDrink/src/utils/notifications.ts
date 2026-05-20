import * as Notifications from 'expo-notifications';
import { loadRecords, saveRecords, todayKey } from './storage';

export const CATEGORY_ID = 'drink-counter';
export const ACTION_ADD_MUG = 'add-mug';
const NOTIFICATION_ID = 'drink-counter-persistent';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function setupNotificationCategory() {
  await Notifications.setNotificationCategoryAsync(CATEGORY_ID, [
    {
      identifier: ACTION_ADD_MUG,
      buttonTitle: '🍺 +1杯',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function updateDrinkNotification(mugCount: number, plateCount: number) {
  await Notifications.dismissNotificationAsync(NOTIFICATION_ID);
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: '今日の記録',
      body: `🍺 ${mugCount}杯  🍽️ ${plateCount}皿`,
      categoryIdentifier: CATEGORY_ID,
    },
    trigger: null,
  });
}

export async function handleAddMugAction() {
  const key = todayKey();
  const records = await loadRecords();
  const today = records[key] ?? { mugCount: 0, plateCount: 0 };
  const next = { ...records, [key]: { ...today, mugCount: today.mugCount + 1 } };
  await saveRecords(next);
  await updateDrinkNotification(next[key].mugCount, next[key].plateCount);
}
