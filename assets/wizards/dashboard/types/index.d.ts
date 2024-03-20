export {};

declare global {
  interface Window {
    newspack_aux_data: {
        is_debug_mode: boolean;
    };
  }
}