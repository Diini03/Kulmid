export type EventCategory = "Seminar" | "Workshop" | "Conference" | "Festival" | "Webinar" | "Meetup";

export interface EventItem {
  id: string;
  title: string;
  date: string; // ISO string
  location: string;
  category: EventCategory;
  price: number; // in USD
  image: string;
}

import seminarImg from "@/assets/event-seminar.jpg";
import workshopImg from "@/assets/event-workshop.jpg";
import conferenceImg from "@/assets/event-conference.jpg";
import festivalImg from "@/assets/event-festival.jpg";
import sportsImg from "@/assets/event-sports.jpg"; // kept for fallback

export const events: EventItem[] = [
  {
    id: "ev-001",
    title: "Future of Tech Seminar",
    date: "2025-09-12T09:00:00Z",
    location: "San Francisco, CA",
    category: "Seminar",
    price: 49,
    image: seminarImg,
  },
  {
    id: "ev-002",
    title: "UX Design Workshop",
    date: "2025-08-30T10:00:00Z",
    location: "Austin, TX",
    category: "Workshop",
    price: 99,
    image: workshopImg,
  },
  {
    id: "ev-003",
    title: "Global Dev Conference",
    date: "2025-11-05T08:00:00Z",
    location: "Berlin, DE",
    category: "Conference",
    price: 399,
    image: conferenceImg,
  },
  {
    id: "ev-004",
    title: "Summer Lights Festival",
    date: "2025-07-22T18:00:00Z",
    location: "Barcelona, ES",
    category: "Festival",
    price: 59,
    image: festivalImg,
  },
  {
    id: "ev-005",
    title: "AI & Machine Learning Webinar",
    date: "2025-10-03T17:00:00Z",
    location: "Online",
    category: "Webinar",
    price: 0,
    image: sportsImg,
  },
  {
    id: "ev-006",
    title: "Local Founders Meetup",
    date: "2025-10-15T18:30:00Z",
    location: "New York, NY",
    category: "Meetup",
    price: 10,
    image: conferenceImg,
  },
];
