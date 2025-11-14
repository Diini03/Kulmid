import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Pencil, Trash2 } from "lucide-react";
import { EventForm } from "./EventForm";

interface EventsTableProps {
  events: any[];
  onUpdate: () => void;
}

export const EventsTable = ({ events, onUpdate }: EventsTableProps) => {
  const { toast } = useToast();
  const [editEvent, setEditEvent] = useState<any>(null);
  const [deleteEvent, setDeleteEvent] = useState<any>(null);

  const handleDelete = async () => {
    if (!deleteEvent) return;

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', deleteEvent.id);

      if (error) throw error;

      toast({
        title: "Event deleted",
        description: "The event has been deleted successfully.",
      });

      onUpdate();
      setDeleteEvent(null);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="font-semibold">Title</TableHead>
            <TableHead className="font-semibold">Date</TableHead>
            <TableHead className="font-semibold">Location</TableHead>
            <TableHead className="font-semibold">Category</TableHead>
            <TableHead className="font-semibold">Created By</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Price</TableHead>
            <TableHead className="text-right font-semibold">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id} className="hover:bg-muted/50">
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>
                {new Date(event.date).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </TableCell>
              <TableCell>{event.location}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {event.category}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">
                    {event.creator?.full_name || "Unknown User"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={
                    event.status === 'past' ? 'destructive' : 
                    event.status === 'ongoing' ? 'default' : 
                    'outline'
                  }
                  className="capitalize"
                >
                  {event.status}
                </Badge>
              </TableCell>
              <TableCell className="font-semibold">
                {event.price === 0 ? 'Free' : `$${event.price}`}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setEditEvent(event)}
                    className="hover:bg-primary/10 hover:text-primary"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteEvent(event)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={!!editEvent} onOpenChange={(open) => !open && setEditEvent(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Event</DialogTitle>
          </DialogHeader>
          {editEvent && (
            <EventForm
              event={editEvent}
              onSuccess={() => {
                setEditEvent(null);
                onUpdate();
              }}
              onCancel={() => setEditEvent(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteEvent} onOpenChange={(open) => !open && setDeleteEvent(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteEvent?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};