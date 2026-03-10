import { create } from 'zustand';
import api from '../utils/api';

const useTournamentStore = create((set) => ({
  tournaments: [],
  current: null,
  loading: false,

  fetchTournament: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/tournaments/${id}`);
      set({ current: data.data, loading: false });
    } catch { set({ loading: false }); }
  },

  create: async (payload) => {
    const { data } = await api.post('/tournaments', payload);
    return data.data;
  },

  start: async (id) => {
    const { data } = await api.post(`/tournaments/${id}/start`);
    return data;
  },

  join: async (id, teamId) => {
    const { data } = await api.post(`/tournaments/${id}/join`, { team_id: teamId });
    return data;
  },
}));

export default useTournamentStore;
