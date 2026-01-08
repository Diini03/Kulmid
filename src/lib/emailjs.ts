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
  PUBLIC_KEY: "YOUR_PUBLIC_KEY", // Replace with your EmailJS public key
  SERVICE_ID: "YOUR_SERVICE_ID", // Replace with your EmailJS service ID
  TEMPLATES: {
    EVENT_INVITATION: "YOUR_INVITATION_TEMPLATE_ID",
    REGISTRATION_CONFIRMED: "YOUR_CONFIRMED_TEMPLATE_ID",
    REGISTRATION_PENDING: "YOUR_PENDING_TEMPLATE_ID",
    REGISTRATION_REJECTED: "YOUR_REJECTED_TEMPLATE_ID",
    ORGANIZER_NOTIFICATION: "YOUR_ORGANIZER_TEMPLATE_ID",
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

// Generate a unique check-in token
export const generateCheckInToken = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

// Generate QR code URL using a free API
export const generateQRCodeUrl = (data: string): string => {
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(data)}`;
};

// ============================================
// EMAIL SENDING FUNCTIONS
// ============================================

interface SendInvitationParams {
  toEmail: string;
  toName?: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  customTitle?: string;
  customMessage?: string;
  eventId: string;
}

export const sendEventInvitation = async (params: SendInvitationParams): Promise<boolean> => {
  initEmailJS();
  
  try {
    const checkInToken = generateCheckInToken();
    const qrCodeUrl = generateQRCodeUrl(`${window.location.origin}/check-in/${params.eventId}/${checkInToken}`);
    
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.EVENT_INVITATION,
      {
        to_email: params.toEmail,
        to_name: params.toName || "Guest",
        event_title: params.eventTitle,
        event_date: params.eventDate,
        event_location: params.eventLocation,
        custom_title: params.customTitle || `You're Invited to ${params.eventTitle}`,
        custom_message: params.customMessage || "",
        qr_code_url: qrCodeUrl,
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
}

export const sendRegistrationEmail = async (params: SendRegistrationEmailParams): Promise<boolean> => {
  initEmailJS();
  
  try {
    let templateId: string;
    let templateParams: Record<string, string> = {
      to_email: params.toEmail,
      to_name: params.toName,
      event_title: params.eventTitle,
      event_date: params.eventDate,
      event_location: params.eventLocation,
    };

    if (params.status === "registered") {
      templateId = EMAILJS_CONFIG.TEMPLATES.REGISTRATION_CONFIRMED;
      // Generate QR code for confirmed registrations
      const checkInToken = generateCheckInToken();
      const qrCodeUrl = generateQRCodeUrl(`${window.location.origin}/check-in/${params.eventId}/${checkInToken}`);
      templateParams.qr_code_url = qrCodeUrl;
      templateParams.check_in_token = checkInToken;
    } else if (params.status === "rejected") {
      templateId = EMAILJS_CONFIG.TEMPLATES.REGISTRATION_REJECTED;
      templateParams.rejection_reason = params.rejectionReason || "Unfortunately, we cannot accommodate your registration at this time.";
    } else {
      templateId = EMAILJS_CONFIG.TEMPLATES.REGISTRATION_PENDING;
    }

    await emailjs.send(EMAILJS_CONFIG.SERVICE_ID, templateId, templateParams);
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
  initEmailJS();
  
  try {
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATES.ORGANIZER_NOTIFICATION,
      {
        to_email: params.organizerEmail,
        guest_name: params.guestName,
        guest_email: params.guestEmail,
        event_title: params.eventTitle,
      }
    );
    return true;
  } catch (error) {
    console.error("Failed to send organizer notification:", error);
    return false;
  }
};

// Check if EmailJS is configured
export const isEmailJSConfigured = (): boolean => {
  return (
    EMAILJS_CONFIG.PUBLIC_KEY !== "YOUR_PUBLIC_KEY" &&
    EMAILJS_CONFIG.SERVICE_ID !== "YOUR_SERVICE_ID"
  );
};
