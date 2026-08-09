import * as yup from "yup";

export const navbarSchema = yup.object({
  schoolName: yup
    .string()
    .required("School name is required")
    .min(3, "School name minimum 3 characters"),

  shortName: yup
    .string()
    .nullable(),

  primaryColor: yup
    .string()
    .required("Primary color required"),

  secondaryColor: yup
    .string()
    .required("Secondary color required"),

  sticky: yup
    .boolean()
    .default(true),

  transparent: yup
    .boolean()
    .default(false),

  showTopBar: yup
    .boolean()
    .default(true),

  topBarEmail: yup
    .string()
    .email("Invalid email")
    .nullable(),

  topBarPhone: yup
    .string()
    .nullable(),

  topBarAddress: yup
    .string()
    .nullable(),

  showLoginButton: yup
    .boolean()
    .default(true),

  loginButtonText: yup
    .string()
    .default("Login"),

  loginButtonLink: yup
    .string()
    .default("/login"),

  showAdmissionButton: yup
    .boolean()
    .default(true),

  admissionButtonText: yup
    .string()
    .default("Admission Open"),

  admissionButtonLink: yup
    .string()
    .default("/admission"),
});