import { notFound } from "next/navigation";
import { CustomersScreen, customerFilters } from "@/components/customers";
import { getCustomer } from "@/lib/data";

export default async function CustomerPage({ params, searchParams }: PageProps<"/[locale]/app/clients/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  if (!(await getCustomer(id))) notFound();
  const segment = customerFilters.find((s) => s === sp.segment) ?? "all";
  return <CustomersScreen segment={segment} q={typeof sp.q === "string" ? sp.q.slice(0, 80) : ""} selectedId={id} />;
}
