const API_BASE_URL = 'https://api.example.com'; // Замените на реальный URL API
const CALLBACK_URL = 'https://webhook.site/bc4f825e-cec8-4623-973e-9e091091e057';

export const startMachine = async (machineId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/machines/${machineId}/start`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_url: CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to start machine ${machineId}`);
  }

  return response.json();
};

export const stopMachine = async (machineId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/machines/${machineId}/stop`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      callback_url: CALLBACK_URL,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to stop machine ${machineId}`);
  }

  return response.json();
};
