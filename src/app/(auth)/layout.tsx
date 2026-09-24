import { ThemeToggle } from "@/components/layout/ThemeToggle"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="bg-muted/30 relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-brand text-xl font-semibold tracking-tight">
            Kovault Financial
          </h1>
          <p className="text-muted-foreground text-sm">
            Your financial command center
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
