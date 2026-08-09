import * as yup from "yup";

export const registerSchema = yup.object({
  name: yup
    .string()
    .trim()
    .min(3, "Name minimum 3 characters hona chahiye")
    .required("Name required hai"),

  email: yup
    .string()
    .trim()
    .email("Valid email enter karo")
    .required("Email required hai"),

  password: yup
    .string()
    .min(6, "Password minimum 6 characters ka hona chahiye")
    .required("Password required hai"),

  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password"), null], "Password match nahi kar raha")
    .required("Confirm password required hai"),
});

export default registerSchema;
