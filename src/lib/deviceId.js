export const getDeviceId = () => {
  const key = 'device_id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
};