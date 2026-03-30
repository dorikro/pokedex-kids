"use client";

import Link from "next/link";
import { PokemonCardData } from "@/lib/types";
import { formatPokemonName } from "@/lib/api-client";
import TypeBadge from "./TypeBadge";

interface PokemonCardProps {
  pokemon: PokemonCardData;
}

export default function PokemonCard({ pokemon }: PokemonCardProps) {
  return (
    <Link
      href={`/pokemon/${pokemon.id}`}
      className="block bg-white rounded-2xl border border-gray-200 p-4 hover:shadow-lg hover:scale-[1.02] transition-all duration-200 cursor-pointer"
    >
      <div className="flex flex-col items-center gap-2">
        <span className="text-xs text-gray-400 font-mono self-end">
          #{pokemon.id.toString().padStart(4, "0")}
        </span>
        {pokemon.sprite ? (
          <img
            src={pokemon.sprite}
            alt={pokemon.name}
            width={96}
            height={96}
            className="w-24 h-24 image-rendering-pixelated"
            loading="lazy"
          />
        ) : (
          <div className="w-24 h-24 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
            ?
          </div>
        )}
        <h3 className="font-semibold text-gray-800 text-sm text-center">
          {formatPokemonName(pokemon.name)}
        </h3>
        <div className="flex gap-1 flex-wrap justify-center">
          {pokemon.types.map((type) => (
            <TypeBadge key={type} type={type} />
          ))}
        </div>
      </div>
    </Link>
  );
}
