import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { REGISTRATION_STATUS_META, RegistrationStatus } from "@/lib/registrationStatus";

interface Props {
  status: RegistrationStatus;
  className?: string;
  withPrefix?: boolean;
}

export const RegistrationStatusBadge = ({ status, className, withPrefix }: Props) => {
  const meta = REGISTRATION_STATUS_META[status];
  return (
    <Badge
      variant="outline"
      className={cn("text-xs font-medium capitalize", meta.badgeClass, className)}
    >
      {withPrefix ? `Registration: ${meta.label}` : meta.label}
    </Badge>
  );
};

export default RegistrationStatusBadge;
