import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { getProduct } from "@/lib/data";

export default async function ProductPage({ params }: PageProps<"/[locale]/app/produits/[id]">) {
  const product = await getProduct((await params).id);
  if (!product) notFound();
  return <ProductForm product={product} />;
}
