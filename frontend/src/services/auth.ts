import { request } from './api/client';
import type { AuthSession, LoginPayload, RegisterPayload, User } from '@/types/auth';

export async function login(payload: LoginPayload) {
  const response = await request<AuthSession>({
    url: '/auth/login',
    method: 'POST',
    data: payload,
    skipAuth: true,
  });

  return response.data;
}

export async function register(payload: RegisterPayload) {
  const response = await request<User>({
    url: '/auth/register',
    method: 'POST',
    data: payload,
    skipAuth: true,
  });

  return response.data;
}

export async function logout() {
  await request<null>({
    url: '/auth/logout',
    method: 'POST',
    skipAuth: true,
  });
}

export async function refreshSession() {
  const response = await request<AuthSession>({
    url: '/auth/refresh-token',
    method: 'POST',
    skipAuth: true,
  });

  return response.data;
}