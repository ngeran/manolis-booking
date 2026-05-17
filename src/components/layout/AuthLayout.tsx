import { auth } from "@/auth";
import { redirect } from "next/navigation";
import SessionProvider from "@/providers/SessionProvider";
import QueryProvider from "@/providers/QueryProvider";
import ThemeProvider from "@/providers/ThemeProvider";
import Header from "@/components/layout/Header";
import Sidebar from "@/components/layout/Sidebar";
import Footer from "@/components/layout/Footer";
import { Toaster } from "@/components/ui/Toaster";

export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <ThemeProvider>
      <SessionProvider session={session}>
        <QueryProvider>
          <div className="min-h-screen bg-void flex flex-col">
            <Header />
            <div className="flex flex-1">
              <Sidebar />
              <main className="flex-1 p-3 sm:p-6 pb-14 sm:pb-16 overflow-auto">{children}</main>
            </div>
            <Footer />
            <Toaster />
          </div>
        </QueryProvider>
      </SessionProvider>
    </ThemeProvider>
  );
}
