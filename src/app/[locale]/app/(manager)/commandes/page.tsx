import { OrdersScreen, parseOrderParams } from "@/components/orders";

export default async function OrdersPage({ searchParams }: PageProps<"/[locale]/app/commandes">) {
  const { tab, ...rest } = parseOrderParams(await searchParams);
  return <OrdersScreen tab={tab ?? "toConfirm"} {...rest} />;
}
