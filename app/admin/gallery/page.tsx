"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Star,
  X,
  UploadCloud,
  FolderPlus,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Tag,
} from "lucide-react";
import PermissionGuard from "@/components/admin/PermissionGuard";
import { toast, confirmModal } from "@/components/ui/ToastProvider";
import { CustomSelect } from "@/components/ui/Select";

interface GalleryCategory {
  id: string;
  name: string;
  slug: string;
  display_order: number;
}

interface GalleryItem {
  id: string;
  title: string;
  description?: string | null;
  category: string; // slug
  categoryName: string;
  categoryId: string | null;
  src: string;
  isFeatured: boolean;
  createdAt?: string;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [categories, setCategories] = useState<GalleryCategory[]>([]);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  // New photo form state
  const [newItem, setNewItem] = useState({
    title: "",
    categoryId: "",
    customCategoryName: "",
    src: "",
    isFeatured: false,
  });

  // New category form state
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [uploadTab, setUploadTab] = useState<"file" | "url">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch gallery items and categories from database
  const loadGallery = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/admin/gallery", { cache: "no-store" });
      const json = await res.json();

      if (json.success) {
        setCategories(json.categories || []);

        const formatted: GalleryItem[] = (json.images || []).map((img: any) => ({
          id: img.id,
          title: img.title,
          description: img.description,
          src: img.image_url,
          isFeatured: Boolean(img.is_featured),
          category: img.gallery_categories?.slug || "other",
          categoryName: img.gallery_categories?.name || "Other",
          categoryId: img.category_id,
          createdAt: img.created_at,
        }));

        setItems(formatted);

        // Set default category for new items if available
        if (json.categories && json.categories.length > 0 && !newItem.categoryId) {
          setNewItem((prev) => ({ ...prev, categoryId: json.categories[0].id }));
        }
      }
    } catch (err: any) {
      console.error("Error loading gallery data:", err);
      toast.error("Failed to load gallery items from database.", "Load Error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadGallery();
  }, []);

  // Handle direct file upload to Supabase Storage
  const handleFileUpload = async (file: File) => {
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(`Uploading ${file.name}...`);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/gallery/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();

      if (json.success && json.url) {
        setNewItem((prev) => ({
          ...prev,
          src: json.url,
          title: prev.title || file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
        }));
        toast.success("Image uploaded to cloud storage successfully!");
      } else {
        toast.error(json.error || "Failed to upload image file.", "Upload Failed");
      }
    } catch (err: any) {
      toast.error(err?.message || "Error uploading file to storage.", "Upload Error");
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
    }
  };

  // Handle adding photo to gallery
  const handleAddPhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.title.trim() || !newItem.src.trim()) {
      toast.error("Please provide both title and image.", "Validation Error");
      return;
    }

    try {
      const payload: Record<string, any> = {
        title: newItem.title.trim(),
        image_url: newItem.src.trim(),
        is_featured: newItem.isFeatured,
      };

      if (newItem.categoryId === "custom") {
        if (!newItem.customCategoryName.trim()) {
          toast.error("Please enter a custom category name.", "Validation Error");
          return;
        }
        payload.customCategoryName = newItem.customCategoryName.trim();
      } else if (newItem.categoryId) {
        payload.category_id = newItem.categoryId;
      }

      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (json.success && json.data) {
        const created: GalleryItem = {
          id: json.data.id,
          title: json.data.title,
          src: json.data.image_url,
          isFeatured: Boolean(json.data.is_featured),
          category: json.data.gallery_categories?.slug || "other",
          categoryName: json.data.gallery_categories?.name || "Other",
          categoryId: json.data.category_id,
          createdAt: json.data.created_at,
        };

        setItems([created, ...items]);
        setIsModalOpen(false);

        // Reset form
        setNewItem({
          title: "",
          categoryId: categories[0]?.id || "",
          customCategoryName: "",
          src: "",
          isFeatured: false,
        });

        // Refresh categories if custom category was added
        if (payload.customCategoryName) {
          loadGallery();
        }

        toast.success("Photo added to website gallery and database successfully!");
      } else {
        toast.error(json.error || "Could not save photo to gallery.", "Save Error");
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error while saving photo.", "Save Error");
    }
  };

  // Handle creating a new custom category directly
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;

    try {
      setIsCreatingCategory(true);
      const res = await fetch("/api/admin/gallery/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCategoryName.trim() }),
      });

      const json = await res.json();

      if (json.success && json.data) {
        setCategories((prev) => {
          if (prev.some((c) => c.id === json.data.id)) return prev;
          return [...prev, json.data];
        });
        setNewCategoryName("");
        setIsCategoryModalOpen(false);
        toast.success(`Category "${json.data.name}" added successfully!`);
      } else {
        toast.error(json.error || "Failed to add category.", "Error");
      }
    } catch (err: any) {
      toast.error(err?.message || "Network error adding category.", "Error");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  // Toggle Featured Status
  const toggleFeatured = async (id: string) => {
    const target = items.find((it) => it.id === id);
    if (!target) return;

    const nextFeatured = !target.isFeatured;

    // Optimistic UI update
    setItems((prev) =>
      prev.map((img) => (img.id === id ? { ...img, isFeatured: nextFeatured } : img))
    );

    try {
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, is_featured: nextFeatured }),
      });

      const json = await res.json();
      if (json.success) {
        toast.info(
          nextFeatured
            ? "⭐ Marked as Featured on website homepage!"
            : "Removed from Featured list."
        );
      } else {
        // Rollback
        setItems((prev) =>
          prev.map((img) => (img.id === id ? { ...img, isFeatured: target.isFeatured } : img))
        );
        toast.error("Failed to update featured status.", "Update Error");
      }
    } catch {
      // Rollback
      setItems((prev) =>
        prev.map((img) => (img.id === id ? { ...img, isFeatured: target.isFeatured } : img))
      );
      toast.error("Network error updating status.", "Update Error");
    }
  };

  // Delete image
  const handleDelete = async (id: string) => {
    const confirmed = await confirmModal({
      title: "Remove Photo from Gallery?",
      message:
        "Are you sure you want to remove this photograph from the website gallery display and database?",
      type: "danger",
      confirmText: "Delete Photo",
      cancelText: "Keep Photo",
    });

    if (confirmed) {
      try {
        const res = await fetch(`/api/admin/gallery?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        });

        const json = await res.json();
        if (json.success) {
          setItems((prev) => prev.filter((img) => img.id !== id));
          toast.success("Photo removed from website gallery.");
        } else {
          toast.error(json.error || "Failed to delete photo.", "Delete Error");
        }
      } catch (err: any) {
        toast.error(err?.message || "Network error deleting photo.", "Delete Error");
      }
    }
  };

  const filteredItems = items.filter((img) => {
    if (filterCat === "all") return true;
    return img.category === filterCat || img.categoryId === filterCat;
  });

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
              Upload and manage your installation photos. Connected dynamically to the live website portfolio.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition cursor-pointer"
            >
              <FolderPlus className="w-4 h-4 text-amber-500" />
              + Custom Category
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Gallery Photo
            </button>
          </div>
        </div>

        {/* Dynamic Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-none pb-1">
          <button
            onClick={() => setFilterCat("all")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition shrink-0 cursor-pointer ${
              filterCat === "all"
                ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
            }`}
          >
            All Categories ({items.length})
          </button>

          {categories.map((cat) => {
            const count = items.filter(
              (img) => img.category === cat.slug || img.categoryId === cat.id
            ).length;

            return (
              <button
                key={cat.id}
                onClick={() => setFilterCat(cat.slug)}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold capitalize transition shrink-0 cursor-pointer ${
                  filterCat === cat.slug
                    ? "bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 shadow-sm"
                    : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-slate-300"
                }`}
              >
                {cat.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="text-xs">Loading portfolio images from database...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
            <ImageIcon className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No photos found in this category
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Upload your installation photos to showcase your craftsmanship on the live website.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition"
            >
              <Plus className="w-4 h-4" />
              Upload First Photo
            </button>
          </div>
        ) : (
          /* Gallery Grid */
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
                      (e.target as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";
                    }}
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1.5">
                    <button
                      onClick={() => toggleFeatured(img.id)}
                      className={`p-1.5 rounded-full backdrop-blur-md shadow-sm transition cursor-pointer ${
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
                      className="p-1.5 rounded-full bg-red-600/80 hover:bg-red-600 text-white backdrop-blur-md shadow-sm transition cursor-pointer"
                      title="Delete Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <span className="absolute bottom-2 left-2 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/60 text-white backdrop-blur-xs">
                    {img.categoryName || img.category}
                  </span>
                </div>

                <div className="p-4 space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white line-clamp-1">
                    {img.title}
                  </h4>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <span className={img.isFeatured ? "text-amber-600 dark:text-amber-400 font-semibold" : ""}>
                      {img.isFeatured ? "⭐ Featured" : "Standard"}
                    </span>
                    <span className="font-mono text-[9px] text-slate-400 truncate max-w-[120px]">
                      {img.id.slice(0, 8)}...
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Photo Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 sm:p-6 my-auto shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-amber-500" />
                  Add Photograph to Gallery
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleAddPhoto} className="space-y-4 text-xs">
                {/* Photo Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Photo Title / Project Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newItem.title}
                    onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                    placeholder="e.g. Tanuku Residency 3-Track Sliding Windows"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-medium"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Category *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setNewItem((prev) => ({
                          ...prev,
                          categoryId: prev.categoryId === "custom" ? categories[0]?.id || "" : "custom",
                        }));
                      }}
                      className="text-[11px] text-amber-600 dark:text-amber-400 hover:underline font-semibold cursor-pointer"
                    >
                      {newItem.categoryId === "custom" ? "← Pick Existing Category" : "+ Add Custom Category"}
                    </button>
                  </div>

                  {newItem.categoryId === "custom" ? (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={newItem.customCategoryName}
                        onChange={(e) =>
                          setNewItem({ ...newItem, customCategoryName: e.target.value })
                        }
                        placeholder="Enter new category name (e.g. Balcony Glazing, Villa Facades)"
                        className="w-full bg-amber-50/30 dark:bg-slate-800 border border-amber-300 dark:border-amber-500/50 rounded-lg p-2.5 font-medium text-amber-950 dark:text-amber-300"
                        autoFocus
                      />
                      <span className="text-[10px] text-slate-400">
                        This category will be automatically created in your database and shown on the website.
                      </span>
                    </div>
                  ) : (
                    <select
                      value={newItem.categoryId}
                      onChange={(e) => setNewItem({ ...newItem, categoryId: e.target.value })}
                      className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-medium text-slate-800 dark:text-slate-200"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                      <option value="custom">+ Create New Category...</option>
                    </select>
                  )}
                </div>

                {/* Upload or URL Tabs */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-1.5">
                    <label className="font-semibold text-slate-700 dark:text-slate-300">
                      Image Source *
                    </label>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setUploadTab("file")}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          uploadTab === "file"
                            ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Upload File
                      </button>
                      <button
                        type="button"
                        onClick={() => setUploadTab("url")}
                        className={`px-2 py-0.5 rounded cursor-pointer ${
                          uploadTab === "url"
                            ? "bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold"
                            : "text-slate-400 hover:text-slate-600"
                        }`}
                      >
                        Paste URL
                      </button>
                    </div>
                  </div>

                  {uploadTab === "file" ? (
                    <div className="space-y-2">
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/png, image/jpeg, image/webp, image/avif"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                      />

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                          isUploading
                            ? "border-amber-400 bg-amber-50/20"
                            : newItem.src
                            ? "border-emerald-400 bg-emerald-50/10"
                            : "border-slate-300 dark:border-slate-700 hover:border-amber-500 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                        }`}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-2 text-amber-600 dark:text-amber-400">
                            <Loader2 className="w-8 h-8 animate-spin" />
                            <span className="font-bold text-xs">{uploadProgress || "Uploading to Cloud..."}</span>
                          </div>
                        ) : newItem.src ? (
                          <div className="flex flex-col items-center gap-2 text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-8 h-8" />
                            <span className="font-bold text-xs">Image Uploaded Successfully!</span>
                            <span className="text-[10px] text-slate-400">Click to change photo</span>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <UploadCloud className="w-8 h-8 text-amber-500" />
                            <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                              Click or Drag & Drop photo from Phone / PC
                            </span>
                            <span className="text-[10px] text-slate-400">
                              Supports JPG, PNG, WEBP, AVIF (Max 10MB)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Preview Thumbnail if uploaded */}
                      {newItem.src && (
                        <div className="relative aspect-16/9 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100">
                          <img
                            src={newItem.src}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => setNewItem({ ...newItem, src: "" })}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <input
                        type="text"
                        required
                        value={newItem.src}
                        onChange={(e) => setNewItem({ ...newItem, src: e.target.value })}
                        placeholder="https://... or /images/gallery/..."
                        className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 text-xs font-mono"
                      />
                      <span className="text-[10px] text-slate-400">
                        Paste Supabase Storage CDN URL or local path.
                      </span>
                    </div>
                  )}
                </div>

                {/* Featured checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="featuredCheck"
                    checked={newItem.isFeatured}
                    onChange={(e) =>
                      setNewItem({ ...newItem, isFeatured: e.target.checked })
                    }
                    className="rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <label
                    htmlFor="featuredCheck"
                    className="text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                  >
                    Feature on website homepage portfolio
                  </label>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !newItem.src}
                    className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    Add to Gallery
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Create Custom Category Modal */}
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-3 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  Add Custom Category
                </h3>
                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4 text-xs">
                <div className="space-y-1.5">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Balcony Glazing, Villa Facades"
                    className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2.5 font-medium"
                    autoFocus
                  />
                  <span className="text-[10px] text-slate-400">
                    Will appear in filter pills on both Admin and Live Website.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsCategoryModalOpen(false)}
                    className="px-3.5 py-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingCategory || !newCategoryName.trim()}
                    className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5"
                  >
                    {isCreatingCategory && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                    Save Category
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
