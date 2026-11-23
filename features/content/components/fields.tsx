"use client";

import { useRef, useState, type ReactNode } from "react";
import Image from "next/image";
import { useFieldArray, useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { ArrowDown, ArrowUp, ChevronDown, ImageUp, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { uploadImageAction } from "@/features/media/actions";
import { IMAGE_ACCEPT, IMAGE_PRESETS, MAX_UPLOAD_BYTES, type ImagePreset } from "@/lib/images";
import { cn } from "@/utils/twMerge";
import type { ImageAsset } from "../schemas";

/** Section forms have different shapes; fields address values by path. */
const useAnyForm = () => useFormContext<FieldValues>();

// ---------- Simple fields ----------

export function TextField({
  name,
  label,
  description,
  placeholder,
  multiline,
  rows = 3,
  type,
}: {
  name: string;
  label: string;
  description?: ReactNode;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  type?: string;
}) {
  const form = useAnyForm();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            {multiline ? (
              <Textarea rows={rows} placeholder={placeholder} {...field} value={field.value ?? ""} />
            ) : (
              <Input type={type} placeholder={placeholder} {...field} value={field.value ?? ""} />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField({ name, label, description }: { name: string; label: string; description?: string }) {
  const form = useAnyForm();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center justify-between gap-4 rounded-lg border p-4">
          <div className="grid gap-1">
            <FormLabel>{label}</FormLabel>
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={Boolean(field.value)} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export function SelectField({
  name,
  label,
  options,
  description,
}: {
  name: string;
  label: string;
  options: Array<{ value: string; label: ReactNode }>;
  description?: string;
}) {
  const form = useAnyForm();
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <Select value={field.value} onValueChange={field.onChange}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Choose…" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

// ---------- Image ----------

/**
 * Big phone photos are shrunk in the browser before upload (much faster on
 * mobile data). The server still re-encodes everything, so this is only a
 * speed-up: on any failure the original file is sent.
 */
async function shrinkForUpload(file: File, preset: ImagePreset): Promise<File> {
  const max = IMAGE_PRESETS[preset].maxSize;
  if (file.size < 1_500_000) return file;
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    canvas.getContext("2d")?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const type = preset === "logo" ? "image/png" : "image/jpeg";
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.92));
    return blob && blob.size < file.size ? new File([blob], file.name, { type }) : file;
  } catch {
    return file;
  }
}

export function ImageField({
  name,
  label,
  preset,
  description,
  aspect = "aspect-video",
}: {
  name: string;
  label: string;
  preset: ImagePreset;
  description?: string;
  /** Tailwind aspect class for the preview box. */
  aspect?: string;
}) {
  const form = useAnyForm();
  const input = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const value = useWatch({ control: form.control, name }) as ImageAsset | undefined;
  const error = form.getFieldState(name, form.formState).error;

  async function onFile(file: File | undefined) {
    if (input.current) input.current.value = ""; // allow re-picking the same file
    if (!file) return;
    if (!IMAGE_ACCEPT.split(",").includes(file.type)) {
      toast.error("Use a JPEG, PNG or WebP image.");
      return;
    }
    setUploading(true);
    try {
      const small = await shrinkForUpload(file, preset);
      if (small.size > MAX_UPLOAD_BYTES) {
        toast.error("That image is too large. Use one under 12 MB.");
        return;
      }
      const data = new FormData();
      data.set("file", small);
      data.set("preset", preset);
      const result = await uploadImageAction(data);
      if (!result.ok) {
        toast.error(result.error.message);
        return;
      }
      form.setValue(name, result.data, { shouldDirty: true, shouldValidate: true });
      toast.success("Image uploaded. Save to publish it.");
    } catch {
      toast.error("Upload failed. Check your connection and try again.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-2">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap items-end gap-4">
        <div
          className={cn(
            "relative w-full max-w-sm overflow-hidden rounded-lg border bg-muted",
            preset === "logo" ? "aspect-square max-w-28" : aspect,
          )}
        >
          {value?.src && (
            <Image
              src={value.src}
              alt=""
              fill
              sizes="384px"
              placeholder={value.blurDataURL ? "blur" : "empty"}
              blurDataURL={value.blurDataURL || undefined}
              className={preset === "logo" ? "object-contain p-2" : "object-cover"}
            />
          )}
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/70">
              <Loader2 className="size-6 animate-spin" aria-label="Uploading" />
            </div>
          )}
        </div>
        <div className="grid gap-2">
          <Button type="button" variant="outline" size="sm" disabled={uploading} onClick={() => input.current?.click()}>
            <ImageUp /> {uploading ? "Uploading…" : value?.src ? "Replace image" : "Upload image"}
          </Button>
          <p className="max-w-56 text-xs text-muted-foreground">
            {description ?? "JPEG, PNG or WebP. It's optimised automatically."}
          </p>
        </div>
      </div>
      {error && <p className="text-sm font-medium text-destructive">{error.message ?? "Upload an image"}</p>}
      <input ref={input} type="file" accept={IMAGE_ACCEPT} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
    </div>
  );
}

// ---------- Lists ----------

/**
 * An editable, reorderable list (services, activities, branches…). Each item
 * is a collapsible card; new items open expanded.
 */
export function ListField({
  name,
  itemNoun,
  newItem,
  titleOf,
  children,
  max,
}: {
  name: string;
  itemNoun: string;
  newItem: () => Record<string, unknown>;
  titleOf: (item: Record<string, unknown> | undefined, index: number) => string;
  children: (path: string, index: number) => ReactNode;
  max?: number;
}) {
  const form = useAnyForm();
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name });
  const [open, setOpen] = useState<Set<string>>(new Set());
  /** A just-added item opens by position until it's touched (its id isn't known when adding). */
  const [newIndex, setNewIndex] = useState<number | null>(null);
  const items = useWatch({ control: form.control, name }) as Array<Record<string, unknown>> | undefined;
  const listError = form.getFieldState(name, form.formState).error;

  const isOpen = (id: string, index: number) => open.has(id) || index === newIndex;

  /** Pin the auto-opened item by id before positions change. */
  const settleNew = () => {
    if (newIndex === null) return;
    const id = fields[newIndex]?.id;
    if (id) setOpen((prev) => new Set(prev).add(id));
    setNewIndex(null);
  };

  const toggle = (id: string, index: number) => {
    const wasOpen = isOpen(id, index);
    if (index === newIndex) setNewIndex(null);
    setOpen((prev) => {
      const next = new Set(prev);
      if (wasOpen) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="grid grid-cols-1 gap-3">
      {fields.length === 0 && (
        <p className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
          No {itemNoun}s yet.
        </p>
      )}
      {fields.map((field, index) => {
        const expanded = isOpen(field.id, index);
        const hasError = Boolean(form.getFieldState(`${name}.${index}`, form.formState).error);
        return (
          <div key={field.id} className={cn("rounded-lg border bg-card", hasError && "border-destructive")}>
            <div className="flex items-center gap-1 p-2 pl-3">
              <button
                type="button"
                onClick={() => toggle(field.id, index)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium"
                aria-expanded={expanded}
              >
                <ChevronDown className={cn("size-4 shrink-0 transition-transform", !expanded && "-rotate-90")} />
                <span className="truncate">{titleOf(items?.[index], index) || `New ${itemNoun}`}</span>
              </button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={index === 0}
                onClick={() => {
                  settleNew();
                  move(index, index - 1);
                }}
                aria-label="Move up"
              >
                <ArrowUp />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8"
                disabled={index === fields.length - 1}
                onClick={() => {
                  settleNew();
                  move(index, index + 1);
                }}
                aria-label="Move down"
              >
                <ArrowDown />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 text-destructive hover:text-destructive"
                onClick={() => {
                  settleNew();
                  remove(index);
                }}
                aria-label={`Remove ${itemNoun}`}
              >
                <Trash2 />
              </Button>
            </div>
            {/* Collapsed items stay mounted (hidden) so validation still reaches them. */}
            <div className={cn("grid grid-cols-1 gap-4 border-t p-3 sm:p-4", !expanded && "hidden")}>{children(`${name}.${index}`, index)}</div>
          </div>
        );
      })}
      {listError?.message && <p className="text-sm font-medium text-destructive">{listError.message}</p>}
      <Button
        type="button"
        variant="outline"
        className="w-fit"
        disabled={max !== undefined && fields.length >= max}
        onClick={() => {
          settleNew();
          setNewIndex(fields.length);
          append(newItem(), { shouldFocus: false });
        }}
      >
        <Plus /> Add {itemNoun}
      </Button>
    </div>
  );
}
