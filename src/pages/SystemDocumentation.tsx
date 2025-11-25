import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";

const SystemDocumentation = () => {
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const lineHeight = 7;
    let y = 20;

    const addText = (text: string, fontSize = 11, isBold = false) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.setFontSize(fontSize);
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      const lines = doc.splitTextToSize(text, pageWidth - 2 * margin);
      doc.text(lines, margin, y);
      y += lines.length * lineHeight;
    };

    const addSection = (title: string) => {
      y += 5;
      addText(title, 14, true);
      y += 3;
    };

    // Title
    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text("Kulmid Event Management System", pageWidth / 2, y, { align: "center" });
    y += 15;

    // System Overview
    addSection("1. SYSTEM OVERVIEW");
    addText("Kulmid is a full-stack event management platform that enables users to discover events, organizers to create and manage events, and admins to oversee the entire platform.");
    y += 3;

    // Tech Stack
    addSection("2. TECHNOLOGY STACK");
    addText("Frontend:", 12, true);
    addText("• React 18 with TypeScript - Modern UI framework");
    addText("• Vite - Fast build tool and dev server");
    addText("• Tailwind CSS - Utility-first styling with custom design system");
    addText("• Shadcn/ui - Accessible component library");
    addText("• React Router DOM - Client-side routing");
    addText("• React Query (@tanstack/react-query) - Server state management");
    addText("• React Hook Form + Zod - Form handling and validation");
    addText("• Lucide React - Icon library");
    addText("• Recharts - Data visualization for analytics");
    y += 3;

    addText("Backend & Database:", 12, true);
    addText("• Supabase - PostgreSQL database with real-time capabilities");
    addText("• Supabase Auth - Authentication and user management");
    addText("• Supabase Edge Functions (Deno) - Serverless backend functions");
    addText("• Row Level Security (RLS) - Database-level authorization");
    y += 3;

    addText("Email & Communication:", 12, true);
    addText("• Resend - Transactional email service");
    addText("• Custom email templates with HTML/CSS");
    y += 3;

    addText("QR Code System:", 12, true);
    addText("• qrcode library - QR code generation");
    addText("• html5-qrcode - QR code scanning");
    y += 3;

    // Authorization System
    addSection("3. AUTHORIZATION SYSTEM");
    addText("User Roles:", 12, true);
    addText("• User - Can browse events, register, manage favorites");
    addText("• Organizer - Can create events, manage registrations, check-in attendees");
    addText("• Admin - Full platform control, approve/reject events, manage users");
    y += 3;

    addText("Database Implementation:", 12, true);
    addText("• user_roles table stores role assignments");
    addText("• has_role(user_id, role) PostgreSQL function for role checking");
    addText("• RLS policies enforce permissions at database level");
    addText("• Admin role requires specific email domains (admin@kulmid.com, admin@eventease.com)");
    y += 3;

    addText("Frontend Implementation:", 12, true);
    addText("• AuthContext.tsx - Manages authentication state and user role");
    addText("• ProtectedRoute.tsx - Guards routes requiring authentication");
    addText("• Role-based UI rendering (admin dashboard, organizer tools)");
    y += 3;

    // Event Flow
    addSection("4. EVENT REGISTRATION & EMAIL FLOW");
    addText("4.1 User Registration Flow:", 12, true);
    addText("1. User discovers event on platform");
    addText("2. Clicks 'Register' button");
    addText("3. Fills multi-step registration wizard (basic info, professional details, interests, preferences)");
    addText("4. System creates guest record in event_guests table with status='pending'");
    addText("5. Edge function 'send-registration-confirmation' sends confirmation email to user");
    addText("6. Edge function 'send-registration-notification' notifies organizer");
    addText("7. Organizer reviews registration in EventBuilderGuests tab");
    addText("8. Organizer approves/rejects via UI buttons");
    addText("9. Edge function 'handle-registration-action' processes approval/rejection");
    addText("10. User receives final status email with QR code (if approved)");
    y += 3;

    addText("4.2 Organizer Invitation Flow:", 12, true);
    addText("1. Organizer opens 'Guests' tab in event builder");
    addText("2. Clicks 'Invite Guests' button");
    addText("3. Enters email addresses and optional custom message");
    addText("4. System creates records in event_invitations table");
    addText("5. Edge function 'send-event-invitation' sends emails");
    addText("6. Each invitation includes event details and registration link");
    addText("7. Recipients can register directly via link");
    y += 3;

    // QR Check-in
    addSection("5. QR CODE CHECK-IN SYSTEM");
    addText("QR Code Generation:", 12, true);
    addText("• Unique check_in_token generated for each approved registration");
    addText("• Token stored in event_guests.check_in_token column");
    addText("• QR code embedded in approval email");
    addText("• QR code contains: event_id + guest_id + check_in_token");
    y += 3;

    addText("QR Code Scanning:", 12, true);
    addText("• Route: /event/:eventId/scanner");
    addText("• Only accessible by event organizer");
    addText("• Uses html5-qrcode library for camera access");
    addText("• Scans QR code and extracts token");
    addText("• Calls 'verify-check-in' edge function");
    addText("• Updates event_guests: checked_in=true, checked_in_at=now(), checked_in_by=organizer_id");
    addText("• Shows success/error toast feedback");
    y += 3;

    // Database Schema
    addSection("6. DATABASE SCHEMA");
    addText("events table:", 12, true);
    addText("• Stores all event details (title, date, location, category, price)");
    addText("• status field: draft, pending, approved, upcoming, ongoing, past, rejected");
    addText("• created_by links to user who created event");
    addText("• auto_approve_registrations boolean for instant approvals");
    y += 3;

    addText("event_guests table:", 12, true);
    addText("• Stores all registrations and invitations");
    addText("• status: invited, pending, approved, rejected, confirmed, cancelled");
    addText("• registration_type: registration or invitation");
    addText("• check_in_token for QR code verification");
    addText("• Extensive fields for attendee information");
    y += 3;

    addText("event_invitations table:", 12, true);
    addText("• Tracks invitation history");
    addText("• custom_title and custom_message for personalized emails");
    addText("• status: sent, delivered, failed");
    y += 3;

    addText("user_roles table:", 12, true);
    addText("• Maps users to roles (admin, organizer, user)");
    addText("• Email field for admin verification");
    y += 3;

    addText("profiles table:", 12, true);
    addText("• User profile information (full_name)");
    y += 3;

    addText("user_favorites table:", 12, true);
    addText("• User's saved events");
    y += 3;

    addText("user_preferences table:", 12, true);
    addText("• User preferences for event recommendations");
    y += 3;

    // Edge Functions
    addSection("7. EDGE FUNCTIONS");
    addText("send-registration-confirmation:", 12, true);
    addText("• Sends confirmation email when user registers");
    addText("• Triggered after registration submission");
    y += 2;

    addText("send-registration-notification:", 12, true);
    addText("• Notifies organizer of new registration");
    addText("• Includes attendee details");
    y += 2;

    addText("handle-registration-action:", 12, true);
    addText("• Processes approval/rejection actions");
    addText("• Updates guest status");
    addText("• Sends email with QR code (approval) or rejection notice");
    y += 2;

    addText("send-event-invitation:", 12, true);
    addText("• Sends invitation emails to guests");
    addText("• Supports custom titles and messages");
    addText("• Creates invitation records");
    y += 2;

    addText("verify-check-in:", 12, true);
    addText("• Verifies QR code tokens");
    addText("• Updates check-in status");
    addText("• Returns success/error status");
    y += 3;

    // Route Protection
    addSection("8. ROUTE PROTECTION");
    addText("Public Routes:", 12, true);
    addText("• / (Home), /events, /event/:id, /discover, /calendar, /about, /contact");
    y += 2;

    addText("Authenticated Routes:", 12, true);
    addText("• /dashboard, /my-events, /favorites, /create, /event/:id/builder/*");
    y += 2;

    addText("Admin-Only Routes:", 12, true);
    addText("• /admin/*, /admin/analytics, /admin/settings, /admin/users");
    y += 2;

    addText("Organizer Routes:", 12, true);
    addText("• /event/:id/scanner (only if user created the event)");
    y += 3;

    // Key Features
    addSection("9. KEY FEATURES");
    addText("• Multi-step registration wizard with validation");
    addText("• Real-time event search and filtering");
    addText("• Event calendar view with date navigation");
    addText("• Favorites system with persistent storage");
    addText("• Admin analytics dashboard with charts");
    addText("• QR code-based check-in system");
    addText("• Email notifications at every step");
    addText("• Event approval workflow for admins");
    addText("• Auto-approval option for organizers");
    addText("• Responsive design for mobile and desktop");

    // Save PDF
    doc.save("Kulmid-System-Documentation.pdf");
    toast.success("PDF downloaded successfully!");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            System Documentation
          </CardTitle>
          <CardDescription>
            Download comprehensive documentation about the Kulmid Event Management System
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="prose dark:prose-invert max-w-none">
            <h3>What's Included</h3>
            <ul>
              <li><strong>System Overview</strong> - Platform purpose and capabilities</li>
              <li><strong>Technology Stack</strong> - Complete list of frameworks, libraries, and tools</li>
              <li><strong>Authorization System</strong> - User roles, permissions, and RLS policies</li>
              <li><strong>Event Registration Flow</strong> - Step-by-step process from discovery to approval</li>
              <li><strong>Email System</strong> - Invitation and notification workflows</li>
              <li><strong>QR Check-in System</strong> - Generation, scanning, and verification process</li>
              <li><strong>Database Schema</strong> - All tables, columns, and relationships</li>
              <li><strong>Edge Functions</strong> - Backend serverless functions and their purposes</li>
              <li><strong>Route Protection</strong> - Public, authenticated, and role-based routes</li>
              <li><strong>Key Features</strong> - Comprehensive feature list</li>
            </ul>
          </div>

          <div className="flex gap-4">
            <Button onClick={generatePDF} size="lg" className="gap-2">
              <Download className="h-5 w-5" />
              Download PDF Documentation
            </Button>
          </div>

          <div className="mt-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              This documentation is generated for presentation purposes to explain the system architecture,
              technology choices, and workflows to team members or stakeholders.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDocumentation;
