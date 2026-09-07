import { getData } from "@/lib/db";
import { SimulatorPage } from "@/components/admin/SimulatorPage";

export const dynamic = "force-dynamic";

export default async function AdminSimuladorPage() {
  const data = await getData();
  return (
    <div className="mx-auto max-w-2xl lg:max-w-5xl">
      <SimulatorPage initialSettings={data.simulatorSettings} />
    </div>
  );
}
