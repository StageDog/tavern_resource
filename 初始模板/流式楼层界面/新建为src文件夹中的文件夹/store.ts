export const useDataStore = defineStore('data', () => {
  const data = ref<string>('');
  return {
    data,
  };
});
