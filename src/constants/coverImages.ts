import coverCelebration from "@/assets/covers/cover-celebration.jpg";
import coverCliff from "@/assets/covers/cover-cliff.jpg";
import coverSketch from "@/assets/covers/cover-sketch.jpg";
import coverCar from "@/assets/covers/cover-car.png";
import coverVR from "@/assets/covers/cover-vr.jpg";
import coverGradient from "@/assets/covers/cover-gradient.jpg";
import coverNeonCity from "@/assets/covers/cover-neon-city.jpg";
import coverConcert from "@/assets/covers/cover-concert.jpg";
import coverConference from "@/assets/covers/cover-conference.jpg";
import coverMountain from "@/assets/covers/cover-mountain.jpg";
import coverWave from "@/assets/covers/cover-wave.jpg";
import coverWorkspace from "@/assets/covers/cover-workspace.jpg";
import coverSunset from "@/assets/covers/cover-sunset.jpg";
import coverPowder from "@/assets/covers/cover-powder.jpg";
import coverMicrophone from "@/assets/covers/cover-microphone.jpg";
import coverCollaboration from "@/assets/covers/cover-collaboration.jpg";
import coverFireworks from "@/assets/covers/cover-fireworks.jpg";
import coverOcean from "@/assets/covers/cover-ocean.jpg";
import coverStreet from "@/assets/covers/cover-street.jpg";
import coverArchitecture from "@/assets/covers/cover-architecture.jpg";

export interface CoverImage {
  id: string;
  src: string;
  label: string;
}

export const coverImages: CoverImage[] = [
  { id: "celebration", src: coverCelebration, label: "Celebration" },
  { id: "cliff", src: coverCliff, label: "Atmospheric" },
  { id: "sketch", src: coverSketch, label: "Artistic" },
  { id: "car", src: coverCar, label: "Urban Style" },
  { id: "vr", src: coverVR, label: "Tech" },
  { id: "gradient", src: coverGradient, label: "Minimal" },
  { id: "neon-city", src: coverNeonCity, label: "City Night" },
  { id: "concert", src: coverConcert, label: "Festival" },
  { id: "conference", src: coverConference, label: "Conference" },
  { id: "mountain", src: coverMountain, label: "Nature" },
  { id: "wave", src: coverWave, label: "Creative" },
  { id: "workspace", src: coverWorkspace, label: "Workshop" },
  { id: "sunset", src: coverSunset, label: "Warm" },
  { id: "powder", src: coverPowder, label: "Vibrant" },
  { id: "microphone", src: coverMicrophone, label: "Seminar" },
  { id: "collaboration", src: coverCollaboration, label: "Meetup" },
  { id: "fireworks", src: coverFireworks, label: "Celebration" },
  { id: "ocean", src: coverOcean, label: "Calm" },
  { id: "street", src: coverStreet, label: "Culture" },
  { id: "architecture", src: coverArchitecture, label: "Modern" },
];
