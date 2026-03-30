"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  fetchPokemonDetail,
  formatPokemonName,
  formatHeight,
  formatWeight,
} from "@/lib/api-client";
import { GENERATIONS } from "@/lib/constants";
import { LocalPokemon } from "@/lib/types";
import { useTranslation } from "@/lib/i18n/index";
import TypeBadge from "@/components/TypeBadge";
import StatChart from "@/components/StatChart";
import SpeakButton from "@/components/SpeakButton";

interface PokemonDetailProps {
  id: string;
}

export default function PokemonDetail({ id }: PokemonDetailProps) {
  const [pokemon, setPokemon] = useState<LocalPokemon | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchPokemonDetail(id);
        setPokemon(data);
      } catch {
        setError(t.detail.error);
      }
      setLoading(false);
    }

    load();
  }, [id, t.detail.error]);

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">{t.detail.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !pokemon) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <p className="text-gray-500 text-lg">{error || t.detail.notFound}</p>
        <Link
          href="/"
          className="px-4 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600"
        >
          {t.detail.backToBrowse}
        </Link>
      </div>
    );
  }

  const generation = GENERATIONS.find((g) => g.name === pokemon.generation);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Back button */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
      >
        <svg className="w-4 h-4 rtl:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {t.detail.back}
      </Link>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Header with sprite */}
        <div className="flex flex-col items-center pt-6 pb-4 px-6 bg-gray-50">
          {pokemon.sprite ? (
            <img
              src={pokemon.sprite}
              alt={pokemon.name}
              width={160}
              height={160}
              className="w-40 h-40 image-rendering-pixelated"
            />
          ) : (
            <div className="w-40 h-40 bg-gray-200 rounded-lg flex items-center justify-center text-gray-400 text-4xl">
              ?
            </div>
          )}
          <div className="flex items-center gap-3 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {formatPokemonName(pokemon.name)}
            </h1>
            <SpeakButton name={pokemon.name} />
          </div>
          <p className="text-gray-400 font-mono text-sm mt-1">
            #{pokemon.id.toString().padStart(4, "0")}
          </p>
          <div className="flex gap-2 mt-3">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={type} size="md" />
            ))}
          </div>
        </div>

        {/* Info sections */}
        <div className="p-6 flex flex-col gap-6">
          {/* Basic Info */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.detail.info}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{t.detail.height}</p>
                <p className="font-medium text-gray-800">{formatHeight(pokemon.height)}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="text-xs text-gray-400">{t.detail.weight}</p>
                <p className="font-medium text-gray-800">{formatWeight(pokemon.weight)}</p>
              </div>
              {generation && (
                <div className="bg-gray-50 rounded-xl p-3 col-span-2">
                  <p className="text-xs text-gray-400">{t.detail.generation}</p>
                  <p className="font-medium text-gray-800">{generation.label}</p>
                </div>
              )}
            </div>
          </section>

          {/* Pokedex Entry */}
          {pokemon.flavor_text && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">{t.detail.pokedexEntry}</h2>
              <p className="text-gray-600 leading-relaxed">{pokemon.flavor_text}</p>
            </section>
          )}

          {/* Stats */}
          <section>
            <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.detail.stats}</h2>
            <StatChart
              stats={pokemon.stats.map((s) => ({
                base_stat: s.base_stat,
                effort: 0,
                stat: { name: s.name, url: "" },
              }))}
            />
          </section>

          {/* Abilities */}
          {pokemon.abilities.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.detail.abilities}</h2>
              <div className="flex flex-col gap-2">
                {pokemon.abilities.map((ability) => (
                  <div key={ability.name} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-800 capitalize">
                        {ability.name.replace("-", " ")}
                      </p>
                      {ability.is_hidden && (
                        <span className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full">
                          {t.detail.hidden}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{ability.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Evolution Chain */}
          {pokemon.evolution_chain.length > 1 && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.detail.evolution}</h2>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {pokemon.evolution_chain.map((step, idx) => (
                  <div key={step.name} className="flex items-center gap-2">
                    <Link
                      href={`/pokemon/${step.id}`}
                      className={`flex flex-col items-center p-3 rounded-xl transition-colors ${
                        step.id === pokemon.id
                          ? "bg-red-50 border-2 border-red-200"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      {step.sprite ? (
                        <img
                          src={step.sprite}
                          alt={step.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 image-rendering-pixelated"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400">
                          ?
                        </div>
                      )}
                      <p className="text-xs font-medium text-gray-700 mt-1">
                        {formatPokemonName(step.name)}
                      </p>
                    </Link>
                    {idx < pokemon.evolution_chain.length - 1 && (
                      <svg
                        className="w-5 h-5 text-gray-300 rtl:rotate-180"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Official Artwork */}
          {pokemon.artwork && (
            <section>
              <h2 className="text-lg font-semibold text-gray-800 mb-3">{t.detail.officialArtwork}</h2>
              <div className="flex justify-center">
                <img
                  src={pokemon.artwork}
                  alt={`${pokemon.name} official artwork`}
                  className="max-w-xs w-full"
                  loading="lazy"
                />
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
