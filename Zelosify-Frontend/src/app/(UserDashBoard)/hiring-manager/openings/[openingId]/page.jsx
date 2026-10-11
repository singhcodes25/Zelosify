
"use client";

import { useParams } from "next/navigation";
import OpeningDetailsLayout from "@/components/UserDashboardPage/HIRING_MANAGER/Openings/OpeningDetailsLayout";

export default function OpeningDetailsPage() {
  const { openingId } = useParams();

  

  return <OpeningDetailsLayout openId={openingId} />;
}
