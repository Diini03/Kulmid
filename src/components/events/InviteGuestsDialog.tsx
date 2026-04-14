import { useState, useRef, useCallback } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, X, FileSpreadsheet, Upload, Download, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { parseEmailsFromCSV, generateCSVTemplate } from "@/lib/csvParser";

interface InviteGuestsDialogProps {
  eventId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const InviteGuestsDialog = ({ eventId, open, onOpenChange, onSuccess }: InviteGuestsDialogProps) => {
  const { toast } = useToast();
  const [emails, setEmails] = useState<string[]>([]);
  const [emailInput, setEmailInput] = useState("");
  const [customTitle, setCustomTitle] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingCSV, setIsProcessingCSV] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addEmail = () => {
    const email = emailInput.trim().toLowerCase();
    if (!email) return;

    if (!email.includes("@")) {
      toast({
        title: "Invalid Email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    if (emails.includes(email)) {
      toast({
        title: "Duplicate Email",
        description: "This email is already in the list",
        variant: "destructive",
      });
      return;
    }

    setEmails([...emails, email]);
    setEmailInput("");
  };

  const removeEmail = (email: string) => {
    setEmails(emails.filter((e) => e !== email));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addEmail();
    }
  };

  const processCSVFile = useCallback(async (file: File) => {
    setIsProcessingCSV(true);
    
    try {
      const result = await parseEmailsFromCSV(file);
      
      if (result.error) {
        toast({
          title: "Import Error",
          description: result.error,
          variant: "destructive",
        });
        return;
      }

      // Filter out emails that already exist in the list
      const newEmails = result.emails.filter((email) => !emails.includes(email));
      const duplicateCount = result.emails.length - newEmails.length;

      if (newEmails.length === 0) {
        toast({
          title: "No New Emails",
          description: duplicateCount > 0 
            ? "All emails from the CSV are already in your list" 
            : "No valid emails found in the CSV",
          variant: "destructive",
        });
        return;
      }

      setEmails([...emails, ...newEmails]);

      let description = `Added ${newEmails.length} email${newEmails.length !== 1 ? 's' : ''}`;
      if (result.skippedCount > 0) {
        description += `, skipped ${result.skippedCount} invalid`;
      }
      if (duplicateCount > 0) {
        description += `, ${duplicateCount} duplicate${duplicateCount !== 1 ? 's' : ''} ignored`;
      }

      toast({
        title: "CSV Imported",
        description,
      });
    } finally {
      setIsProcessingCSV(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [emails, toast]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processCSVFile(files[0]);
    }
  }, [processCSVFile]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processCSVFile(files[0]);
    }
  };

  const handleSend = async () => {
    if (emails.length === 0) {
      toast({
        title: "No Recipients",
        description: "Please add at least one email address",
        variant: "destructive",
      });
      return;
    }

    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-event-invitation', {
        body: {
          eventId,
          emails,
          customTitle: customTitle || undefined,
          customMessage: customMessage || undefined,
        },
      });

      if (error) throw error;

      toast({
        title: "Invitations Sent",
        description: `${emails.length} invitation(s) sent successfully`,
      });

      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setEmails([]);
      setEmailInput("");
      setCustomTitle("");
      setCustomMessage("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitations",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Invite Guests</DialogTitle>
          <DialogDescription>
            Send personalized email invitations to your guests
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="emails">Email Addresses</Label>
            <div className="flex gap-2">
              <Input
                id="emails"
                type="email"
                placeholder="guest@example.com"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={addEmail} variant="secondary">
                Add
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Press Enter or click Add after each email
            </p>
          </div>

          {emails.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {emails.map((email) => (
                <Badge key={email} variant="secondary" className="pl-3 pr-1">
                  {email}
                  <button
                    onClick={() => removeEmail(email)}
                    className="ml-2 hover:bg-secondary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          {/* CSV Import Section */}
          <div className="space-y-2">
            <Label>Import from CSV</Label>
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                transition-colors duration-200
                ${isDragging 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50'
                }
                ${isProcessingCSV ? 'pointer-events-none opacity-60' : ''}
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {isProcessingCSV ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  <p className="text-sm text-muted-foreground">Processing CSV...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <div className="p-3 bg-muted rounded-full">
                    <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Import CSV File</p>
                    <p className="text-xs text-muted-foreground">
                      Drop file here or click to browse
                    </p>
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                generateCSVTemplate();
              }}
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              <Download className="h-3 w-3" />
              Download CSV Template
            </button>
          </div>

          <div>
            <Label htmlFor="customTitle">Custom Email Title (Optional)</Label>
            <Input
              id="customTitle"
              placeholder="Join us for an amazing event!"
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="customMessage">Custom Message (Optional)</Label>
            <Textarea
              id="customMessage"
              placeholder="Add a personal message to your invitation..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={4}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSend} disabled={sending || emails.length === 0}>
              <Mail className="h-4 w-4 mr-2" />
              {sending ? "Sending..." : `Send ${emails.length} Invitation${emails.length !== 1 ? "s" : ""}`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InviteGuestsDialog;
