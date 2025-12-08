"use client";

import useTranslation from "@/hooks/useTranslation";
import Logout from "../logout";

export function AccessDenied() {
  const { t } = useTranslation();
  
  return (
    <div className="grid place-content-center gap-5">
      <div className="p-10 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive">
        <p className="text-2xl first-letter:font-bold">
          {t("dashboard.accessDenied")}
        </p>
        <p className="text-sm">
          {t("dashboard.needToBeLoggedIn")}
        </p>
      </div>
      <Logout />
    </div>
  );
}

export function AccountStatusMessage({ 
  isBlocked 
}: { 
  isBlocked: boolean 
}) {
  const { t } = useTranslation();
  
  return (
    <div className="grid place-content-center gap-5">
      <div className="p-10 bg-destructive/10 border border-destructive/50 rounded-xl text-destructive">
        <p className="text-2xl first-letter:font-bold">
          {isBlocked ? t("dashboard.accountBlocked") : t("dashboard.accountInactive")}
        </p>
        <p className="text-sm">
          {isBlocked ? t("dashboard.accountBlockedMessage") : t("dashboard.accountInactiveMessage")}
        </p>
      </div>
      <Logout />
    </div>
  );
}

