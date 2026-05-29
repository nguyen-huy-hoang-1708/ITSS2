import { request } from './api/client';
import type { EventItem, EventPayload, EventPriority, MonthParams } from '@/types/event';
import type { ApiResponse } from '@/types/api';

export async function getAllEvents() {
  const response = await request<EventItem[]>({ url: '/event', method: 'GET' });
  return response.data;
}

export async function getTodayEvents() {
  const response = await request<EventItem[]>({ url: '/event/today', method: 'GET' });
  return response.data;
}

export async function getUpcomingDeadlines() {
  const response = await request<EventItem[]>({ url: '/event/deadlines', method: 'GET' });
  return response.data;
}

export async function getUpcomingNotifications(minutes = 30) {
  const response = await request<EventItem[]>({
    url: '/event/notifications',
    method: 'GET',
    params: { minutes },
  });
  return response.data;
}

export async function getMonthEvents({ year, month }: MonthParams) {
  const response = await request<EventItem[]>({
    url: '/event/month',
    method: 'GET',
    params: { year, month },
  });
  return response.data;
}

export async function getWeekEvents(week_start: string, week_end: string) {
  const response = await request<EventItem[]>({
    url: '/event/week',
    method: 'GET',
    params: { week_start, week_end },
  });
  return response.data;
}

export async function getEventById(id: string) {
  const response = await request<EventItem>({ url: `/event/${id}`, method: 'GET' });
  return response.data;
}

export async function createEvent(payload: EventPayload) {
  const response = await request<EventItem>({ url: '/event', method: 'POST', data: payload });
  return response.data;
}

export async function updateEvent(id: string, payload: EventPayload) {
  const response = await request<EventItem>({ url: `/event/${id}`, method: 'PUT', data: payload });
  return response.data;
}

export async function deleteEvent(id: string) {
  await request<null>({ url: `/event/${id}`, method: 'DELETE' });
}

export async function completeDeadline(id: string) {
  const response = await request<EventItem>({ url: `/event/${id}/complete`, method: 'PATCH' });
  return response.data;
}

export async function toggleEventCompletion(id: string) {
  const response = await request<EventItem>({ url: `/event/${id}/complete`, method: 'PATCH' });
  return response.data;
}

export async function updateDeadlinePriority(id: string, priority: EventPriority) {
  const response = await request<EventItem>({
    url: `/event/${id}/priority`,
    method: 'PATCH',
    data: { priority },
  });
  return response.data;
}