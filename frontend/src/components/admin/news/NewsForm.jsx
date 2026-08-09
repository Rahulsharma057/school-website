"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useDropzone } from "react-dropzone";

import {
  Box,
  Button,
  Chip,
  FormControlLabel,
  Grid,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import CloseIcon from "@mui/icons-material/Close";

import useNewsAdminActions from "@/hooks/useNewsAdmin";

const schema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  heading: z.string().max(150).optional(),
  slug: z.string().max(200).optional(),
  excerpt: z.string().max(400).optional(),
  content: z.string().trim().min(1, "Content is required"),
  category: z.string().optional(),
  status: z.enum(["draft", "published", "archived"]),
  isFeatured: z.boolean().optional(),
  author: z.string().optional(),
  tags: z.string().optional(), // comma-separated in the UI, split before submit
  seoMetaTitle: z.string().max(70).optional(),
  seoMetaDescription: z.string().max(160).optional(),
});

const emptyDefaults = {
  title: "",
  heading: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "",
  status: "draft",
  isFeatured: false,
  author: "",
  tags: "",
  seoMetaTitle: "",
  seoMetaDescription: "",
};

/**
 * Shared create + edit form. Pass `news` (the existing article, from
 * useAdminNewsDetail) to edit it, or omit it to create a new one.
 * `onDone` is called after a successful save (parent decides whether
 * that means closing a dialog, navigating back to the list, etc.).
 */
export default function NewsForm({ news, onDone }) {
  const isEdit = Boolean(news?._id);
  const { createMutation, updateMutation } = useNewsAdminActions();
  const saving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: emptyDefaults,
  });

  const [coverFile, setCoverFile] = useState(null); // new File, if the admin picked one
  const [coverPreview, setCoverPreview] = useState(news?.coverImage?.url || null);

  const [galleryFiles, setGalleryFiles] = useState([]); // new Files
  const [existingGallery, setExistingGallery] = useState(news?.gallery || []);
  const [removedGalleryIds, setRemovedGalleryIds] = useState([]);

  useEffect(() => {
    if (news) {
      reset({
        title: news.title || "",
        heading: news.heading || "",
        slug: news.slug || "",
        excerpt: news.excerpt || "",
        content: news.content || "",
        category: news.category || "",
        status: news.status || "draft",
        isFeatured: Boolean(news.isFeatured),
        author: news.author || "",
        tags: (news.tags || []).join(", "),
        seoMetaTitle: news.seo?.metaTitle || "",
        seoMetaDescription: news.seo?.metaDescription || "",
      });
      setCoverPreview(news.coverImage?.url || null);
      setExistingGallery(news.gallery || []);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [news?._id]);

  const coverDropzone = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] },
    maxFiles: 1,
    maxSize: 8 * 1024 * 1024,
    onDrop: (accepted) => {
      const file = accepted[0];
      if (!file) return;
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    },
  });

  const galleryDropzone = useDropzone({
    accept: { "image/jpeg": [], "image/png": [], "image/webp": [], "image/gif": [] },
    maxSize: 8 * 1024 * 1024,
    onDrop: (accepted) => {
      setGalleryFiles((prev) => [...prev, ...accepted].slice(0, 10));
    },
  });

  const onSubmit = (values) => {
    if (!isEdit && !coverFile) {
      // zod doesn't know about the file input, so this is checked manually
      alert("A cover image is required");
      return;
    }

    const payload = {
      ...values,
      tags: values.tags
        ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      coverImage: coverFile || undefined,
      galleryFiles,
      removeGalleryIds: removedGalleryIds,
    };

    if (isEdit) {
      updateMutation.mutate({ id: news._id, payload }, { onSuccess: onDone });
    } else {
      createMutation.mutate(payload, { onSuccess: onDone });
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)}>
      <Grid container spacing={2.5}>
        <Grid item xs={12} md={8}>
          <Stack spacing={2.5}>
            <TextField label="Title" fullWidth {...register("title")} error={!!errors.title} helperText={errors.title?.message} />

            <TextField label="Heading (optional tagline)" fullWidth {...register("heading")} />

            <TextField
              label="Slug (leave blank to auto-generate from title)"
              fullWidth
              {...register("slug")}
              placeholder="auto-generated-from-title"
            />

            <TextField label="Excerpt (shown on cards)" fullWidth multiline rows={2} {...register("excerpt")} />

            <TextField
              label="Content"
              fullWidth
              multiline
              rows={10}
              {...register("content")}
              error={!!errors.content}
              helperText={errors.content?.message}
            />
          </Stack>
        </Grid>

        <Grid item xs={12} md={4}>
          <Stack spacing={2.5}>
            {/* Cover image */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Cover Image *</Typography>
              <Box
                {...coverDropzone.getRootProps()}
                sx={{
                  border: "2px dashed #e4e4e7",
                  borderRadius: 2,
                  p: coverPreview ? 0 : 3,
                  textAlign: "center",
                  cursor: "pointer",
                  overflow: "hidden",
                  bgcolor: "#fafafa",
                }}
              >
                <input {...coverDropzone.getInputProps()} />
                {coverPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverPreview} alt="Cover preview" style={{ width: "100%", height: 140, objectFit: "cover" }} />
                ) : (
                  <Stack alignItems="center" spacing={1}>
                    <CloudUploadIcon sx={{ color: "#a1a1aa" }} />
                    <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>
                      Drag & drop, or click to select (max 8MB)
                    </Typography>
                  </Stack>
                )}
              </Box>
            </Box>

            {/* Gallery */}
            <Box>
              <Typography sx={{ fontSize: 13, fontWeight: 600, mb: 1 }}>Gallery (optional, up to 10)</Typography>
              <Box
                {...galleryDropzone.getRootProps()}
                sx={{ border: "2px dashed #e4e4e7", borderRadius: 2, p: 2, textAlign: "center", cursor: "pointer", bgcolor: "#fafafa" }}
              >
                <input {...galleryDropzone.getInputProps()} />
                <Typography sx={{ fontSize: 12.5, color: "#71717a" }}>Drag & drop images here</Typography>
              </Box>

              {(existingGallery.length > 0 || galleryFiles.length > 0) && (
                <Stack direction="row" spacing={1} flexWrap="wrap" rowGap={1} sx={{ mt: 1.5 }}>
                  {existingGallery.map((img) => (
                    <Box key={img.public_id} sx={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                      <Box
                        onClick={() => {
                          setExistingGallery((prev) => prev.filter((i) => i.public_id !== img.public_id));
                          setRemovedGalleryIds((prev) => [...prev, img.public_id]);
                        }}
                        sx={{
                          position: "absolute", top: -6, right: -6, bgcolor: "#18181b", color: "#fff",
                          borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
                          justifyContent: "center", cursor: "pointer",
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </Box>
                    </Box>
                  ))}
                  {galleryFiles.map((file, i) => (
                    <Box key={i} sx={{ position: "relative" }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={URL.createObjectURL(file)} alt="" style={{ width: 56, height: 56, objectFit: "cover", borderRadius: 6 }} />
                      <Box
                        onClick={() => setGalleryFiles((prev) => prev.filter((_, idx) => idx !== i))}
                        sx={{
                          position: "absolute", top: -6, right: -6, bgcolor: "#18181b", color: "#fff",
                          borderRadius: "50%", width: 18, height: 18, display: "flex", alignItems: "center",
                          justifyContent: "center", cursor: "pointer",
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </Box>
                    </Box>
                  ))}
                </Stack>
              )}
            </Box>

            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <TextField select label="Status" fullWidth {...field}>
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="published">Published</MenuItem>
                  <MenuItem value="archived">Archived</MenuItem>
                </TextField>
              )}
            />

            <Controller
              name="isFeatured"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                  label="Featured"
                />
              )}
            />

            <TextField label="Category" fullWidth {...register("category")} />
            <TextField label="Author" fullWidth {...register("author")} />
            <TextField label="Tags (comma-separated)" fullWidth {...register("tags")} placeholder="sports, admissions" />

            <Typography sx={{ fontSize: 13, fontWeight: 600, mt: 1 }}>SEO (optional)</Typography>
            <TextField label="Meta Title" fullWidth {...register("seoMetaTitle")} />
            <TextField label="Meta Description" fullWidth multiline rows={2} {...register("seoMetaDescription")} />
          </Stack>
        </Grid>
      </Grid>

      <Stack direction="row" spacing={1.5} justifyContent="flex-end" sx={{ mt: 3 }}>
        <Button onClick={onDone} sx={{ textTransform: "none", color: "#71717a" }}>
          Cancel
        </Button>
        <Button
          type="submit"
          variant="contained"
          disableElevation
          disabled={saving}
          sx={{ textTransform: "none", bgcolor: "#18181b", "&:hover": { bgcolor: "#27272a" } }}
        >
          {saving ? "Saving…" : isEdit ? "Save Changes" : "Publish Article"}
        </Button>
      </Stack>
    </Box>
  );
}
