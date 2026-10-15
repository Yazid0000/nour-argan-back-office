import { notFound } from "next/navigation";
import { ProductForm } from "@/components/product-form";
import { getProduct } from "@/lib/data";

export default async function ProductPage({ params, searchParams }: PageProps<"/[locale]/app/produits/[id]">) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const product = await getProduct(id);
  if (!product) notFound();
  // Avec ?enregistre=1, on arrive ici juste après un enregistrement réussi.
  return <ProductForm key={product.id} product={product} saved={sp.enregistre === "1"} />;
}
