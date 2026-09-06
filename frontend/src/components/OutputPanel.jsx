import React from "react";

const statusLabels = {
  accepted: "Executed successfully",
  compilation_error: "Compilation Error",
  runtime_error: "Runtime Error",
  timeout: "Time Limit Exceeded",
  invalid_language: "Invalid language",
  invalid_request: "Invalid request",
  wrong_answer: "Execution completed",
  execution_service_error: "Execution Service Error",
};

const OutputPanel = ({ result, error }) => {
  if (error) {
    return (
      <section className="rounded-md border border-red-400/40 bg-[#15161f] p-3">
        <h2 className="font-semibold text-red-300">Execution Service Error</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm text-gray-300">
          {error}
        </p>
      </section>
    );
  }

  if (!result) return null;

  const isSuccess = result.status === "accepted";
  const output = result.stdout ?? result.output ?? "";
  const stderr = result.stderr ?? "";
  const compileOutput = result.compileOutput ?? "";
  return (
    <section className="rounded-md border border-white/10 bg-[#15161f] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold">Output</h2>
        <span className={isSuccess ? "text-[#4aed88]" : "text-red-300"}>
          {statusLabels[result.status] || result.status}
        </span>
      </div>
      <div className="mt-3 space-y-2">
        <div>
          <h3 className="mb-1 text-xs uppercase tracking-wide text-gray-500">
            Output
          </h3>
          <pre className="min-h-20 overflow-auto whitespace-pre-wrap rounded bg-[#101117] p-3 text-sm text-gray-200">
            {output || "No output"}
          </pre>
        </div>
        {compileOutput && (
          <div>
            <h3 className="mb-1 text-xs uppercase tracking-wide text-red-300">
              Compilation Error
            </h3>
            <pre className="overflow-auto whitespace-pre-wrap rounded bg-[#101117] p-3 text-sm text-red-200">
              {compileOutput}
            </pre>
          </div>
        )}
        {stderr && (
          <div>
            <h3 className="mb-1 text-xs uppercase tracking-wide text-red-300">
              Runtime Error
            </h3>
            <pre className="overflow-auto whitespace-pre-wrap rounded bg-[#101117] p-3 text-sm text-red-200">
              {stderr}
            </pre>
          </div>
        )}
      </div>
      <div className="mt-3 flex gap-5 text-xs text-gray-400">
        {result.executionTime !== null && (
          <span>Time: {result.executionTime} ms</span>
        )}
        {result.memory !== null && <span>Memory: {result.memory} KB</span>}
      </div>
    </section>
  );
};

export default OutputPanel;
