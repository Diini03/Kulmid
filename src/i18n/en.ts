export const en = {
  // Navbar
  nav_events: "Events",
  nav_discover: "Discover",
  nav_create_event: "Create Event",
  nav_sign_in: "Sign In",
  nav_sign_up: "Sign Up",
  nav_my_profile: "My Profile",
  nav_my_events: "My Events",
  nav_admin: "Admin",
  nav_settings: "Settings",
  nav_sign_out: "Sign Out",
  nav_menu: "Menu",
  nav_search: "Search",
  nav_notifications: "Notifications",
  nav_theme: "Theme",
  nav_light_mode: "Light Mode",
  nav_dark_mode: "Dark Mode",
  nav_language: "Language",

  // Welcome / Hero
  hero_title_1: "Create and",
  hero_title_2: "discover",
  hero_title_3: "events.",
  hero_subtitle: "Create, manage, and discover events all in one place.",
  hero_browse_events: "Browse Events",
  hero_create_first: "Create Your First Event",

  // Discover
  discover_title: "Discover events",
  discover_subtitle: "Explore experiences that inspire you",
  discover_personalized: "Personalized for you",
  discover_view_matched: "View {count} matched events",
  discover_view_recommendations: "View personalized recommendations",
  discover_set_preferences: "Set your preferences for personalized events",
  discover_browse_category: "Browse by category",
  discover_featured: "Featured events",
  discover_all_events: "All events",
  discover_recommended: "Recommended for you",
  discover_trending: "Trending now",
  discover_upcoming_soon: "Upcoming soon",
  discover_popular_city: "Popular in your city",
  discover_events_count: "{count} events",

  // Event Card
  card_register: "Register",
  card_free: "Free",
  card_add_favorite: "Add to favorites",
  card_remove_favorite: "Remove from favorites",

  // Buttons / Common
  btn_view_all: "View all",
  btn_view_all_count: "View all {count} events",
  btn_explore: "Explore",
  btn_create: "Create",
  btn_skip: "Skip",
  btn_save: "Save",
  btn_cancel: "Cancel",
  btn_submit: "Submit",
  btn_loading: "Loading...",
  btn_retry: "Retry",

  // Footer
  footer_events: "Events",
  footer_about: "About",
  footer_team: "Team",
  footer_contact: "Contact",
  footer_help: "Help",
  footer_rights: "© {year} Kulmid. All rights reserved.",

  // Auth
  auth_sign_in: "Sign In",
  auth_sign_up: "Sign Up",
  auth_sign_out: "Sign Out",
  auth_email: "Email",
  auth_password: "Password",
  auth_forgot_password: "Forgot password?",

  // Common
  common_loading: "Loading...",
  common_error: "Something went wrong",
  common_no_results: "No results found",
  common_search: "Search",
  common_or: "or",

  // Events Page
  events_my_events: "My Events",
  events_upcoming: "Upcoming",
  events_past: "Past",
  events_no_upcoming: "No upcoming events",
  events_no_past: "No past events",
  events_no_upcoming_desc: "Create your next event and start inviting guests.",
  events_no_past_desc: "Your past events will appear here once completed.",
  events_guests_confirmed: "{count} guests confirmed",
  events_pending_count: "{count} pending",
  events_location_missing: "Location missing",

  // Empty State
  empty_title: "Create your first event",
  empty_description: "Host your next event with Kulmid. Create beautiful event pages, invite guests, and track attendance.",
  empty_create_button: "Create Your First Event",
  empty_explore_text: "or explore events happening around you",
  empty_discover: "Discover Events",

  // Auth Modal
  auth_required_message: "Sign in or create an account to start creating events.",
} as const;

export type TranslationKeys = keyof typeof en;
