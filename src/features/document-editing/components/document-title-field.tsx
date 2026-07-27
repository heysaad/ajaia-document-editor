import { Input } from "@/components/ui/input";

type DocumentTitleFieldProps = {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  readOnly?: boolean;
};

export function DocumentTitleField({
  value,
  onChange,
  onBlur,
  readOnly = false,
}: DocumentTitleFieldProps) {
  return (
    <div className="space-y-2">
      <label
        htmlFor="document-title"
        className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
      >
        Document title
      </label>
      {readOnly ? (
        <div
          id="document-title"
          className="flex min-h-12 items-center rounded-xl border border-border/70 bg-muted/30 px-4 py-3 text-base font-semibold text-foreground"
        >
          {value}
        </div>
      ) : (
        <Input
          id="document-title"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onBlur={onBlur}
          className="h-12 text-base font-semibold"
        />
      )}
    </div>
  );
}
