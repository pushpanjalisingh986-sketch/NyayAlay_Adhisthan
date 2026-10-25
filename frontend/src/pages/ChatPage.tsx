import { useEffect, useState } from 'react';
import { anonymousLogin, sendChatMessage } from '../api';

type ChatItem = {
  role: 'user' | 'assistant';
  text: string;
  disclaimer?: string;
};

export default function ChatPage() {
  const [token, setToken] = useState('');
  const [sessionId, setSessionId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    anonymousLogin()
      .then((data) => setToken(data.accessToken))
      .catch(() => setError('Could not start anonymous session. Is backend running?'));
  }, []);

  async function onSend() {
    if (!input.trim() || !token || loading) return;
    const userText = input.trim();
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: userText }]);
    setLoading(true);
    try {
      const data = await sendChatMessage(token, userText, sessionId);
      if (data.sessionId) setSessionId(data.sessionId);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || data.message || JSON.stringify(data),
          disclaimer: data.disclaimer,
        },
      ]);
    } catch {
      setError('Chat failed. Check backend + AI service.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <h2>Legal Chat</h2>
      <p className="muted">General information only — not legal advice.</p>
      <div className="chat-box">
        {messages.map((m, i) => (
          <div key={i} className={`bubble ${m.role}`}>
            <div>{m.text}</div>
            {m.disclaimer && <div className="disclaimer">{m.disclaimer}</div>}
          </div>
        ))}
        {loading && <div className="muted">Thinking…</div>}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSend()}
          placeholder="e.g. Someone stole my phone"
          disabled={!token || loading}
        />
        <button onClick={onSend} disabled={!token || loading}>
          Send
        </button>
      </div>
    </div>
  );
}