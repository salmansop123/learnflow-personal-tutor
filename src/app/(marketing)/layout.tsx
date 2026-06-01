import { Footer } from "@/components/layout/Footer";
import { MarketingNav } from "@/components/layout/MarketingNav";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-site flex min-h-screen min-w-0 flex-col overflow-x-hidden">
      <MarketingNav />
      <div className="min-w-0 flex-1">{children}</div>
      <Footer />
    </div>
  );
}
