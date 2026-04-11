import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
};

const SETTING_SECTIONS = [
  {
    title: "General",
    description: "Application preferences and display options.",
    fields: ["Theme", "Language", "Timezone"],
  },
  {
    title: "Notifications",
    description: "Configure alerts for approvals and anomalies.",
    fields: ["Email Alerts", "Webhook URL", "Slack Integration"],
  },
  {
    title: "Security",
    description: "Owner wallet, 2FA, and session management.",
    fields: ["Connected Wallet", "Two-Factor Auth", "Active Sessions"],
  },
  {
    title: "API Keys",
    description: "Manage SDK credentials for your applications.",
    fields: ["Production Key", "Development Key", "Webhook Secret"],
  },
] as const;

export default function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Manage your PayClaw account, security, and integrations.
        </p>
      </div>

      <div className="space-y-4">
        {SETTING_SECTIONS.map(({ title, description, fields }) => (
          <div key={title} className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
                <p className="text-xs text-zinc-600 mt-0.5">{description}</p>
              </div>
              <span className="badge-yellow text-[10px]">Phase 3</span>
            </div>
            <div className="space-y-2">
              {fields.map((field) => (
                <div
                  key={field}
                  className="flex items-center justify-between py-2 border-t border-surface-border"
                >
                  <span className="text-xs text-zinc-500">{field}</span>
                  <div className="w-24 h-5 rounded bg-surface-raised border border-surface-border" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-zinc-700 pb-4">
        Full settings management coming in Phase 3
      </p>
    </div>
  );
}
