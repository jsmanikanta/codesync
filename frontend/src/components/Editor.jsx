import React, { useEffect, useRef } from "react";
import Codemirror from "codemirror";
import "codemirror/lib/codemirror.css";
import "codemirror/mode/javascript/javascript";
import "codemirror/mode/python/python";
import "codemirror/mode/clike/clike";
import "codemirror/theme/dracula.css";
import "codemirror/addon/edit/closetag";
import "codemirror/addon/edit/closebrackets";
import ACTIONS from "../socketio/actions";

import { db } from "../firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { updateRoomCode } from "../firestore/roomService";
import { LANGUAGE_CONFIG } from "../config/languages";

const Editor = ({
  socketRef,
  socket,
  roomId,
  language,
  starterCode,
  onCodeChange,
  restoreRequest,
}) => {
  const editorRef = useRef(null);
  const editorInstance = useRef(null);
  const saveTimeout = useRef(null);
  const initializedLanguageRef = useRef(null);

  const loadInitialCode = async () => {
    try {
      const roomRef = doc(db, "rooms", roomId);
      const snap = await getDoc(roomRef);

      const savedCode = snap.exists() ? snap.data().lastUpdatedCode || "" : "";
      const initialCode = savedCode || starterCode;
      const editor = editorInstance.current;
      if (editor) {
        editor.setValue(initialCode);
        onCodeChange(initialCode);
      }
    } catch (err) {
      console.log("Error loading code:", err);
    }
  };

  const saveToFirestoreDebounced = (code) => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      updateRoomCode(roomId, code);
    }, 1500);
  };

  useEffect(() => {
    if (editorInstance.current) return;

    const init = async () => {
      editorInstance.current = Codemirror.fromTextArea(editorRef.current, {
        mode: LANGUAGE_CONFIG[language].editorMode,
        theme: "dracula",
        autoCloseTags: true,
        autoCloseBrackets: true,
        lineNumbers: true,
      });

      editorInstance.current.setSize("100%", "100%");

      await loadInitialCode();
      initializedLanguageRef.current = language;

      editorInstance.current.on("change", (instance, changes) => {
        const { origin } = changes;
        const code = instance.getValue();
        onCodeChange(code);
        //origin tells what changes made like type, erase,cut,paste
        // prevent infinite loop
        if (origin !== "setValue") {
          socketRef.current?.emit(ACTIONS.CODE_CHANGE, {
            roomId,
            code,
          });

          saveToFirestoreDebounced(code);
        }
      });
    };

    init();
  }, []);

  useEffect(() => {
    if (!socket) return;

    const handleCodeChange = ({ code }) => {
      if (
        editorInstance.current &&
        code !== editorInstance.current.getValue()
      ) {
        // Only update if the code is different (avoid cursor jump)
        editorInstance.current.setValue(code);
      }
    };
    socket.on(ACTIONS.CODE_CHANGE, handleCodeChange);

    return () => {
      socket.off(ACTIONS.CODE_CHANGE, handleCodeChange);
    };
  }, [socket]);

  useEffect(() => {
    const editor = editorInstance.current;
    const languageConfig = LANGUAGE_CONFIG[language];
    if (!editor || !languageConfig) return;

    editor.setOption("mode", languageConfig.editorMode);
    if (initializedLanguageRef.current === null) return;
    if (initializedLanguageRef.current === language) return;

    editor.setValue(starterCode);
    onCodeChange(starterCode);
    initializedLanguageRef.current = language;
  }, [language, starterCode, onCodeChange]);

  useEffect(() => {
    const editor = editorInstance.current;
    if (!editor || !restoreRequest) return;
    editor.setValue(restoreRequest.code);
    onCodeChange(restoreRequest.code);
  }, [restoreRequest, onCodeChange]);

  return (
    <div className="h-full w-full bg-[#15161f] p-2 rounded-md">
      <textarea ref={editorRef}></textarea>
    </div>
  );
};

export default Editor;
