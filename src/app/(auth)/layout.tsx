export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-xl font-semibold tracking-tight">WealthPilot</h1>
          <p className="text-muted-foreground text-sm">
            Your financial command center
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
