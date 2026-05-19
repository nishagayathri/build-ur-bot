"use client";

import { useEffect } from "react";
import { useBreadcrumbContext } from "@/context/BreadcrumbContext";
import { InboxLayout } from "@/components/inbox/InboxLayout";

export default function InboxAllPage() {
  const { setBreadcrumbs } = useBreadcrumbContext();

  useEffect(() => {
    setBreadcrumbs([{ label: "Inbox" }, { label: "All" }]);
  }, [setBreadcrumbs]);

  return <InboxLayout filter="all" />;
}
