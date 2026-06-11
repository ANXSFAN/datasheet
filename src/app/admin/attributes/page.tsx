import { getTranslations } from "next-intl/server";
import { getActiveFactory } from "@/lib/active-factory";
import { getAdminLocale } from "@/lib/admin-locale";
import { listAttributes } from "@/lib/attributes";
import { AttributeManager } from "@/components/attribute-manager";

export const dynamic = "force-dynamic";

export default async function AdminAttributesPage() {
  const factory = await getActiveFactory();
  const locale = await getAdminLocale();
  const t = await getTranslations({ locale, namespace: "admin.page" });
  const tc = await getTranslations({ locale, namespace: "admin.common" });

  const attrs = factory ? await listAttributes(factory.id) : [];

  return (
    <div>
      <div>
        <h1 className="headline-lg text-[26px] text-[var(--color-ink)]">
          {t("attributes")}
        </h1>
        <p className="mt-1 text-sm text-[var(--color-ink-muted)]">
          {factory ? (
            <>
              <span className="font-medium text-[var(--color-ink)]">
                {factory.name}
              </span>
              {" · "}
              {t("attributesSub")}
            </>
          ) : (
            tc("noFactory")
          )}
        </p>
      </div>

      {factory && <AttributeManager attrs={attrs} />}
    </div>
  );
}
