import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp as timestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase/config";

export async function createRoom(roomId, data) {
  const roomRef = doc(db, "rooms", roomId);

  await setDoc(roomRef, {
    roomName: data.roomName,
    description: data.description,
    createdBy: data.createdBy,
    createdAt: timestamp(),
    lastUpdatedCode: "",
    updatedAt: timestamp(),
    collaborators: [data.createdBy],
  });
}

export async function updateRoomCode(roomId, code) {
  const roomRef = doc(db, "rooms", roomId);

  await updateDoc(roomRef, {
    lastUpdatedCode: code,
    updatedAt: timestamp(),
  });
}

export async function addCollaborator(roomId, userId) {
  const roomRef = doc(db, "rooms", roomId);

  await updateDoc(roomRef, {
    collaborators: arrayUnion(userId),
  });
}

export async function getRoom(roomId) {
  const roomSnap = await getDoc(doc(db, "rooms", roomId));
  return roomSnap.exists() ? { id: roomSnap.id, ...roomSnap.data() } : null;
}

export async function addExecutionHistory(record) {
  const historyRef = collection(db, "executionHistory");
  await addDoc(historyRef, {
    ...record,
    createdAt: timestamp(),
  });
}

export async function getRecentExecutionHistory(roomId) {
  const historyQuery = query(
    collection(db, "executionHistory"),
    where("roomId", "==", roomId),
    orderBy("createdAt", "desc"),
    limit(20),
  );
  const snapshot = await getDocs(historyQuery);
  return snapshot.docs.map((historyDoc) => ({
    id: historyDoc.id,
    ...historyDoc.data(),
  }));
}

export async function addRoomMessage(roomId, message) {
  const messageRef = await addDoc(collection(db, "rooms", roomId, "messages"), {
    userId: message.userId,
    username: message.username,
    avatar: message.avatar || "",
    message: message.message,
    createdAt: timestamp(),
  });
  return {
    ...message,
    id: messageRef.id,
    createdAt: message.createdAt || new Date(),
  };
}

export async function getRecentRoomMessages(roomId) {
  const messagesQuery = query(
    collection(db, "rooms", roomId, "messages"),
    orderBy("createdAt", "desc"),
    limit(50),
  );
  const snapshot = await getDocs(messagesQuery);
  return snapshot.docs
    .map((messageDoc) => ({ id: messageDoc.id, ...messageDoc.data() }))
    .reverse();
}

export async function sendChat(roomId, userId, message) {
  const chatRef = collection(db, "rooms", roomId, "chats");

  await addDoc(chatRef, {
    userId,
    message,
    timestamp: timestamp(),
  });
}
