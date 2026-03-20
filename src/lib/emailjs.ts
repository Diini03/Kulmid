import emailjs from "@emailjs/browser";

// ============================================
// EMAILJS CONFIGURATION - UPDATE THESE VALUES
// ============================================
// Get these from: https://dashboard.emailjs.com
// 
// 1. Public Key: Account → API Keys
// 2. Service ID: Email Services → Your Gmail service
// 3. Template IDs: Email Templates → Each template's ID

export const EMAILJS_CONFIG = {
  PUBLIC_KEY: "IQug-xDFX_vKkhdzU",
  SERVICE_ID: "service_70j49nh",
  TEMPLATES: {
    EVENT_INVITATION: "template_mpuq27g",
    REGISTRATION_CONFIRMED: "template_ckt9y2f",
    // Free plan limit: Only 2 templates available
    REGISTRATION_PENDING: null as string | null,
    REGISTRATION_REJECTED: null as string | null,
    ORGANIZER_NOTIFICATION: null as string | null,
  },
};

// Initialize EmailJS
let initialized = false;
export const initEmailJS = () => {
  if (!initialized && EMAILJS_CONFIG.PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    initialized = true;
  }
};

// Generate a unique check-in token (cryptographically secure)
export const generateCheckInToken = (): string => {
  return crypto.randomUUID();
};

// Generate QR code URL from a check-in token
export const generateQRCodeUrl = (checkInToken: string): string => {
  const checkInUrl = `https://kulmid.lovable.app/check-in/${checkInToken}`;
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(checkInUrl)}`;
};

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

interface SendInvitationParams {
  toEmail: string;
  toName?: string;
  eventTitle: string;
  eventDate: string;
  eventTime?: string;
  eventLocation: string;
  organizerName?: string;
  customTitle?: string;
  customMessage?: string;
  eventId: string;
  checkInToken?: string;
}

export const sendEventInvitation = async (params: SendInvitationParams): Promise<boolean> => {
  initEmailJS();
  
  try {
    const token = params.checkInToken || generateCheckInToken();
    const qrCodeUrl = generateQRCodeUrl(token);
    const eventUrl = `${window.location.origin}/events/${params.eventId}`;
    
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.EVENT_INVITATION,
      {
        to_email: params.toEmail,
        to_name: params.toName || "Guest",
        event_title: params.eventTitle,
        event_date: params.eventDate,
        event_time: params.eventTime || "",
        event_location: params.eventLocation,
        organizer_name: params.organizerName || "Event Organizer",
        custom_title: params.customTitle || `You're invited to ${params.eventTitle}`,
        invitation_message: params.customMessage || "You've been personally invited to join this event. We'd love to see you there!",
        qr_code: qrCodeUrl,
        event_url: eventUrl,
        support_email: "kulmid@gmail.com",
      }
    );
    return true;
  } catch (error) {
    console.error("Failed to send invitation:", error);
    return false;
  }
};

interface SendRegistrationEmailParams {
  toEmail: string;
  toName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  status: "registered" | "pending" | "rejected";
  guestId?: string;
  eventId: string;
  rejectionReason?: string;
  checkInToken?: string;
}

export const sendRegistrationEmail = async (params: SendRegistrationEmailParams): Promise<boolean> => {
  initEmailJS();
  
  try {
    // Only send email for confirmed registrations (2 template limit on free plan)
    if (params.status === "registered") {
      const templateId = EMAILJS_CONFIG.TEMPLATES.REGISTRATION_CONFIRMED;
      if (!templateId) {
        console.log("Registration confirmed template not configured");
        return true;
      }
      
      // Use provided token (already saved to DB) or generate fallback
      const checkInToken = params.checkInToken || generateCheckInToken();
      const qrCodeUrl = generateQRCodeUrl(checkInToken);
      
      await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, {
        to_email: params.toEmail,
        to_name: params.toName,
        event_title: params.eventTitle,
        event_date: params.eventDate,
        event_location: params.eventLocation,
        qr_code_url: qrCodeUrl,
        check_in_token: checkInToken,
      });
      return true;
    }
    
    // For pending/rejected: skip email (handled by UI toast)
    console.log(`Skipping email for status "${params.status}" - no template available`);
    return true;
  } catch (error) {
    console.error("Failed to send registration email:", error);
    return false;
  }
};

interface SendOrganizerNotificationParams {
  organizerEmail: string;
  guestName: string;
  guestEmail: string;
  eventTitle: string;
}

export const sendOrganizerNotification = async (params: SendOrganizerNotificationParams): Promise<boolean> => {
  // Skip organizer notification - no template available on free plan
  // Organizers can see registrations in their dashboard
  console.log(`Organizer notification skipped for ${params.eventTitle} - organizer will see in dashboard`);
  return true;
};

// Check if EmailJS is configured
export const isEmailJSConfigured = (): boolean => {
  return (
    EMAILJS_CONFIG.PUBLIC_KEY !== "YOUR_PUBLIC_KEY" &&
    EMAILJS_CONFIG.SERVICE_ID !== "YOUR_SERVICE_ID"
  );
};
