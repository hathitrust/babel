let error = $state(null);

export const imgsrvFetchError = {
  get current() {
    return error;
  },
  set(status, message) {
    error ??= { status, message };
  },
  clear() {
    error = null;
  },
};
