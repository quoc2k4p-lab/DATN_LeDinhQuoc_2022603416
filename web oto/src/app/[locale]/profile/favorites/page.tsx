"use client";

import { useEffect } from "react";
import { useRouter } from "@/i18n/routing";

export default function FavoritesPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/profile");
  }, [router]);

  return null;
}
