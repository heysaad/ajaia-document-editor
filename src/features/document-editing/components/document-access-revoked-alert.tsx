import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type DocumentAccessRevokedAlertProps = {
  message: string;
  onBack: () => void;
};

export function DocumentAccessRevokedAlert({
  message,
  onBack,
}: DocumentAccessRevokedAlertProps) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Access revoked</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{message}</p>
        <Button type="button" size="sm" variant="outline" onClick={onBack}>
          Return to dashboard
        </Button>
      </AlertDescription>
    </Alert>
  );
}
