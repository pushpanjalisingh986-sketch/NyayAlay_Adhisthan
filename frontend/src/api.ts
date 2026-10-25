const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000/api/v1';

export async function anonymousLogin() {
  const res = await fetch(`${API_BASE}/auth/anonymous`, { method: 'POST' });
  if (!res.ok) throw new Error('Anonymous login failed');
  return res.json() as Promise<{ accessToken: string; refreshToken?: string }>;
}

export async function sendChatMessage(
  accessToken: string,
  message: string,
  sessionId?: string,
) {
  const res = await fetch(`${API_BASE}/chat/message`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({ message, sessionId }),
  });
  if (!res.ok) throw new Error('Chat request failed');
  return res.json();
}

export async function listProcedures() {
  const res = await fetch(`${API_BASE}/procedures`);
  if (!res.ok) throw new Error('Failed to list procedures');
  return res.json();
}

export async function startProcedure(id: string) {
  const res = await fetch(`${API_BASE}/procedures/${id}/start`);
  if (!res.ok) throw new Error('Failed to start procedure');
  return res.json();
}

export async function chooseProcedureOption(
  procedureId: string,
  stepId: string,
  optionId: string,
) {
  const res = await fetch(
    `${API_BASE}/procedures/${procedureId}/steps/${stepId}/choose`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    },
  );
  if (!res.ok) throw new Error('Failed to choose option');
  return res.json();
}