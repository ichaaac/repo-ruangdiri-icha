// stores/sidebarStore.js
import { create } from "zustand"

export const useSidebarStore = create((set) => ({
  isExpanded: false,
  toggleSidebar: () => set((state) => ({ isExpanded: !state.isExpanded })),
  expandSidebar: () => set({ isExpanded: true }),
  collapseSidebar: () => set({ isExpanded: false }),
}))
