// Function to generate a unique device identifier
export const getDeviceId = (): string => {
  const key = 'device_id';
  let deviceId = localStorage.getItem(key);
  
  if (!deviceId) {
    // Generate a random device ID if none exists
    deviceId = crypto.randomUUID();
    localStorage.setItem(key, deviceId);
  }
  
  return deviceId;
};