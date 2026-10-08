const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Checks backend health
 */
export async function checkBackendHealth() {
  try {
    const res = await fetch(`${API_BASE_URL}/api/health`);
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
}

/**
 * Standard POST request to analyze URL
 */
export async function analyzeProjectUrl(url) {
  const response = await fetch(`${API_BASE_URL}/api/analyze`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || 'Failed to complete project analysis.';
    throw new Error(message);
  }

  return await response.json();
}

/**
 * Server-Sent Events (SSE) streaming analysis for real-time progress
 */
export async function analyzeProjectStream(url, { onProgress, onComplete, onError }) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/analyze/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(errText || 'Failed to initiate review stream.');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'progress' && onProgress) {
              onProgress(parsed.stage, parsed.message);
            } else if (parsed.type === 'complete' && onComplete) {
              onComplete(parsed.report);
            } else if (parsed.type === 'error' && onError) {
              onError(new Error(parsed.message));
              return;
            }
          } catch (parseErr) {
            console.error('Failed to parse SSE payload', parseErr, jsonStr);
          }
        }
      }
    }
  } catch (err) {
    if (onError) onError(err);
  }
}
