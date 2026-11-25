import { notFound } from "next/navigation";
import { getProfileByHandle } from "@/lib/data";
import { ProfileInteractiveClient } from "@/components/ProfileInteractiveClient";

interface ProfilePageProps {
  params: Promise<{ handle: string }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  const profile = getProfileByHandle(handle);

  if (!profile) {
    notFound();
  }

  return <ProfileInteractiveClient profile={profile} />;
}
