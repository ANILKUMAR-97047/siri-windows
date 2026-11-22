import { getAdminClient } from "@/lib/supabase/admin";
import LanguageProvider from "@/components/providers/LanguageProvider";
import SmoothScrollProvider from "@/components/providers/SmoothScrollProvider";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import FloatingButtons from "@/components/ui/FloatingButtons";

export const dynamic = "force-dynamic";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let initialContent: Record<string, any> = {};

  try {
    const supabase = getAdminClient();
    const { data, error } = await (supabase.from("website_content" as any) as any)
      .select("section, content, is_active");

    if (!error && data) {
      for (const item of (data as any[])) {
        if (item.is_active !== false && item.section && item.content) {
          initialContent[item.section] = item.content;
        }
      }
    }
  } catch (e) {
    // Graceful fallback to static content if database is temporarily unreachable
  }

  return (
    <LanguageProvider initialContent={initialContent}>
      <SmoothScrollProvider>
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingButtons />
      </SmoothScrollProvider>
    </LanguageProvider>
  );
}
