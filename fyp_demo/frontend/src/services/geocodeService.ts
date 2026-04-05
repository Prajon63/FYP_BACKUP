import api from './api';

export type GeocodeResult = {
  coordinates: [number, number];
  city: string;
  state: string;
  country: string;
  displayLocation: string;
};

export const geocodeService = {
  async search(query: string): Promise<{ success: boolean; result?: GeocodeResult; error?: string }> {
    const { data } = await api.get('/geocode/search', { params: { q: query } });
    return data;
  },

  async reverse(lat: number, lon: number): Promise<{ success: boolean; result?: GeocodeResult; error?: string }> {
    const { data } = await api.get('/geocode/reverse', { params: { lat, lon } });
    return data;
  },
};
