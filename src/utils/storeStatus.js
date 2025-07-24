// storeStatus.js
export const storeHours = {
  0: { open: '11:00', close: '22:00' }, // Sunday
  1: { open: '11:00', close: '23:00' }, // Monday
  2: { open: '11:00', close: '23:00' },
  3: { open: '11:00', close: '23:00' },
  4: { open: '11:00', close: '23:00' },
  5: { open: '11:00', close: '00:00' }, // Friday
  6: { open: '11:00', close: '00:00' }, // Saturday
};

export function isStoreOpen() {
  const now = new Date();
  const day = now.getDay();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [openH, openM] = storeHours[day].open.split(':').map(Number);
  const [closeH, closeM] = storeHours[day].close.split(':').map(Number);
  const openTime = openH * 60 + openM;
  const closeTime = closeH * 60 + closeM;
  return currentTime >= openTime && currentTime < closeTime;
}