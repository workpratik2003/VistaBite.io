import { LoginForm } from '@/components/auth/login-form'

export const metadata = {
  title: 'Sign In - Vistabite',
  description: 'Sign in to your Vistabite account',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 p-4">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10">
        <LoginForm />
      </div>
    </div>
  )
}
