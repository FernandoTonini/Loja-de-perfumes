import { prisma } from "@/lib/prisma";
import { AdminSettingsForm } from "@/components/admin/AdminSettingsForm";

export default async function AdminSettingsPage() {
  const settings = await prisma.setting.findMany();
  const settingsMap: Record<string, string> = {};
  settings.forEach((s) => { settingsMap[s.key] = s.value; });

  return (
    <div className="p-8">
      <div className="mb-8">
        <p className="text-gold text-xs tracking-[0.3em] uppercase font-sans mb-2">Sistema</p>
        <h1 className="font-serif text-3xl text-white">Configurações</h1>
      </div>
      <AdminSettingsForm settings={settingsMap} />
    </div>
  );
}
