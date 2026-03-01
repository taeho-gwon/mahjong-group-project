import { apiFetch } from './client'

export interface GroupResponse {
  id: number
  name: string
  description: string | null
  owner_id: number
  join_policy: 'public' | 'private'
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
  if (!res.ok) throw new Error('Failed to fetch groups')
  return res.json()
}

export async function getMyGroups(): Promise<GroupResponse[]> {
  const res = await apiFetch('/groups/me')
  if (!res.ok) throw new Error('Failed to fetch my groups')
  return res.json()
}

export interface MemberInfo {
  id: number
  username: string
  role: 'owner' | 'admin' | 'member'
}

export interface GroupDetailResponse extends GroupResponse {
  members: MemberInfo[]
}

export async function getGroup(id: number): Promise<GroupDetailResponse> {
  const res = await apiFetch(`/groups/${id}`)
  if (!res.ok) throw new Error('Failed to fetch group')
  return res.json()
}

export async function updateGroup(
  id: number,
  data: {
    name?: string
    description?: string | null
    join_policy?: 'public' | 'private'
  },
): Promise<GroupResponse> {
  const res = await apiFetch(`/groups/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update group')
  return res.json()
}

export async function removeMember(groupId: number, userId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/members/${userId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to remove member')
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
  if (!res.ok) throw new Error('Failed to update member role')
  return res.json()
}

export async function generateInviteLink(groupId: number): Promise<{ invite_url: string; expires_at: string }> {
  const res = await apiFetch(`/groups/${groupId}/invite-link`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to generate invite link')
  return res.json()
}

export async function joinGroup(groupId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/join`, { method: 'POST' })
  if (!res.ok) throw new Error('Failed to join group')
}

export async function leaveGroup(groupId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}/leave`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to leave group')
}

export async function deleteGroup(groupId: number): Promise<void> {
  const res = await apiFetch(`/groups/${groupId}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete group')
}

export async function joinByInvite(token: string): Promise<GroupResponse> {
  const res = await apiFetch('/groups/join-by-invite', {
    method: 'POST',
    body: JSON.stringify({ invite_token: token }),
  })
  if (!res.ok) throw res
  return res.json()
}

export async function createGroup(
  name: string,
  description?: string,
  join_policy: 'public' | 'private' = 'public',
  uma?: { uma_1st: number; uma_2nd: number; uma_3rd: number; uma_4th: number },
): Promise<GroupResponse> {
  const res = await apiFetch('/groups', {
    method: 'POST',
    body: JSON.stringify({ name, description: description || null, join_policy, ...uma }),
  })
  if (!res.ok) throw new Error('Failed to create group')
  return res.json()
}
