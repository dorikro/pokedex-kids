import PokemonDetail from "@/components/PokemonDetail";

export default async function PokemonPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PokemonDetail id={id} />;
}
