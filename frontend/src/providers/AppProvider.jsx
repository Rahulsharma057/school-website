"use client";

import { ThemeProvider } from "@mui/material/styles";

import CssBaseline from "@mui/material/CssBaseline";

import theme from "@/theme/theme";
import ThemeRegistry from "@/theme/registry";
import { ToastContainer } from "react-toastify";

import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "@/context/AuthContext";

export default function AppProvider({ children }) {
return (

<AuthProvider>

<ThemeRegistry>

<ThemeProvider theme={theme}>

<CssBaseline />

{children}


<ToastContainer
position="top-right"
autoClose={3000}
/>


</ThemeProvider>


</ThemeRegistry>


</AuthProvider>

);
}
