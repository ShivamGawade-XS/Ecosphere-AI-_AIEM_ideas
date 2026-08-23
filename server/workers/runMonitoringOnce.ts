import { runMonitoringForAllOrganizations } from "./monitoringWorker";

async function main() {
  const suppliedRunKey = process.env.MONITORING_RUN_KEY?.trim();
  const runKey = suppliedRunKey || `cli:${new Date().toISOString()}`;
  const results = await runMonitoringForAllOrganizations({ runKey, trigger: "cli" });
  const failed = results.filter((result) => result.status === "failed");
  console.log(JSON.stringify({ runKey, organizationCount: results.length, failedCount: failed.length, results }, null, 2));
  process.exit(failed.length ? 1 : 0);
}

main().catch((error) => {
  console.error("[Monitoring CLI] Unhandled run failure", error);
  process.exit(1);
});
