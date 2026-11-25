"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import AdminShell from "@/components/AdminShell";
import { OfferDTO } from "@/lib/types";

export default function AdminOffersPage() {
  const [offers, setOffers] = useState<OfferDTO[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOffers = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/offers", { cache: "no-store" });
      if (res.ok) {
        const data = (await res.json()) as { offers: OfferDTO[] };
        setOffers(data.offers);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchOffers();
  }, [fetchOffers]);

  const toggleOffer = async (offer: OfferDTO) => {
    const res = await fetch("/api/admin/offers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: offer.id, isActive: !offer.isActive }),
    });
    if (res.ok) {
      setLoading(true);
      await fetchOffers();
    }
  };

  return (
    <AdminShell
      title="Offers · Tyohar Sale"
      subtitle="Grahakon ke home screen par offer banner chalu ya band karein"
    >
      {loading ? (
        <div className="h-36 rounded-2xl bg-white border border-stone-200 animate-pulse" />
      ) : (
        <div className="space-y-4">
          {offers.map((offer) => (
            <div
              key={offer.id}
              className="rounded-2xl bg-white border border-stone-200 p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-base text-stone-900">
                    {offer.title} · {offer.titleHi}
                  </h2>
                  <p className="text-xs text-stone-600 mt-0.5">{offer.body}</p>
                  <p className="text-xs text-stone-500">{offer.bodyHi}</p>
                </div>
              </div>

              <button
                onClick={() => toggleOffer(offer)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold ${
                  offer.isActive
                    ? "bg-emerald-700 text-white"
                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                }`}
              >
                {offer.isActive ? "Active on Storefront (Band Karein)" : "Chalu Karein"}
              </button>
            </div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
