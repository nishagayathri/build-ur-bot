"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import {
  EICChatWindow,
  type EICChatWindowHandle,
} from "@/components/chat/EICChatWindow";

export default function ChatPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();
  const chatRef = useRef<EICChatWindowHandle>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const threadId = searchParams.get("t");

  useEffect(() => {
    setBreadcrumbs([{ label: "EIC Chat" }]);
  }, [setBreadcrumbs]);

  const handleNewChat = useCallback(() => {
    const newThreadId = crypto.randomUUID();
    router.push(`/chat?t=${newThreadId}`);
  }, [router]);

  const handleSelectThread = useCallback(
    (id: string) => {
      router.push(`/chat?t=${id}`);
    },
    [router],
  );

  return (
    <div className="-m-8 flex h-[calc(100%+4rem)]">
      <div className="hidden md:flex">
        <ChatSidebar
          activeThreadId={threadId}
          onNewChat={handleNewChat}
          onSelectThread={handleSelectThread}
        />
      </div>
      <div className="flex-1 min-w-0">
        <EICChatWindow ref={chatRef} threadId={threadId} />
      </div>
    </div>
  );
}
