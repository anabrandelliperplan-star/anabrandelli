import { getData } from "@/lib/db";
import { TabelaImportPage } from "@/components/admin/TabelaImportPage";

export const dynamic = "force-dynamic";

export default async function AdminImportarTabelaPage() {
  const data = await getData();
  return (
    <div className="mx-auto max-w-2xl lg:max-w-5xl">
      <TabelaImportPage developments={data.developments} />
    </div>
  );
}
