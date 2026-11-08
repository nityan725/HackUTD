import AppHeader from "@/components/AppHeader";

// Wraps every page so the Kit logo bar shows at the top of each screen.
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AppHeader />
      {children}
    </>
  );
}
