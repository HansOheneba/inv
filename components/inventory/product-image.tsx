import Image from "next/image";
import { cn } from "@/lib/utils";

export function ProductImage({
  src,
  alt,
  size = "md",
  className,
}: {
  src: string | null | undefined;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const dimensions =
    size === "sm" ? "size-10" : size === "lg" ? "size-20" : "size-14";

  if (!src) {
    return (
      <div
        className={cn(
          "flex shrink-0 items-center justify-center rounded-md border bg-muted text-caption text-muted-foreground",
          dimensions,
          className,
        )}
        aria-hidden
      >
        —
      </div>
    );
  }

  return (
    <div className={cn("relative shrink-0 overflow-hidden rounded-md border bg-muted", dimensions, className)}>
      <Image src={src} alt={alt} fill className="object-cover" sizes="80px" />
    </div>
  );
}

export function ProductImageStrip({
  urls,
  alt,
}: {
  urls: string[];
  alt: string;
}) {
  if (urls.length === 0) {
    return <p className="text-caption text-muted-foreground">No images linked yet.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {urls.map((url) => (
        <ProductImage key={url} src={url} alt={alt} size="lg" />
      ))}
    </div>
  );
}
