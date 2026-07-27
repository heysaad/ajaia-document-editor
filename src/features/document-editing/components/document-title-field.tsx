import { Input } from "@/components/ui/input";

type DocumentTitleFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
};

export function DocumentTitleField({
  value,
  onChange,
  onBlur,
}: DocumentTitleFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="document-title"
        className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        Document title
      </label>
      <Input
        id="document-title"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        className="h-12 text-base font-semibold"
      />
    </div>
  );
}
