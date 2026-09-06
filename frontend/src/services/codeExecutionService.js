const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:9000";

export async function runCode(payload) {
  let response;
  try {
    response = await fetch(`${backendUrl}/api/code/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    throw new Error("Unable to connect to the execution service.");
  }

  const result = await response.json().catch(() => null);
  if (!result) throw new Error("The backend returned an invalid response.");
  return result;
}
