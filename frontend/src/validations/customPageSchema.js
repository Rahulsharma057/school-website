import * as yup from "yup";

export const customPageSchema = yup.object({

  title: yup
    .string()
    .required("Title is required"),

  route: yup
    .string()
    .required("Route is required"),

  shortDescription: yup
    .string()
    .max(500),

  content: yup
    .string()
    .required("Content is required"),

  buttonText: yup
    .string(),

  buttonLink: yup
    .string(),

  seoTitle: yup
    .string(),

  seoDescription: yup
    .string(),

  keywords: yup
    .string(),

  pageType: yup
    .string()
    .required(),

  order: yup
    .number()
    .typeError("Order must be number"),

});