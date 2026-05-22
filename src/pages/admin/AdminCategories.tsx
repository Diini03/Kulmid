import { Seo } from "@/components/Seo";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllCategories, ICON_MAP, type DBCategory } from "@/hooks/useCategories";
import { Skeleton } from "@/components/ui/skeleton";

const ICON_OPTIONS = Object.keys(ICON_MAP);

const COLOR_OPTIONS = [
  { label: "Teal", value: "from-teal-500 to-emerald-500" },
  { label: "Blue", value: "from-blue-500 to-cyan-500" },
  { label: "Purple", value: "from-purple-500 to-pink-500" },
  { label: "Orange", value: "from-orange-500 to-red-500" },
  { label: "Indigo", value: "from-indigo-500 to-violet-500" },
  { label: "Green", value: "from-green-500 to-teal-500" },
  { label: "Amber", value: "from-amber-500 to-yellow-500" },
  { label: "Rose", value: "from-rose-500 to-pink-500" },
];

const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const AdminCategories = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: categories = [], isLoading } = useAllCategories();
  const [editCategory, setEditCategory] = useState<DBCategory | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<DBCategory | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    icon: "GraduationCap",
    color: COLOR_OPTIONS[0].value,
    description: "",
    active: true,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["categories"] });
  };

  const openCreate = () => {
    setForm({ name: "", icon: "GraduationCap", color: COLOR_OPTIONS[0].value, description: "", active: true });
    setIsCreating(true);
    setEditCategory(null);
  };

  const openEdit = (cat: DBCategory) => {
    setForm({
      name: cat.name,
      icon: cat.icon,
      color: cat.color,
      description: cat.description || "",
      active: cat.is_active,
    });
    setEditCategory(cat);
    setIsCreating(false);
  };

  const handleSave = async () => {
    const name = form.name.trim();
    if (!name) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (isCreating) {
        const sort_order = categories.length;
        const { error } = await supabase.from("categories").insert({
          name,
          slug: slugify(name),
          icon: form.icon,
          color: form.color,
          description: form.description.trim() || null,
          is_active: form.active,
          sort_order,
        });
        if (error) throw error;
        toast({ title: "Category created" });
      } else if (editCategory) {
        const { error } = await supabase
          .from("categories")
          .update({
            name,
            slug: slugify(name),
            icon: form.icon,
            color: form.color,
            description: form.description.trim() || null,
            is_active: form.active,
          })
          .eq("id", editCategory.id);
        if (error) throw error;
        toast({ title: "Category updated" });
      }
      invalidate();
      setEditCategory(null);
      setIsCreating(false);
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCategory) return;
    try {
      const { error } = await supabase.from("categories").delete().eq("id", deleteCategory.id);
      if (error) throw error;
      toast({ title: "Category deleted" });
      invalidate();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e.message, variant: "destructive" });
    } finally {
      setDeleteCategory(null);
    }
  };

  const toggleActive = async (cat: DBCategory) => {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !cat.is_active })
      .eq("id", cat.id);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    invalidate();
  };

  const dialogOpen = isCreating || !!editCategory;

  return (
    <>
      <Seo title="Categories" canonical="/admin/categories" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add, edit, or hide categories. Changes apply across Discover, Create, and analytics instantly.
            </p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />Add Category
          </Button>
        </div>

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center space-y-3">
              <p className="text-muted-foreground">No categories yet.</p>
              <Button onClick={openCreate}>
                <Plus className="h-4 w-4 mr-2" /> Add your first category
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => {
              const IconComp = ICON_MAP[cat.icon] || ICON_MAP.GraduationCap;
              return (
                <Card key={cat.id} className={`border transition-opacity ${!cat.is_active ? "opacity-50" : ""}`}>
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${cat.color} flex items-center justify-center`}>
                          <IconComp className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{cat.name}</h3>
                          <Badge variant={cat.is_active ? "default" : "secondary"} className="text-[10px] mt-0.5">
                            {cat.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    {cat.description && <p className="text-xs text-muted-foreground">{cat.description}</p>}
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => openEdit(cat)}>
                        <Pencil className="h-3 w-3 mr-1" />Edit
                      </Button>
                      <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteCategory(cat)}>
                        <Trash2 className="h-3 w-3 mr-1" />Delete
                      </Button>
                      <Switch
                        checked={cat.is_active}
                        onCheckedChange={() => toggleActive(cat)}
                        className="ml-auto"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditCategory(null); setIsCreating(false); } }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isCreating ? "Create Category" : "Edit Category"}</DialogTitle>
            <DialogDescription>{isCreating ? "Add a new event category" : `Editing "${editCategory?.name}"`}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1.5" placeholder="e.g. Hackathon" />
            </div>
            <div>
              <Label>Icon</Label>
              <div className="grid grid-cols-8 gap-2 mt-1.5">
                {ICON_OPTIONS.map((iconName) => {
                  const IC = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
                      type="button"
                      onClick={() => setForm({ ...form, icon: iconName })}
                      className={`h-10 w-10 rounded-lg border flex items-center justify-center transition-colors ${
                        form.icon === iconName ? "bg-primary text-primary-foreground border-primary" : "bg-muted/50 hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      <IC className="h-4 w-4" />
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <Label>Color</Label>
              <div className="grid grid-cols-4 gap-2 mt-1.5">
                {COLOR_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setForm({ ...form, color: c.value })}
                    className={`h-10 rounded-lg bg-gradient-to-br ${c.value} text-white text-xs font-medium border-2 ${
                      form.color === c.value ? "border-foreground" : "border-transparent"
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" placeholder="Brief description..." rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setEditCategory(null); setIsCreating(false); }} disabled={saving}>Cancel</Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isCreating ? "Create" : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>Delete "{deleteCategory?.name}"? Events using this category won't be affected.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminCategories;
