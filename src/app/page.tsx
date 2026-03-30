"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { PokemonCardData } from "@/lib/types";
import { fetchPokemonList } from "@/lib/api-client";
import PokemonCard from "@/components/PokemonCard";
import SearchBox from "@/components/SearchBox";
import GenerationTabs from "@/components/GenerationTabs";
import TypeFilter from "@/components/TypeFilter";

const BATCH_SIZE = 36;

export default function Home() {
  const [allPokemon, setAllPokemon] = useState<PokemonCardData[]>([]);
  const [search, setSearch] = useState("");
  const [selectedGen, setSelectedGen] = useState<number | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const loadingRef = useRef(false);

  // Load a batch of Pokemon from our API
  const loadBatch = useCallback(
    async (currentOffset: number, replace: boolean) => {
      if (replace) {
        setLoading(true);
      } else {
        setLoadingMore(true);
        loadingRef.current = true;
      }

      try {
        const result = await fetchPokemonList({
          offset: currentOffset,
          limit: BATCH_SIZE,
          search: search.trim() || undefined,
          types: selectedTypes.length > 0 ? selectedTypes : undefined,
          generation: selectedGen,
        });

        if (replace) {
          setAllPokemon(result.pokemon);
        } else {
          setAllPokemon((prev) => [...prev, ...result.pokemon]);
        }

        setOffset(currentOffset + result.pokemon.length);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error("Failed to load Pokemon:", err);
      }

      setLoading(false);
      setLoadingMore(false);
      loadingRef.current = false;
    },
    [search, selectedTypes, selectedGen]
  );

  // Reload when filters change
  useEffect(() => {
    setOffset(0);
    loadBatch(0, true);
  }, [loadBatch]);

  // Load more (for infinite scroll or button)
  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    loadBatch(offset, false);
  }, [offset, hasMore, loadBatch]);

  // Infinite scroll observer
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Only enable infinite scroll when not searching/filtering
    if (search.trim() || selectedTypes.length > 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingRef.current) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => observerRef.current?.disconnect();
  }, [hasMore, loadMore, search, selectedTypes]);

  const toggleType = (type: string) => {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <SearchBox value={search} onChange={setSearch} />
        </div>
        <GenerationTabs selected={selectedGen} onSelect={setSelectedGen} />
        <TypeFilter
          selectedTypes={selectedTypes}
          onToggleType={toggleType}
          onClear={() => setSelectedTypes([])}
        />
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
            <p className="text-gray-500 text-sm">Loading Pokémon...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && allPokemon.length === 0 && (
        <div className="flex justify-center py-20">
          <p className="text-gray-400 text-lg">No Pokémon found. Try a different search!</p>
        </div>
      )}

      {/* Pokemon Grid */}
      {!loading && allPokemon.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {allPokemon.map((pokemon) => (
            <PokemonCard key={pokemon.id} pokemon={pokemon} />
          ))}
        </div>
      )}

      {/* Infinite scroll sentinel */}
      {!loading && hasMore && !search.trim() && selectedTypes.length === 0 && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          {loadingMore && (
            <div className="w-8 h-8 border-4 border-red-200 border-t-red-500 rounded-full animate-spin" />
          )}
        </div>
      )}

      {/* Load more for filtered results */}
      {!loading && hasMore && (search.trim() || selectedTypes.length > 0) && (
        <div className="flex justify-center py-6">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="px-6 py-2 bg-red-500 text-white rounded-full text-sm font-medium hover:bg-red-600 disabled:opacity-50 transition-colors"
            type="button"
          >
            {loadingMore ? "Loading..." : "Load More"}
          </button>
        </div>
      )}
    </div>
  );
}
