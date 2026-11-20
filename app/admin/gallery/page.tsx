"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  CheckCircle2,
  X,
  ExternalLink,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";

interface GalleryItem {
  id: string;
  title: string;
  category: "windows" | "doors" | "residential" | "commercial";
  src: string;
  isFeatured: boolean;
}

const initialGallery: GalleryItem[] = [
  {
    id: "gal-1",
    title: "Luxury Villa UPVC Sliding Windows",
    category: "residential",
    src: "/images/gallery/villa-upvc.jpg",
    isFeatured: true,
  },
  {
    id: "gal-2",
    title: "Floor-to-Ceiling Aluminium Sliding Doors",
    category: "doors",
    src: "/images/gallery/aluminium-doors.jpg",
    isFeatured: true,
  },
  {
    id: "gal-3",
    title: "Commercial Facade & Acoustic Casement Windows",
    category: "commercial",
    src: "/images/gallery/commercial-facade.jpg",
    isFeatured: false,
  },
  {
    id: "gal-4",
    title: "White UPVC 3-Track Window with Bug Mesh",
    category: "windows",
    src: "/images/gallery/upvc-mesh.jpg",
    isFeatured: true,
  },
];

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>(initialGallery);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newItem, setNewItem] = useState({
    title: "",
    category: "windows" as GalleryItem["category"],
    src: "",
    isFeatured: false,
  });

  const handleAddPhoto = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title || !newItem.src) return;

    const created: GalleryItem = {
      id: `gal-${Date.now()}`,
      title: newItem.title,
      category: newItem.category,
      src: newItem.src,
      isFeatured: newItem.isFeatured,
    };

    setItems([created, ...items]);
    setIsModalOpen(false);
    setNewItem({
      title: "",
      category: "windows",
      src: "",
      isFeatured: false,
    });
  };

  const toggleFeatured = (id: string) => {
    setItems(
      items.map((img) =>
        img.id === id ? { ...img, isFeatured: !img.isFeatured } : img
      )
    );
  };

  const handleDelete = (id: string) => {
    if (confirm("Remove this photo from the website gallery?")) {
      setItems(items.filter((img) => img.id !== id));
    }
  };

  const filteredItems = items.filter((img) =>
    filterCat === "all" ? true : img.category === filterCat
  );

  return (
    <PermissionGuard permission="gallery">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-amber-500" />
            Gallery & Project Portfolio Media
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Control the photographs displayed in the public website portfolio section.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Gallery Photo
        </button>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2">
        {["all", "windows", "doors", "residential", "commercial"].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition ${
              filterCat === cat
                ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
            }`}
          >
            {cat === "all" ? "All Categories" : cat}
          </button>
        ))}
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {filteredItems.map((img) => (
          <div
            key={img.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden group hover:border-amber-500/50 transition flex flex-col justify-between shadow-sm"
          >
            <div className="relative aspect-4/3 bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <img
                src={img.src}
                alt={img.title}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                onError={(e) => {
                  // Fallback placeholder if local image file isn't uploaded yet
                  (e.target as HTMLImageElement).src =
                    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
                }}
              />
              <div className="absolute top-2 right-2 flex items-center gap-1.5">
                <button
                  onClick={() => toggleFeatured(img.id)}
                  className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition ${
                    img.isFeatured
                      ? "bg-amber-500 text-slate-950 font-bold"
                      : "bg-black/50 text-white hover:bg-black/80"
                  }`}
                  title={img.isFeatured ? "Featured on Home" : "Make Featured"}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                </button>
                <button
                  onClick={() => handleDelete(img.id)}
                  className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md shadow-sm transition"
                  title="Delete Image"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                {img.category}
              </span>
            </div>

            <div className="p-4 space-y-2">
              <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                {img.title}
              </h4>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                <span>{img.isFeatured ? "⭐ Featured" : "Standard"}</span>
                <span className="font-mono text-[10px]">{img.id}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Photo Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" />
                Add Photograph to Gallery
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddPhoto} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Photo Title / Description *
                </label>
                <input
                  type="text"
                  required
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  placeholder="e.g. Tanuku Residency Sliding Windows"
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Category
                </label>
                <select
                  value={newItem.category}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      category: e.target.value as GalleryItem["category"],
                    })
                  }
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                >
                  <option value="windows">Windows</option>
                  <option value="doors">Doors</option>
                  <option value="residential">Residential</option>
                  <option value="commercial">Commercial</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-slate-700 dark:text-slate-300">
                  Image Path / URL *
                </label>
                <input
                  type="text"
                  required
                  value={newItem.src}
                  onChange={(e) => setNewItem({ ...newItem, src: e.target.value })}
                  placeholder="/images/gallery/my-window.jpg or https://..."
                  className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2"
                />
                <span className="text-[10px] text-slate-400">
                  Place images in public/images/gallery or paste Supabase Storage CDN URL.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="featuredCheck"
                  checked={newItem.isFeatured}
                  onChange={(e) =>
                    setNewItem({ ...newItem, isFeatured: e.target.checked })
                  }
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <label htmlFor="featuredCheck" className="text-slate-700 dark:text-slate-300 font-medium">
                  Feature on website homepage
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm"
                >
                  Add to Gallery
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </PermissionGuard>
  );
}
