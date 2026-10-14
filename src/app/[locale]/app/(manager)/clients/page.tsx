import { CustomersScreen, customerFilters } from "@/components/customers";

export default async function CustomersPage({ searchParams }: PageProps<"/[locale]/app/clients">) {
  const sp = await searchParams;
  const segment = customerFilters.find((s) => s === sp.segment) ?? "all";
  return <CustomersScreen segment={segment} q={typeof sp.q === "string" ? sp.q.slice(0, 80) : ""} />;
}
