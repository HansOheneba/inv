"use client";

import { useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { uploadProductImageAction } from "@/lib/actions/media";
import { ProductImage } from "@/components/inventory/product-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function ImageUploadField({
  value,
  onChange,
  productId,
  scope = "products",
  label = "Upload image",
  className,
}: {
  value: string;
  onChange: (url: string) => void;
  productId: string;
  scope?: string;
  label?: string;
  className?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPending(true);
    const formData = new FormData();
    formData.set("file", file);
    formData.set("productId", productId);
    formData.set("scope", scope);

    const result = await uploadProductImageAction({}, formData);
    setPending(false);

    if (result.error || !result.url) {
      toast.error(result.error ?? "Upload failed");
      return;
    }

    onChange(result.url);
    toast.success("Image uploaded");
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <ProductImage src={value || null} alt={label} size="md" />
      <div className="min-w-0 flex-1 space-y-1">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
          {pending ? "Uploading…" : label}
        </Button>
        {value ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-auto px-0 text-caption text-muted-foreground"
            onClick={() => onChange("")}
          >
            Remove image
          </Button>
        ) : (
          <p className="text-caption text-muted-foreground">JPEG, PNG, WebP, or GIF up to 5MB</p>
        )}
      </div>
    </div>
  );
}

export function ProductImagesEditor({
  urls,
  onChange,
  productId,
}: {
  urls: string[];
  onChange: (urls: string[]) => void;
  productId: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);

  async function handleFiles(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    event.target.value = "";
    if (!files?.length) return;

    setPending(true);
    const uploaded: string[] = [];

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("productId", productId);
      formData.set("scope", "products");

      const result = await uploadProductImageAction({}, formData);
      if (result.url) uploaded.push(result.url);
      else toast.error(result.error ?? `Could not upload ${file.name}`);
    }

    setPending(false);
    if (uploaded.length) {
      onChange([...urls, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? "s" : ""} uploaded`);
    }
  }

  function removeUrl(url: string) {
    onChange(urls.filter((entry) => entry !== url));
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {urls.map((url) => (
          <div key={url} className="relative">
            <ProductImage src={url} alt="Product" size="lg" />
            <Button
              type="button"
              variant="secondary"
              size="icon-sm"
              className="absolute -top-1.5 -right-1.5 size-6 rounded-full shadow-sm"
              onClick={() => removeUrl(url)}
              aria-label="Remove image"
            >
              <X className="size-3" />
            </Button>
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFiles}
      />

      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        disabled={pending}
        onClick={() => inputRef.current?.click()}
      >
        {pending ? <Loader2 className="size-3.5 animate-spin" /> : <ImagePlus className="size-3.5" />}
        {pending ? "Uploading…" : "Upload images"}
      </Button>
    </div>
  );
}
