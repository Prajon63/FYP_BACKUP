export const getStoredUserId = (): string => {
  return (
    localStorage.getItem('userId') ||
    (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || '{}')._id || '';
      } catch {
        return '';
      }
    })()
  );
};

