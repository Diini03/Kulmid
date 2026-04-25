import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  email?: string | null;
  className?: string;
  fallbackClassName?: string;
}

/**
 * Universal circular avatar used everywhere in Kulmid.
 * Always square (1:1) and circular. Generates initials fallback when no image.
 */
export const UserAvatar = ({
  src,
  name,
  email,
  className,
  fallbackClassName,
}: UserAvatarProps) => {
  const initial =
    (name?.trim()?.charAt(0) || email?.trim()?.charAt(0) || "U").toUpperCase();

  return (
    <Avatar className={cn("rounded-full", className)}>
      {src ? <AvatarImage src={src} alt={name || "User"} className="object-cover" /> : null}
      <AvatarFallback
        className={cn(
          "bg-gradient-to-br from-primary/20 to-primary/5 text-primary font-bold",
          fallbackClassName
        )}
      >
        {initial}
      </AvatarFallback>
    </Avatar>
  );
};