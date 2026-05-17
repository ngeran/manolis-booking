import AuthLayout from "@/components/layout/AuthLayout";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <AuthLayout>{children}</AuthLayout>;
}
