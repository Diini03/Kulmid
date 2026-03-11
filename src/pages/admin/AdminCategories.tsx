import { AdminLayout } from "@/components/admin/AdminLayout";
import { Seo } from "@/components/Seo";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
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
import { Plus, Pencil, Trash2, GripVertical, GraduationCap, Wrench, Users, Music, Monitor, Handshake } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { LucideIcon } from "lucide-react";

interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  active: boolean;
}

const ICON_MAP: Record<string, LucideIcon> = {
  GraduationCap, Wrench, Users, Music, Monitor, Handshake,
};

const ICON_OPTIONS = Object.keys(ICON_MAP);

const DEFAULT_CATEGORIES: Category[] = [
  { id: "1", name: "Seminar", icon: "GraduationCap", description: "Educational talks and presentations", active: true },
  { id: "2", name: "Workshop", icon: "Wrench", description: "Hands-on learning experiences", active: true },
  { id: "3", name: "Conference", icon: "Users", description: "Professional networking events", active: true },
  { id: "4", name: "Festival", icon: "Music", description: "Cultural celebrations and entertainment", active: true },
  { id: "5", name: "Webinar", icon: "Monitor", description: "Online educational sessions", active: true },
  { id: "6", name: "Meetup", icon: "Handshake", description: "Casual gatherings and community networking", active: true },
];

const AdminCategories = () => {
  const { isAdmin, loading, adminCheckComplete } = useAuth();
  const { toast } = useToast();
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [editCategory, setEditCategory] = useState<Category | null>(null);
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [form, setForm] = useState({ name: "", icon: "GraduationCap", description: "", active: true });

  if (loading || !adminCheckComplete) return <AdminLayout><div className="py-20 text-center text-muted-foreground">Loading...</div></AdminLayout>;
  if (!isAdmin) return <Navigate to="/" replace />;

  const openCreate = () => {
    setForm({ name: "", icon: "GraduationCap", description: "", active: true });
    setIsCreating(true);
    setEditCategory(null);
  };

  const openEdit = (cat: Category) => {
    setForm({ name: cat.name, icon: cat.icon, description: cat.description, active: cat.active });
    setEditCategory(cat);
    setIsCreating(false);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: "Name is required", variant: "destructive" });
      return;
    }

    if (isCreating) {
      const newCat: Category = {
        id: Date.now().toString(),
        name: form.name.trim(),
        icon: form.icon,
        description: form.description.trim(),
        active: form.active,
      };
      setCategories([...categories, newCat]);
      toast({ title: "Category created" });
    } else if (editCategory) {
      setCategories(categories.map(c => c.id === editCategory.id ? { ...c, ...form, name: form.name.trim(), description: form.description.trim() } : c));
      toast({ title: "Category updated" });
    }
    setEditCategory(null);
    setIsCreating(false);
  };

  const handleDelete = () => {
    if (!deleteCategory) return;
    setCategories(categories.filter(c => c.id !== deleteCategory.id));
    toast({ title: "Category deleted" });
    setDeleteCategory(null);
  };

  const toggleActive = (id: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, active: !c.active } : c));
  };

  const dialogOpen = isCreating || !!editCategory;

  return (
    <AdminLayout>
      <Seo title="Categories" canonical="/admin/categories" />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="text-sm text-muted-foreground mt-1">Manage event classification</p>
          </div>
          <Button onClick={openCreate} size="sm">
            <Plus className="h-4 w-4 mr-2" />Add Category
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((cat) => {
            const IconComp = ICON_MAP[cat.icon] || GraduationCap;
            return (
              <Card key={cat.id} className={`border transition-opacity ${!cat.active ? "opacity-50" : ""}`}>
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <IconComp className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{cat.name}</h3>
                        <Badge variant={cat.active ? "default" : "secondary"} className="text-[10px] mt-0.5">
                          {cat.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground">{cat.description}</p>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" className="h-7 text-xs flex-1" onClick={() => openEdit(cat)}>
                      <Pencil className="h-3 w-3 mr-1" />Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => setDeleteCategory(cat)}>
                      <Trash2 className="h-3 w-3 mr-1" />Delete
                    </Button>
                    <Switch
                      checked={cat.active}
                      onCheckedChange={() => toggleActive(cat.id)}
                      className="ml-auto"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => { if (!open) { setEditCategory(null); setIsCreating(false); } }}>
        <DialogContent>
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
              <div className="flex gap-2 mt-1.5 flex-wrap">
                {ICON_OPTIONS.map((iconName) => {
                  const IC = ICON_MAP[iconName];
                  return (
                    <button
                      key={iconName}
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
              <Label>Description</Label>
              <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="mt-1.5" placeholder="Brief description..." rows={2} />
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={form.active} onCheckedChange={(v) => setForm({ ...form, active: v })} />
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <Button variant="outline" onClick={() => { setEditCategory(null); setIsCreating(false); }}>Cancel</Button>
              <Button onClick={handleSave}>{isCreating ? "Create" : "Save Changes"}</Button>
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
    </AdminLayout>
  );
};

export default AdminCategories;
