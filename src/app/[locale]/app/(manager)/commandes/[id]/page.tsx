import { notFound } from "next/navigation";
import { OrdersScreen, parseOrderParams } from "@/components/orders";
import { getOrder, tabOf } from "@/lib/data";

export default async function OrderPage({ params, searchParams }: PageProps<"/[locale]/app/commandes/[id]">) {
  const { id } = await params;
  const data = await getOrder(id);
  if (!data) notFound();
  const { tab, ...rest } = parseOrderParams(await searchParams);
  // Sur desktop, la liste à gauche montre l'onglet de la commande ouverte.
  return <OrdersScreen tab={tab ?? tabOf(data.order.status)} selectedId={id} {...rest} />;
}
