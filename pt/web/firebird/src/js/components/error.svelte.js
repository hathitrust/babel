let error = $state(null);

export const imgsrvFetchError = {
  get current() {
    return error;
  },
  set(status, rayID) {
    error ??= { status, rayID };
  },
  clear() {
    error = null;
  },
};
