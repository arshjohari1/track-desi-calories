import { Navbar } from "~/components/navbar";

/**
 * Layout for pages that use the standard site chrome (top Navbar):
 * the marketing landing page, auth screens, and notes.
 * The dashboard lives in its own route group with different chrome — /admin
 * moved there so operators keep the sidebar while working.
 */
export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navbar />
      {children}
    </>
  );
}
