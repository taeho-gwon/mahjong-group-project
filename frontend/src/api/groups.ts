import { apiFetch } from './client'
import { throwApiError } from './errors'

export interface GroupResponse {
  id: number
  name: string
  description: string | null
  owner_id: number
  join_policy: 'public' | 'private'
  weekly_start_day: number
  monthly_start_day: number
  is_active: boolean
  created_at: string
}

export interface PaginatedGroupResponse {
  items: GroupResponse[]
  total: number
  page: number
  size: number
}

export async function getPublicGroups(page: number, size: number): Promise<PaginatedGroupResponse> {
  const res = await apiFetch(`/groups?page=${page}&size=${size}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function getMyGroups(): Promise<GroupResponse[]> {
  const res = await apiFetch('/groups/me')
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export interface MemberInfo {
  id: number
  username: string
  role: 'owner' | 'admin' | 'member'
  nickname: string | null
  user_nickname: string | null
}

export function getDisplayName(member: MemberInfo): string {
  return member.nickname ?? member.user_nickname ?? member.username
}

export interface GroupDetailResponse extends GroupResponse {
  members: MemberInfo[]
}

export async function getGroup(id: number): Promise<GroupDetailResponse> {
  const res = await apiFetch(`/groups/${id}`)
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function updateGroup(
  id: number,
  data: {
    name?: string
    description?: string | null
    join_policy?: 'public' | 'private'
    weekly_start_day?: number
    monthly_start_day?: number
  },
): Promise<GroupResponse> {
  const res = await apiFetch(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function removeMember(groupId: number, userId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
  if (!res.ok) await throwApiError(res)
}

export async function updateMemberRole(
  groupId: number,
  userId: number,
  role: 'admin' | 'member',
): Promise<MemberInfo> {
  const res = await apiFetch(`/groups/${groupId}/members/${userId}/role`, {
    method: 'PUT',
    body: JSON.stringify({ role }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function generateInviteLink(groupId: number): Promise<{ invite_url: string; expires_at: string }> {
  const res = await apiFetch(`/groups/${groupId}/invite-link`, { method: 'POST' })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function joinGroup(groupId: number, nickname?: string | null): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/join`, {
    method: 'POST',
    body: JSON.stringify({ nickname: nickname || null }),
  })
  if (!res.ok) await throwApiError(res)
}

export async function leaveGroup(groupId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' })
  if (!res.ok) await throwApiError(res)
}

export async function deleteGroup(groupId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}`, { method: 'DELETE' })
  if (!res.ok) await throwApiError(res)
}

export async function joinByInvite(token: string, nickname?: string | null): Promise<GroupResponse> {
  const res = await apiFetch('/groups/join-by-invite', {
    method: 'POST',
    body: JSON.stringify({ invite_token: token, nickname: nickname || null }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function updateMemberNickname(
  groupId: number,
  userId: number,
  nickname: string | null,
): Promise<MemberInfo> {
  const res = await apiFetch(`/groups/${groupId}/members/${userId}/nickname`, {
    method: 'PUT',
    body: JSON.stringify({ nickname }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}

export async function createGroup(data: {
  name: string
  description?: string | null
  join_policy?: 'public' | 'private'
  weekly_start_day?: number
  monthly_start_day?: number
}): Promise<GroupResponse> {
  const res = await apiFetch('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: data.name,
      description: data.description || null,
      join_policy: data.join_policy ?? 'public',
      weekly_start_day: data.weekly_start_day ?? 0,
      monthly_start_day: data.monthly_start_day ?? 1,
    }),
  })
  if (!res.ok) await throwApiError(res)
  return res.json()
}
