"use client";

import { AutoReplyAssistant } from "./auto-reply-assistant";
import { AppShell } from "./app-shell";
import { CampaignComposer } from "./campaign-composer";
import { CrmPipeline } from "./crm-pipeline";
import { LicenseFooter } from "./license-footer";
import { MetricGrid } from "./metric-card";
import { NumberHealth } from "./number-health";
import { RecentActivity } from "./recent-activity";
import { WhatsAppConnection } from "./whatsapp-connection";

export function DashboardShell() {
  return (
    <AppShell>
      <MetricGrid />
      <div className="grid gap-4 xl:grid-cols-12">
        <WhatsAppConnection />
        <CampaignComposer />
        <RecentActivity />
        <CrmPipeline />
        <AutoReplyAssistant />
        <NumberHealth />
      </div>
      <LicenseFooter />
    </AppShell>
  );
}
