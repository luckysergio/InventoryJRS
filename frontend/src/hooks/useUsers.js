import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api/axios';

export const userKeys = {
    all: ['users'],
    lists: () => [...userKeys.all, 'list'],
    list: (filters) => [...userKeys.lists(), filters],
    details: () => [...userKeys.all, 'detail'],
    detail: (id) => [...userKeys.details(), id],
};

export const useUsers = (params = {}) => {
    const { search = '', page = 1, perPage = 10 } = params;

    return useQuery({
        queryKey: userKeys.list({ search, page, perPage }),
        queryFn: async () => {
            const response = await api.get('/users', {
                params: { search, page, per_page: perPage },
            });
            return response.data.data; // LengthAwarePaginator
        },
        keepPreviousData: true, // Smooth pagination
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
        staleTime: 15 * 60 * 1000, // 15 menit
    });
};

export const useCreateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData) => api.post('/users', userData),
        onSuccess: () => {
            // Invalidate semua list users
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useUpdateUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }) => api.put(`/users/${id}`, data),
        onSuccess: (response, variables) => {
            // Update cache detail user
            queryClient.setQueryData(userKeys.detail(variables.id), response.data.data);
            // Invalidate list
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};

export const useDeleteUser = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id) => api.delete(`/users/${id}`),
        onSuccess: (_, id) => {
            // Hapus dari cache detail
            queryClient.removeQueries({ queryKey: userKeys.detail(id) });
            // Invalidate list
            queryClient.invalidateQueries({ queryKey: userKeys.lists() });
        },
    });
};