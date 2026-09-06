import React, { useEffect, useRef, useState } from "react";

const formatTime = (value) => {
  if (!value) return "";
  const date = value.toDate ? value.toDate() : new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ChatPanel = ({ messages, currentUserId, onSend, disabled }) => {
  const [draft, setDraft] = useState("");
  const messageListRef = useRef(null);

  useEffect(() => {
    const messageList = messageListRef.current;
    if (messageList) messageList.scrollTop = messageList.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    const message = draft.trim();
    if (!message || disabled) return;
    onSend(message.slice(0, 2000));
    setDraft("");
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <section className="flex min-h-72 flex-col rounded-md bg-[#15161f] p-3">
      <h2 className="mb-2 font-semibold text-[#4aed88]">Room Chat</h2>
      <div
        ref={messageListRef}
        className="flex min-h-40 flex-1 flex-col gap-2 overflow-y-auto pr-1"
      >
        {messages.length === 0 && (
          <p className="text-sm text-gray-500">No messages yet.</p>
        )}
        {messages.map((item) => {
          const ownMessage = item.userId === currentUserId;
          return (
            <article
              key={item.id}
              className={`max-w-[90%] rounded-md p-2 text-sm ${
                ownMessage
                  ? "self-end bg-[#245c43] text-white"
                  : "self-start bg-[#242632] text-gray-200"
              }`}
            >
              <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                <span className="font-semibold">{item.username || "User"}</span>
                <time>{formatTime(item.createdAt)}</time>
              </div>
              <p className="mt-1 whitespace-pre-wrap wrap-break-words">
                {item.message}
              </p>
            </article>
          );
        })}
      </div>
      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 2000))}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          className="min-h-10 resize-y font-mono"
          disabled={disabled}
          maxLength={2000}
          spellCheck="false"
        />
        <button
          type="button"
          onClick={sendMessage}
          disabled={disabled || !draft.trim()}
          className="rounded bg-[#4aed88] px-3 py-2 font-semibold text-[#101117] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </div>
    </section>
  );
};

export default ChatPanel;
