"use client";

import { logout } from "@/actions/common/authentication";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";

export default function Logout() {
  const router = useRouter();
  const { lang } = useParams<{ lang: string }>();

  const handleLogout = async () => {
    await logout();
    router.push(`/${lang}/login`);
    router.refresh();
  };

  return (
    <Button onClick={handleLogout} variant="destructive" className="w-fit">
      Logout
    </Button>
  );
}
