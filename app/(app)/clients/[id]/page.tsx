import { redirect } from "next/navigation";

export default function ClientIndex({ params }: { params: { id: string } }) {
  redirect(`/clients/${params.id}/dashboard`);
}
