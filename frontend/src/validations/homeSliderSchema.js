import * as yup from "yup";

export const homeSliderSchema = yup.object({
  title: yup.string().required("Title is required"),

  description: yup.string().max(200, "Maximum 200 characters"),

  buttonText: yup.string(),

  buttonLink: yup.string(),

  order: yup.number().typeError("Order must be number").default(0),
});
