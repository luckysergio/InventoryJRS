import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const userKeys = {
    all: ['users'],
    lists: () => [...userKeys.all, 'list'],
    list: (filters) => [...userKeys.lists(), filters],
    details: () => [...userKeys.all, 'detail'],
    detail: (id) => [...userKeys.details(), id],
    statistics: () => [...userKeys.all, 'statistics'],
};

export const useUsers = (params = {}) => {
    const { search = '', role = '', page = 1, perPage = 10 } = params;

    return useQuery({
        queryKey: userKeys.list({ search, role, page, perPage }),
        queryFn: async () => {
            const response = await api.get('/users', {
                params: {
                    search: search || undefined,
                    role: role || undefined,
                    page,
                    per_page: perPage,
                },
            });

            return {
                users: response.data.data || [],
                meta: response.data.meta || {},
            };
        },
        placeholderData: keepPreviousData,
        staleTime: 5 * 60 * 1000,
    });
};

export const useUser = (id) => {
    return useQuery({
        queryKey: userKeys.detail(id),
        queryFn: async () => {
            const response = await api.get(`/users/${id}`);
            return response.data.data;
        },
        enabled: !!id,
        staleTime: 15 * 60 * 1000,
    });
};

export const useUserStatistics = () => {
    return useQuery({
        queryKey: userKeys.statistics(),
        queryFn: async () => {
            const response = await api.get('/users/statistics');
            return response.data.data;
        },
        staleTime: 5 * 60 * 1000,
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => api.post('/users', userData),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.statistics() });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
        onSuccess: (response, variables) => {
            queryClient.setQueryData(userKeys.detail(variables.id), response.data.data);
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.statistics() });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: userKeys.lists() });

            const previousQueries = queryClient.getQueriesData({ queryKey: userKeys.lists() });

            queryClient.setQueriesData(
                { queryKey: userKeys.lists() },
                (old) => {
                    if (!old?.users) return old;
                    return {
                        ...old,
                        users: old.users.filter((user) => user.id !== id),
                    };
                }
            );

            return { previousQueries };
        },
        onError: (err, id, context) => {
            context?.previousQueries?.forEach(([key, data]) => {
                queryClient.setQueryData(key, data);
            });
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userKeys.statistics() });
        },
    });
};