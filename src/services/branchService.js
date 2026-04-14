import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export const branchService = {
  useRegions: () => {
    return useQuery({
      queryKey: ["regions"],
      queryFn: () => api.regions.getAll(),
      staleTime: 5 * 60 * 1000,
    });
  },

  useBranches: (regionId) => {
    const params = regionId ? { regionId } : {};
    return useQuery({
      queryKey: ["branches", regionId || "all"],
      queryFn: () => api.branches.getAll(params),
    });
  },

  useCreateBranch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (data) => api.branches.create(data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["branches"] });
      },
    });
  },

  useUpdateBranch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: ({ id, ...data }) => api.branches.update(id, data),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["branches"] });
      },
    });
  },

  useDeleteBranch: () => {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: (id) => api.branches.delete(id),
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["branches"] });
      },
    });
  },
};
