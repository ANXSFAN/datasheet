"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";

export function SyncButton() {
  const router = useRouter();
  const t = useTranslations("more");
  const [loading, setLoading] = useState(false);

  async function handleSync() {
    setLoading(true);
    try {
      const res = await fetch("/api/sync", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || t("syncFail"));
      } else {
        toast.success(t("syncOk", { created: data.created, updated: data.updated }));
        router.refresh();
      }
    } catch {
      toast.error(t("syncFail"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-full border border-[var(--color-rule)] px-4 py-2 text-xs text-[var(--color-ink)] transition hover:bg-[var(--color-surface-sunken)] disabled:opacity-50"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
      {loading ? t("syncing") : t("syncBtn")}
    </button>
  );
}
