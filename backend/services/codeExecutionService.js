import { getLanguageConfig } from "../config/languages.js";

const MAX_CODE_SIZE = 100_000;
const MAX_INPUT_SIZE = 50_000;
const MAX_OUTPUT_SIZE = 100_000;
const PROVIDER_TIMEOUT_MS = 20_000;
const POLL_INTERVAL_MS = 500;

const baseResponse = {
  success: false,
  status: "execution_service_error",
  output: "",
  error: null,
  executionTime: null,
  memory: null,
};

const trimOutput = (value = "") => value.slice(0, MAX_OUTPUT_SIZE);

const createHeaders = () => {
  const headers = { "Content-Type": "application/json" };
  if (process.env.CODE_EXECUTION_API_KEY) {
    headers["X-Auth-Token"] = process.env.CODE_EXECUTION_API_KEY;
  }
  return headers;
};

const getStatus = (statusId) => {
  if (statusId === 3) return "accepted";
  if (statusId === 4) return "wrong_answer";
  if (statusId === 5) return "timeout";
  if (statusId === 6) return "compilation_error";
  if (statusId >= 7 && statusId <= 12) return "runtime_error";
  if (statusId === 1 || statusId === 2) return "processing";
  return "execution_service_error";
};

const wait = (duration) =>
  new Promise((resolve) => setTimeout(resolve, duration));

export async function runCode({ language, code, input = "" }) {
  const languageConfig = getLanguageConfig(language);
  if (!languageConfig) {
    return {
      ...baseResponse,
      status: "invalid_language",
      error: "Unsupported language.",
    };
  }

  if (typeof code !== "string" || !code.trim()) {
    return {
      ...baseResponse,
      status: "invalid_request",
      error: "Code cannot be empty.",
    };
  }
  if (code.length > MAX_CODE_SIZE) {
    return {
      ...baseResponse,
      status: "invalid_request",
      error: "Code is too large.",
    };
  }
  if (typeof input !== "string" || input.length > MAX_INPUT_SIZE) {
    return {
      ...baseResponse,
      status: "invalid_request",
      error: "Input is too large.",
    };
  }

  const apiUrl = process.env.CODE_EXECUTION_API_URL;
  if (!apiUrl) {
    return {
      ...baseResponse,
      error:
        "Code execution is unavailable. Configure CODE_EXECUTION_API_URL on the backend.",
    };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);

  try {
    const endpoint = new URL(apiUrl);
    endpoint.searchParams.delete("wait");

    const providerResponse = await fetch(endpoint, {
      method: "POST",
      headers: createHeaders(),
      signal: controller.signal,
      body: JSON.stringify({
        language_id: languageConfig.judge0LanguageId,
        source_code: code,
        stdin: input,
        cpu_time_limit: 5,
        wall_time_limit: 10,
        memory_limit: 256000,
      }),
    });

    const submission = await providerResponse.json().catch(() => null);
    if (!providerResponse.ok || !submission?.token) {
      return {
        ...baseResponse,
        error: trimOutput(
          submission?.message ||
            `Judge0 submission failed with HTTP ${providerResponse.status}.`,
        ),
      };
    }

    let result;
    do {
      await wait(POLL_INTERVAL_MS);
      const pollEndpoint = new URL(`${apiUrl}/${submission.token}`);
      const pollResponse = await fetch(pollEndpoint, {
        headers: createHeaders(),
        signal: controller.signal,
      });
      result = await pollResponse.json().catch(() => null);
      if (!pollResponse.ok || !result) {
        return {
          ...baseResponse,
          error: "Judge0 status request failed.",
        };
      }
    } while ([1, 2].includes(result.status?.id));

    const status = getStatus(result.status?.id);
    const stdout = trimOutput(result.stdout || "");
    const stderr = trimOutput(result.stderr || "");
    const compileOutput = trimOutput(result.compile_output || "");
    const error = compileOutput || stderr || trimOutput(result.message || "");

    return {
      success: status === "accepted",
      status,
      output: stdout,
      stdout,
      stderr,
      compileOutput,
      error: error || null,
      executionTime: result.time
        ? Math.round(Number(result.time) * 1000)
        : null,
      memory: result.memory ?? null,
    };
  } catch (error) {
    if (error.name === "AbortError") {
      return {
        ...baseResponse,
        status: "timeout",
        error: "Execution timed out.",
      };
    }
    console.error("Code execution provider error:", error.message);
    return {
      ...baseResponse,
      error: "The code execution service is unavailable.",
    };
  } finally {
    clearTimeout(timeout);
  }
}
