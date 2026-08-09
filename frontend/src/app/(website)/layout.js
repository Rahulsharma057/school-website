import Navbar from "@/components/layout/Navbar";

export default function WebsiteLayout({ children }) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}