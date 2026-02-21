"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Category = {
  id: string;
  name: string;
};

type Item = {
  id: string;
  name: string;
  unit_price: number;
  unit: string;
  pricing_model: string;
  category_id: string;
};

export default function CatalogPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);

    const { data: catData } = await supabase
      .from("catalog_categories")
      .select("id,name")
      .order("sort_order");

    const { data: itemData } = await supabase
      .from("catalog_items")
      .select("id,name,unit_price,unit,pricing_model,category_id");

    setCategories(catData ?? []);
    setItems(itemData ?? []);
    setLoading(false);
  }

  async function addCategory() {
    if (!newCategory) return;

    await supabase.from("catalog_categories").insert({
      name: newCategory,
    });

    setNewCategory("");
    load();
  }

  async function addItem(categoryId: string) {
    await supabase.from("catalog_items").insert({
      category_id: categoryId,
      name: "New service",
      unit_price: 0,
      unit: "ks",
      pricing_model: "per_unit",
    });

    load();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
        Loading...
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white p-10">
      <h1 className="text-3xl text-[#c9a84c] tracking-widest uppercase">
        Catalog
      </h1>

      {/* Add category */}
      <div className="mt-8 flex gap-3">
        <input
          className="bg-black/30 border border-white/10 px-4 py-2"
          placeholder="New category name"
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
        />
        <button
          onClick={addCategory}
          className="bg-[#c9a84c] text-black px-4 py-2"
        >
          Add Category
        </button>
      </div>

      {/* Categories list */}
      <div className="mt-10 space-y-8">
        {categories.map((cat) => (
          <div key={cat.id} className="border border-white/10 p-6 bg-white/5">
            <div className="flex justify-between items-center">
              <h2 className="text-xl text-white">{cat.name}</h2>
              <button
                onClick={() => addItem(cat.id)}
                className="text-sm border border-white/20 px-3 py-1"
              >
                + Add Item
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {items
                .filter((i) => i.category_id === cat.id)
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between text-white/70"
                  >
                    <div>{item.name}</div>
                    <div>
                      {item.unit_price} / {item.unit}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
