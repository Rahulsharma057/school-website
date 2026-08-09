
import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Input,  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

import { createSlider, updateSlider } from "@/services/homeSliderService";
import { homeSliderSchema } from "@/validations/homeSliderSchema";

import ImageCropDialog from "./ImageCropDialog";
import getCroppedImg from "@/utils/cropImage";

export default function SliderForm({ editData, clearEdit }) {
  const queryClient = useQueryClient();


const [image, setImage] = useState(null);

const [preview, setPreview] = useState("");

const [cropImage, setCropImage] = useState("");
const [removeImage, setRemoveImage] = useState(false);
const [cropOpen, setCropOpen] = useState(false);

const {
  register,
  handleSubmit,
  reset,
  watch,
  formState: { errors },
} = useForm({
  resolver: yupResolver(homeSliderSchema),

  defaultValues:{
    title:"",
    description:"",
    buttonText:"",
    buttonLink:"",
    order:0,
  }
});

  // edit fill

useEffect(() => {

  if (!editData) return;


  const formData = {
    title: editData.title || "",
    description: editData.description || "",
    buttonText: editData.buttonText || "",
    buttonLink: editData.buttonLink || "",
    order: editData.order || 0,
  };


  console.log("RESET DATA", formData);


  reset(formData, {
    keepDefaultValues: true,
  });


  setPreview(editData.image?.url || "");


}, [editData, reset]);

console.log("WATCH VALUES", watch());

  const mutation = useMutation({
    mutationFn: (data) => {
      if (editData) {
        return updateSlider(editData._id, data);
      }

      return createSlider(data);
    },

    onSuccess: () => {
      toast.success(editData ? "Slider Updated" : "Slider Added");

      queryClient.invalidateQueries({
        queryKey: ["home-slider"],
      });

      reset({
        title: "",
        description: "",
        buttonText: "",
        buttonLink: "",
        order: 0,
      });

setImage(null);

setPreview("");

setCropImage("");

setCropOpen(false);

clearEdit?.();
    },

    onError: () => {
      toast.error("Something went wrong");
    },
  });

const handleImage = (e) => {
  const file = e.target.files?.[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = () => {
    setCropImage(reader.result);
    setCropOpen(true);
  };

  reader.readAsDataURL(file);
};

const handleCropComplete = async (
  croppedAreaPixels,
  rotation
) => {
  try {
    const croppedFile = await getCroppedImg(
      cropImage,
      croppedAreaPixels,
      rotation
    );

    setImage(croppedFile);

    setPreview(URL.createObjectURL(croppedFile));

    setCropOpen(false);
  } catch (err) {
    toast.error("Failed to crop image");
  }
};

  const submit = (values) => {
    const formData = new FormData();

    formData.append("title", values.title);

    formData.append("description", values.description || "");

    formData.append("buttonText", values.buttonText || "");

    formData.append("buttonLink", values.buttonLink || "");
formData.append("removeImage", removeImage);
    formData.append("order", values.order);

    if (image) {
      formData.append("image", image);
    }

    if (!editData && !image) {
      toast.error("Image required");

      return;
    }

    mutation.mutate(formData);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" fontWeight={700} mb={3}>
          {editData ? "Edit Home Slider" : "Add Home Slider"}
        </Typography>

        <Box component="form" onSubmit={handleSubmit(submit)}>
          <TextField
            fullWidth
            label="Slider Title"
            margin="normal"
            {...register("title")}
            error={!!errors.title}
            helperText={errors.title?.message}
          />

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Description"
            margin="normal"
            {...register("description")}
          />

          <TextField
            fullWidth
            label="Button Text"
            margin="normal"
            {...register("buttonText")}
          />

      <TextField
 fullWidth
 label="Button Link"
 margin="normal"
 {...register("buttonLink")}
/>

         <TextField
 fullWidth
 type="number"
 label="Display Order"
 margin="normal"
 {...register("order",{
   valueAsNumber:true
 })}
/>

  <Box mt={3}>
  <Typography
    variant="subtitle1"
    fontWeight={600}
    mb={1}
  >
    Slider Image
  </Typography>

  <Box
    sx={{
      border: "2px dashed #1976d2",
      borderRadius: 3,
      p: 3,
      textAlign: "center",
      bgcolor: "#fafafa",
      cursor: "pointer",
      transition: ".3s",

      "&:hover": {
        bgcolor: "#f4f8ff",
        borderColor: "#1565c0",
      },
    }}
  >
    <Input

      type="file"
      onChange={handleImage}
      inputProps={{
        accept: "image/*",
      }}
      sx={{
        display: "none",
      }}
      id="slider-image-upload"
    />

    <label htmlFor="slider-image-upload">
      <Button
        variant="contained"
        component="span"
      >
        Choose Image
      </Button>
    </label>

    <Typography
      mt={2}
      color="text.secondary"
    >
      Recommended Size: 1920 × 800
    </Typography>

    <Typography
      variant="caption"
      display="block"
      mt={1}
    >
      Image will be cropped before upload.
    </Typography>
  </Box>
</Box>

        {preview && (
  <Box mt={3}>
    <Typography
      fontWeight={600}
      mb={1}
    >
      Preview
    </Typography>

    <Box
      sx={{
        width: "100%",
        maxWidth: 700,
        aspectRatio: "16 / 9",
        overflow: "hidden",
        borderRadius: 3,
        border: "2px solid #1976d2",
        bgcolor: "#000",
      }}
    >
      <Box
        component="img"
        src={preview}
        sx={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </Box>
  </Box>
)}
{preview && (
  <Stack
    direction="row"
    spacing={2}
    mt={2}
  >
    <Button
      variant="outlined"
      component="label"
    >
      Replace Image

      <input
        hidden
        type="file"
        accept="image/*"
        onChange={handleImage}
      />
    </Button>

    <Button
      color="error"
      variant="outlined"
 onClick={() => {
  setImage(null);
  setPreview("");
  setCropImage("");
}}
    >
      Remove Image
    </Button>
  </Stack>
)}

          <Button
            sx={{
              mt: 3,
            }}
              fullWidth
  size="large"
            variant="contained"
            type="submit"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? "Saving..."
              : editData
                ? "Update Slider"
                : "Save Slider"}
          </Button>
        </Box>
      </CardContent>
      <ImageCropDialog
  open={cropOpen}
  image={cropImage}
  onClose={() => setCropOpen(false)}
  onCropComplete={handleCropComplete}
/>
    </Card>
  );
}
