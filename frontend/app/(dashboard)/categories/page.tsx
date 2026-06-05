"use client";

import { useState, type FormEvent } from "react";
import { useCategories, useCreateCategory } from "@/lib/hooks/useExpenses";
import { useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api/client";
import {
  Tag,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Zap,
  Music,
  Film,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Laptop,
  Dumbbell,
  type LucideIcon,
  Pencil,
  Trash2,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";

const DEFAULT_COLORS = [
  "#b5d8f7", // pastel blue
  "#b8e6b3", // pastel green
  "#fdfd96", // pastel yellow
  "#ffb6b9", // pastel pink
  "#e1ccfa", // pastel purple
  "#ffd1a9", // pastel orange
  "#06b6d4", // cyan
  "#84cc16", // lime
];

const ICON_OPTIONS = [
  "Tag",
  "ShoppingBag",
  "Utensils",
  "Car",
  "Home",
  "Briefcase",
  "Heart",
  "Zap",
  "Music",
  "Film",
  "Coffee",
  "Plane",
  "Gift",
  "Smartphone",
  "Laptop",
  "Dumbbell",
];

const ICON_MAP: Record<string, LucideIcon> = {
  Tag,
  ShoppingBag,
  Utensils,
  Car,
  Home,
  Briefcase,
  Heart,
  Zap,
  Music,
  Film,
  Coffee,
  Plane,
  Gift,
  Smartphone,
  Laptop,
  Dumbbell,
};

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();

  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(DEFAULT_COLORS[0]);
  const [newIcon, setNewIcon] = useState(ICON_OPTIONS[0]);
  const [formError, setFormError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editIcon, setEditIcon] = useState("");

  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);

  async function handleCreate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFormError(null);
    const name = newName.trim();
    if (!name) {
      setFormError("Category name is required.");
      return;
    }
    try {
      await createCategory.mutateAsync({ name, color: newColor, icon: newIcon });
      setNewName("");
      setNewColor(DEFAULT_COLORS[0]);
      setNewIcon(ICON_OPTIONS[0]);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create category.";
      setFormError(message);
    }
  }

  async function handleUpdate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (editingId === null) return;
    const name = editName.trim();
    if (!name) return;

    try {
      await apiClient.put(`/api/v1/categories/${editingId}`, {
        name,
        color: editColor,
        icon: editIcon,
      });
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditingId(null);
    } catch {
      setFormError("Failed to update category.");
    }
  }

  function startEditing(cat: {
    id: number;
    name: string;
    color: string;
    icon: string | null;
  }) {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditIcon(cat.icon || "Tag");
    setPendingDeleteId(null);
  }

  async function handleDelete(id: number) {
    if (pendingDeleteId !== id) {
      setPendingDeleteId(id);
      setEditingId(null);
      return;
    }
    setPendingDeleteId(null);
    setDeletingId(id);
    try {
      await apiClient.delete(`/api/v1/categories/${id}`);
      await queryClient.invalidateQueries({ queryKey: ["categories"] });
    } catch {
      setFormError("Failed to delete category.");
    } finally {
      setDeletingId(null);
    }
  }

  function IconPreview({
    name,
    className,
  }: {
    name: string;
    className?: string;
  }) {
    const Icon = ICON_MAP[name] || Tag;
    return <Icon className={className} strokeWidth={2.5} />;
  }

  return (
    <div className="max-w-4xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-black tracking-tight">
          Categories
        </h1>
        <p className="text-base font-bold text-gray-600 mt-1">
          Organise your expenses with colour-coded categories and icons
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Form */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-doodle border-doodle shadow-doodle p-6 sticky top-6">
            <h2 className="text-xl font-bold text-black mb-6 tracking-wide flex items-center gap-2">
              {editingId ? (
                <>
                  <Pencil className="w-5 h-5" /> Edit Category
                </>
              ) : (
                <>
                  <Tag className="w-5 h-5" /> Add Category
                </>
              )}
            </h2>

            <form
              onSubmit={editingId ? handleUpdate : handleCreate}
              noValidate
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="cat-name"
                  className="block text-sm font-bold text-black mb-1.5"
                >
                  Category Name
                </label>
                <input
                  id="cat-name"
                  type="text"
                  value={editingId ? editName : newName}
                  onChange={(e) =>
                    editingId
                      ? setEditName(e.target.value)
                      : setNewName(e.target.value)
                  }
                  placeholder="e.g. Food & Drink"
                  autoComplete="off"
                  className="w-full rounded-doodle border-doodle bg-white px-4 py-2.5 text-base font-sans shadow-doodle-sm focus:outline-none focus:border-black focus:ring-0 focus:bg-paper transition-all placeholder:text-gray-400"
                  disabled={createCategory.isPending}
                />
              </div>

              <div className="space-y-3">
                <label className="block text-sm font-bold text-black">
                  Colour & Icon
                </label>
                <div className="flex items-center gap-4">
                  <div
                    className="w-12 h-12 rounded-doodle border-2 border-black flex items-center justify-center shadow-doodle-sm shrink-0"
                    style={{ backgroundColor: editingId ? editColor : newColor }}
                  >
                    <IconPreview
                      name={editingId ? editIcon : newIcon}
                      className="w-6 h-6 text-black"
                    />
                  </div>
                  <input
                    type="color"
                    value={editingId ? editColor : newColor}
                    onChange={(e) =>
                      editingId
                        ? setEditColor(e.target.value)
                        : setNewColor(e.target.value)
                    }
                    className="h-10 w-16 rounded-doodle border-doodle shadow-doodle-sm cursor-pointer p-1 bg-white shrink-0"
                  />
                  <div className="flex flex-wrap gap-2">
                    {DEFAULT_COLORS.slice(0, 4).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() =>
                          editingId ? setEditColor(c) : setNewColor(c)
                        }
                        className={cn(
                          "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 shadow-doodle-sm",
                          (editingId ? editColor : newColor) === c
                            ? "border-black scale-110"
                            : "border-transparent"
                        )}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-4 gap-2.5 p-3 rounded-doodle border-doodle bg-paper shadow-doodle-sm">
                  {ICON_OPTIONS.map((iconName) => (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() =>
                        editingId ? setEditIcon(iconName) : setNewIcon(iconName)
                      }
                      className={cn(
                        "flex items-center justify-center p-2 rounded-doodle border-2 transition-all",
                        (editingId ? editIcon : newIcon) === iconName
                          ? "bg-white border-black shadow-doodle-sm translate-y-[-1px]"
                          : "bg-transparent border-transparent text-gray-500 hover:text-black"
                      )}
                      title={iconName}
                    >
                      <IconPreview
                        name={iconName}
                        className="w-5 h-5"
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={createCategory.isPending}
                  className={cn(
                    "w-full px-6 py-3 rounded-doodle text-lg font-bold text-black shadow-doodle border-doodle transition-all active:translate-y-[2px] active:shadow-none hover:translate-y-[-2px]",
                    editingId
                      ? "bg-pastel-yellow hover:bg-yellow-300"
                      : "bg-pastel-blue hover:bg-blue-300"
                  )}
                >
                  {editingId ? "Update Category" : "Add Category"}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="w-full px-6 py-2 rounded-doodle bg-white text-base font-bold text-gray-600 border-doodle hover:bg-paper transition-all"
                  >
                    Cancel Edit
                  </button>
                )}
              </div>
            </form>
            {formError && (
              <div className="mt-4 flex items-center gap-2 text-sm font-bold text-black px-4 py-3 bg-pastel-pink border-doodle rounded-doodle shadow-doodle-sm animate-in fade-in slide-in-from-top-2">
                <X className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-doodle border-doodle shadow-doodle overflow-hidden">
            {isLoading ? (
              <div className="divide-y-2 divide-black">
                {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-6 py-5"
                  >
                    <Skeleton className="w-12 h-12 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-32" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                    <Skeleton className="h-9 w-20" />
                  </div>
                ))}
              </div>
            ) : (categories ?? []).length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Tag className="w-12 h-12 text-gray-300 mx-auto mb-4" strokeWidth={1.5} />
                <p className="text-xl font-bold text-gray-500">No categories yet</p>
                <p className="text-sm text-gray-400 mt-1">Add your first one to get started!</p>
              </div>
            ) : (
              <ul className="divide-y-2 divide-black">
                {(categories ?? []).map((cat) => (
                  <li
                    key={cat.id}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 transition-colors group",
                      editingId === cat.id ? "bg-pastel-yellow/30" : "hover:bg-paper"
                    )}
                  >
                    <div
                      className="w-12 h-12 rounded-doodle border-2 border-black flex items-center justify-center shadow-doodle-sm flex-shrink-0 group-hover:scale-105 transition-transform"
                      style={{ backgroundColor: cat.color }}
                    >
                      <IconPreview
                        name={cat.icon || "Tag"}
                        className="w-6 h-6 text-black"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="block text-xl font-bold text-black tracking-wide truncate">
                        {cat.name}
                      </span>
                      <span className="text-xs font-bold text-gray-500 font-sans uppercase">
                        {cat.color}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {pendingDeleteId === cat.id ? (
                        <div className="flex items-center gap-2 bg-pastel-pink p-1 rounded-doodle border-2 border-black shadow-doodle-sm animate-in zoom-in-95">
                          <button
                            onClick={() => handleDelete(cat.id)}
                            disabled={deletingId === cat.id}
                            className="p-2 text-black hover:bg-red-200 rounded-doodle transition-colors"
                            title="Confirm Delete"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => setPendingDeleteId(null)}
                            className="p-2 text-black hover:bg-white rounded-doodle transition-colors"
                            title="Cancel"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditing(cat)}
                            className="p-2 text-gray-400 hover:text-black hover:bg-pastel-yellow rounded-doodle border-2 border-transparent hover:border-black transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(cat.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-pastel-pink rounded-doodle border-2 border-transparent hover:border-black transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
