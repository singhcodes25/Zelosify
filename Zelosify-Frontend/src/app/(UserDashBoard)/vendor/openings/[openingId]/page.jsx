"use client";

import { useParams } from "next/navigation";
import OpeningDetailsLayout from "@/components/UserDashboardPage/IT_VENDOR/Openings/OpeningDetailsLayout";

export default function OpeningDetailsPage() {
  const { openingId } = useParams();

  

  return <OpeningDetailsLayout opId={openingId} />;
}