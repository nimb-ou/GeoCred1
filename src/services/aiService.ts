export async function runGeoAgent(mode: 'profile' | 'compare' | 'business' | 'trajectory' | 'portfolio' | 'collections', query: string, places?: string[]) {
  try {
    const response = await fetch('/api/agent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ mode, query, places })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Agent error response:", errorText);
      throw new Error(`Agent failed: ${response.status} ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("AI Agent Error (Client):", error);
    throw error;
  }
}
