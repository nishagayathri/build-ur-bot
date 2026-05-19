"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { InboxLayout } from "@/components/inbox/InboxLayout";

export default function InboxPendingPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    setBreadcrumbs([{ label: "Inbox" }, { label: "Pending" }]);
  }, [setBreadcrumbs]);

  return <InboxLayout filter="pending" />;
}
