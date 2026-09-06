import React, { useState } from "react";

const formatTime = (value) => {
  if (!value) return "Unknown time";
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown time" : date.toLocaleString();
};

const ExecutionHistory = ({ records, onRestore }) => {
  const [selected, setSelected] = useState(null);

  return (
    <section className="rounded-md bg-[#15161f] p-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-semibold text-[#4aed88]">Execution History</h2>
        <span className="text-xs text-gray-500">Latest {records.length}</span>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {records.length === 0 && (
          <p className="text-sm text-gray-500">
            No executions in this room yet.
          </p>
        )}
        {records.map((record) => (
          <button
            type="button"
            key={record.id}
            onClick={() => setSelected(record)}
            className="rounded border border-white/10 bg-[#20212c] p-2 text-left hover:border-[#4aed88]/60"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span>{record.language}</span>
              <span
                className={
                  record.status === "accepted"
                    ? "text-[#4aed88]"
                    : "text-red-300"
                }
              >
                {record.status}
              </span>
            </div>
            <div className="mt-1 text-xs text-gray-500">
              {record.executionTime !== null && `${record.executionTime} ms`}
              {record.username ? ` by ${record.username}` : ""}
            </div>
          </button>
        ))}
      </div>
      {selected && (
        <div className="mt-3 rounded border border-[#4aed88]/30 bg-[#101117] p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-semibold">Execution Details</h3>
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-gray-400 hover:text-white"
            >
              Close
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            {selected.language} · {formatTime(selected.createdAt)}
          </p>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-[#1c1e29] p-2 text-xs">
            {selected.code}
          </pre>
          <p className="mt-2 text-xs font-semibold text-gray-400">Input</p>
          <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded bg-[#1c1e29] p-2 text-xs">
            {selected.input || "No input"}
          </pre>
          <p className="mt-2 text-xs font-semibold text-gray-400">Output</p>
          <pre className="max-h-24 overflow-auto whitespace-pre-wrap rounded bg-[#1c1e29] p-2 text-xs">
            {selected.output || selected.error || "No output"}
          </pre>
          <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-400">
            <span>Status: {selected.status}</span>
            {selected.executionTime !== null && (
              <span>Time: {selected.executionTime} ms</span>
            )}
            {selected.memory !== null && (
              <span>Memory: {selected.memory} KB</span>
            )}
          </div>
          {onRestore && (
            <button
              type="button"
              onClick={() => onRestore(selected.code)}
              className="mt-3 rounded bg-[#4aed88] px-3 py-1 text-xs font-semibold text-[#101117]"
            >
              Restore Code
            </button>
          )}
        </div>
      )}
    </section>
  );
};

export default ExecutionHistory;
