import AsyncStorage from '@react-native-async-storage/async-storage';

export const setStorage = async (key: string, value: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.warn('Unable to persist data', error);
  }
};

export const getStorage = async (key: string): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.warn('Unable to read stored value', error);
    return null;
  }
};

export const removeStorage = async (key: string): Promise<void> => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (error) {
    console.warn('Unable to remove storage entry', error);
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    await AsyncStorage.clear();
  } catch (error) {
    console.warn('Unable to clear storage', error);
  }
};
