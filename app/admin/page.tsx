import { getData } from "@/lib/db";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const data = await getData();
  return (
    <div className="mx-auto max-w-2xl lg:max-w-5xl">
      <AdminDashboard initialData={data} />
    </div>
  );
}
