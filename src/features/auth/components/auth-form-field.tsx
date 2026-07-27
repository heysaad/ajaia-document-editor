import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type AuthFormFieldProps = React.ComponentProps<typeof Input> & {
  label: string;
  hint?: string;
};

export function AuthFormField({
  label,
  hint,
  id,
  ...props
}: AuthFormFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
