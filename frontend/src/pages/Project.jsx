import React, { useCallback, useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import Editor from "../components/Editor";
import LanguageSelector from "../components/LanguageSelector";
import OutputPanel from "../components/OutputPanel";
import ChatPanel from "../components/ChatPanel";
import ExecutionHistory from "../components/ExecutionHistory";
import Sidebar from "../components/Sidebar";
import { LANGUAGE_CONFIG } from "../config/languages";
import { runCode } from "../services/codeExecutionService";
import { initSocket } from "../socketio/socket";
import ACTIONS from "../socketio/actions";
import { useParams } from "react-router-dom";
import { AuthData } from "../context/Authcontext";
import {
  addCollaborator,
  addExecutionHistory,
  addRoomMessage,
  getRecentExecutionHistory,
  getRecentRoomMessages,
  getRoom,
} from "../firestore/roomService";
import { addRoomToUser } from "../firestore/userService";

const Project = () => {
  const socketRef = useRef(null);
  const codeRef = useRef("");
  const { roomId } = useParams();
  const { user } = AuthData();
  const [socket, setSocket] = useState(null);
  const [clients, setClients] = useState([]);
  const [language, setLanguage] = useState("javascript");
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [runError, setRunError] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [roomStatus, setRoomStatus] = useState("loading");
  const [history, setHistory] = useState([]);
  const [messages, setMessages] = useState([]);
  const [restoreRequest, setRestoreRequest] = useState(null);

  const handleCodeChange = useCallback((code) => {
    codeRef.current = code;
  }, []);

  useEffect(() => {
    let active = true;
    const prepareRoom = async () => {
      try {
        const room = await getRoom(roomId);
        if (!room) {
          if (active) setRoomStatus("missing");
          return;
        }
        await addCollaborator(roomId, user.uid);
        await addRoomToUser(user.uid, roomId, room.createdBy === user.uid);
        const [historyResult, messagesResult] = await Promise.allSettled([
          getRecentExecutionHistory(roomId),
          getRecentRoomMessages(roomId),
        ]);
        if (active) {
          if (historyResult.status === "fulfilled")
            setHistory(historyResult.value);
          if (messagesResult.status === "fulfilled")
            setMessages(messagesResult.value);
          setRoomStatus("ready");
        }
      } catch (error) {
        console.error("Error preparing collaboration room:", error);
        if (active) setRoomStatus("error");
      }
    };
    if (user?.uid) prepareRoom();
    return () => {
      active = false;
    };
  }, [roomId, user]);

  useEffect(() => {
    let active = true;
    let roomSocket;

    const connect = async () => {
      roomSocket = await initSocket();
      if (!active) {
        roomSocket.disconnect();
        return;
      }
      socketRef.current = roomSocket;
      setSocket(roomSocket);

      const handleJoined = ({ clients: joinedClients, socketId }) => {
        setClients(joinedClients);
        if (socketId !== roomSocket.id && codeRef.current) {
          roomSocket.emit(ACTIONS.SYNC_CODE, {
            socketId,
            code: codeRef.current,
          });
        }
      };
      const handleDisconnected = ({ socketId }) => {
        setClients((current) =>
          current.filter((client) => client.socketId !== socketId),
        );
      };
      const handleLanguageChange = ({ language: nextLanguage }) => {
        if (LANGUAGE_CONFIG[nextLanguage]) setLanguage(nextLanguage);
      };
      const handleChatMessage = ({ roomId: messageRoomId, message }) => {
        if (messageRoomId !== roomId || !message?.id) return;
        setMessages((current) =>
          current.some((item) => item.id === message.id)
            ? current
            : [...current, message],
        );
      };

      roomSocket.on(ACTIONS.JOINED, handleJoined);
      roomSocket.on(ACTIONS.DISCONNECTED, handleDisconnected);
      roomSocket.on(ACTIONS.LANGUAGE_CHANGE, handleLanguageChange);
      roomSocket.on(ACTIONS.CHAT_MESSAGE, handleChatMessage);
      roomSocket.emit(ACTIONS.JOIN, {
        roomId,
        newuser: user?.displayName || user?.email || "Anonymous",
      });
      roomSocket.on("connect_error", () =>
        toast.error("Collaboration connection failed"),
      );
      roomSocket._codeSyncCleanup = () => {
        roomSocket.off(ACTIONS.JOINED, handleJoined);
        roomSocket.off(ACTIONS.DISCONNECTED, handleDisconnected);
        roomSocket.off(ACTIONS.LANGUAGE_CHANGE, handleLanguageChange);
        roomSocket.off(ACTIONS.CHAT_MESSAGE, handleChatMessage);
        roomSocket.disconnect();
      };
    };

    connect();

    return () => {
      active = false;
      roomSocket?._codeSyncCleanup?.();
      socketRef.current = null;
      setSocket(null);
    };
  }, [roomId, user]);

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    socketRef.current?.emit(ACTIONS.LANGUAGE_CHANGE, {
      roomId,
      language: nextLanguage,
    });
  };

  const handleRun = async () => {
    if (!codeRef.current.trim()) {
      setRunError("Code cannot be empty.");
      return;
    }
    setIsRunning(true);
    setResult(null);
    setRunError(null);
    try {
      const executionResult = await runCode({
        language,
        code: codeRef.current,
        input,
      });
      setResult(executionResult);
      const record = {
        userId: user.uid,
        username: user.displayName || user.email || "Anonymous",
        roomId,
        language,
        code: codeRef.current,
        input,
        output: executionResult.output || executionResult.stdout || "",
        error:
          executionResult.error ||
          executionResult.stderr ||
          executionResult.compileOutput ||
          "",
        status: executionResult.status,
        executionTime: executionResult.executionTime ?? null,
        memory: executionResult.memory ?? null,
      };
      try {
        await addExecutionHistory(record);
        setHistory((current) =>
          [
            { ...record, id: crypto.randomUUID(), createdAt: new Date() },
            ...current,
          ].slice(0, 20),
        );
      } catch (historyError) {
        toast.error("Execution completed, but history could not be saved");
        console.error("Execution history error:", historyError);
      }
    } catch (error) {
      setRunError(error.message);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSendMessage = async (messageText) => {
    if (!socketRef.current || !user?.uid) return;
    try {
      const message = await addRoomMessage(roomId, {
        userId: user.uid,
        username: user.displayName || user.email || "Anonymous",
        avatar: user.photoURL || "",
        message: messageText,
        createdAt: new Date(),
      });
      setMessages((current) => [...current, message]);
      socketRef.current.emit(ACTIONS.CHAT_MESSAGE, { roomId, message });
    } catch (error) {
      toast.error("Could not send message");
      console.error("Chat message error:", error);
    }
  };

  if (roomStatus === "loading") {
    return <div className="p-6 text-gray-300">Loading room...</div>;
  }
  if (roomStatus === "missing") {
    return (
      <div className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-xl font-semibold">Room not found</h2>
        <button
          type="button"
          onClick={() => window.location.assign("/collaboration")}
          className="mt-4 rounded bg-[#4aed88] px-4 py-2 text-[#101117]"
        >
          Back to Collaboration
        </button>
      </div>
    );
  }
  if (roomStatus === "error") {
    return (
      <div className="p-6 text-red-300">
        This collaboration room could not be loaded.
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-70px)] flex-col gap-2 p-2 lg:flex-row">
      <Sidebar clients={clients} roomId={roomId} />
      <main className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-[#15161f] p-2">
          <LanguageSelector
            value={language}
            onChange={handleLanguageChange}
            disabled={isRunning}
          />
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning}
            className="rounded-md bg-[#4aed88] px-4 py-2 font-semibold text-[#101117] transition hover:bg-[#35b064] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isRunning ? "Running..." : "Run Code"}
          </button>
        </div>
        <div className="h-[48vh] min-h-80 rounded-md">
          <Editor
            socketRef={socketRef}
            socket={socket}
            roomId={roomId}
            language={language}
            starterCode={LANGUAGE_CONFIG[language].starterCode}
            onCodeChange={handleCodeChange}
            restoreRequest={restoreRequest}
          />
        </div>
        <section className="rounded-md bg-[#15161f] p-3">
          <div className="mb-2 flex items-center justify-between">
            <label
              htmlFor="program-input"
              className="text-sm font-semibold text-gray-200"
            >
              Program Input
            </label>
            <span className="text-xs text-gray-500">stdin before Run Code</span>
          </div>
          <textarea
            id="program-input"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder={
              "Enter input before running, for example:\nCodeSync\n42"
            }
            className="min-h-20 resize-y font-mono"
            disabled={isRunning}
            spellCheck="false"
          />
        </section>
        <OutputPanel result={result} error={runError} />
        <div className="grid gap-2 xl:grid-cols-2">
          <ExecutionHistory
            records={history}
            onRestore={(code) =>
              setRestoreRequest({ id: crypto.randomUUID(), code })
            }
          />
          <ChatPanel
            messages={messages}
            currentUserId={user.uid}
            onSend={handleSendMessage}
            disabled={!socket}
          />
        </div>
      </main>
    </div>
  );
};

export default Project;
