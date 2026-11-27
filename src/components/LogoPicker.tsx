import { useRef, useState, type ReactNode } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { resizeImageToDataUrl } from "@/lib/image";

const MAX_LOGO_BYTES = 5 * 1024 * 1024;

/** Image upload with preview. The image is shrunk in the browser before saving. */
export function LogoPicker({
  id,
  label,
  alt,
  fallback,
  value,
  onChange,
}: {
  id: string;
  label: string;
  alt: string;
  /** Shown in the preview box when there is no image yet. */
  fallback: ReactNode;
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file (PNG, JPG, WEBP).");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      setError("Image is too large. Pick one under 5 MB.");
      return;
    }
    setBusy(true);
    try {
      onChange(await resizeImageToDataUrl(file));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not use that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <Field data-invalid={!!error}>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div className="flex items-center gap-4">
        <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted">
          {value ? (
            <img src={value} alt={alt} className="size-full object-contain" />
          ) : (
            fallback
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
          >
            {busy ? <Loader2 className="animate-spin" /> : <ImagePlus />}
            {value ? "Change logo" : "Upload logo"}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <X /> Remove
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          id={id}
          type="file"
          accept="image/*"
          className="sr-only"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
      <FieldDescription>Square images look best. Max 5 MB.</FieldDescription>
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}
