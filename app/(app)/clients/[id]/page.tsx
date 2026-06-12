import { redirect } from "next/navigation";

type ClientRootPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientRootPage({ params }: ClientRootPageProps) {
  const { id } = await params;
  redirect(`/clients/${id}/dashboard`);
}
