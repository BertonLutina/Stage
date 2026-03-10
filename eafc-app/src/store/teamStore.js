import { create } from 'zustand';
import api from '../utils/api';

const useTeamStore = create((set) => ({
  teams: [],
  currentTeam: null,
  loading: false,

  fetchTeam: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/teams/${id}`);
      set({ currentTeam: data.data, loading: false });
    } catch { set({ loading: false }); }
  },

  createTeam: async (payload) => {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => { if (v !== undefined) form.append(k, v); });
    const { data } = await api.post('/teams', form, { headers: { 'Content-Type': 'multipart/form-data' } });
    return data.data;
  },

  saveFormation: async (teamId, name, positions) => {
    const { data } = await api.post(`/teams/${teamId}/formation`, { name, positions });
    return data.data;
  },
}));

export default useTeamStore;
