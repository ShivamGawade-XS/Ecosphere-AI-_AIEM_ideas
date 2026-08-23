import { trpc } from "@/lib/trpc";
import { useEffect, useMemo, useState } from "react";

/** Keeps the active tenant selection local while all business data remains server authoritative. */
export function useActiveOrganization() {
  const organizationsQuery = trpc.organizations.mine.useQuery();
  const [organizationId, setOrganizationId] = useState<number | null>(null);

  useEffect(() => {
    const firstId = organizationsQuery.data?.[0]?.organization.id;
    if (organizationId === null && firstId) setOrganizationId(firstId);
  }, [organizationId, organizationsQuery.data]);

  const activeOrganization = useMemo(
    () => organizationsQuery.data?.find((item) => item.organization.id === organizationId) ?? organizationsQuery.data?.[0] ?? null,
    [organizationId, organizationsQuery.data],
  );

  return {
    ...organizationsQuery,
    organizationId: activeOrganization?.organization.id ?? null,
    activeOrganization,
    setOrganizationId,
  };
}
