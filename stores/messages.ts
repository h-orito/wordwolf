import type { DatabaseReference } from "firebase/database";
import { ref as dbRef, off, onValue, push } from "firebase/database";
import { defineStore } from "pinia";
import type { Message } from "./types";

export const useMessagesStore = defineStore("messages", () => {
  const messages = ref<Message[]>([]);
  let messagesRef: DatabaseReference | null = null;

  function resetMessages() {
    if (messagesRef) {
      off(messagesRef);
      messagesRef = null;
    }
    messages.value = [];
  }

  async function initMessages(roomKey: string, isComplete: boolean) {
    if (messagesRef) {
      off(messagesRef);
      messages.value = [];
    }

    const database = useDatabase();
    messagesRef = dbRef(database, `messages/${roomKey}/`);

    if (isComplete) {
      // 終了している村では全てを1回だけ取得する
      onValue(
        messagesRef,
        (snapshot) => {
          const newMessages: Message[] = [];
          snapshot.forEach((child) => {
            newMessages.unshift(child.val() as Message);
          });
          messages.value = newMessages;
        },
        { onlyOnce: true }
      );
    } else {
      // リアルタイムで新しいメッセージを監視
      // onValueで全データを取得し、その後の変更も検知
      onValue(messagesRef, (snapshot) => {
        const newMessages: Message[] = [];
        snapshot.forEach((child) => {
          newMessages.unshift(child.val() as Message);
        });
        messages.value = newMessages;
      });
    }
  }

  async function addMessage(
    roomKey: string,
    name: string,
    color: string | null,
    message: string,
    memberKey: string | null
  ) {
    const database = useDatabase();
    if (!messagesRef) {
      messagesRef = dbRef(database, `messages/${roomKey}/`);
    }

    const clientToken =
      typeof localStorage !== "undefined"
        ? localStorage.getItem("client-token")
        : null;

    const key = generateKey();
    await push(messagesRef, {
      name,
      color,
      key,
      message,
      memberKey,
      createdAt: Date.now(),
      clientToken: clientToken || "",
    });

    return key;
  }

  return {
    messages,
    resetMessages,
    initMessages,
    addMessage,
  };
});

function generateKey() {
  return Math.random().toString(36).slice(-8);
}
