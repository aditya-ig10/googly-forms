"use client"

import { useState } from "react"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Chrome,
  Sparkles,
  Shield,
  Zap,
  Users,
  BarChart3,
  Globe,
  Lock,
  CheckCircle,
  Star,
  Rocket,
  Heart,
  FileText,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Login() {
  const { signInWithGoogle } = useAuth()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()

  const handleGoogleSignIn = async () => {
    setLoading(true)
    try {
      await signInWithGoogle()
      toast({
        title: "Welcome to Googly Forms! 🎉",
        description: "You've successfully signed in with Google.",
      })
    } catch (error) {
      toast({
        title: "Sign in failed",
        description: "Please try again later.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const features = [
    { icon: Shield, text: "Enterprise-grade security", color: "text-emerald-500" },
    { icon: Zap, text: "Lightning-fast form creation", color: "text-yellow-500" },
    { icon: BarChart3, text: "Advanced analytics & insights", color: "text-blue-500" },
    { icon: Users, text: "Unlimited responses", color: "text-purple-500" },
    { icon: Globe, text: "Share anywhere, anytime", color: "text-indigo-500" },
    { icon: Heart, text: "Beautiful, responsive design", color: "text-pink-500" },
  ]

  const stats = [
    { number: "10M+", label: "Forms Created", icon: FileText },
    { number: "50M+", label: "Responses Collected", icon: Users },
    { number: "99.9%", label: "Uptime", icon: CheckCircle },
    { number: "150+", label: "Countries", icon: Globe },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden animate-fade-in">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 sm:w-96 sm:h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 bg-indigo-500/5 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="relative z-10 min-h-screen flex flex-col lg:flex-row">
        {/* Left side - Hero content */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 lg:p-16">
          <div className="max-w-lg space-y-8 text-white animate-pop-in">
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-12 w-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-2xl flex items-center justify-center shadow-2xl hover-glow">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  Googly Forms
                </span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight">
                Create
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                  {" "}Beautiful{" "}
                </span>
                Forms
              </h1>

              <p className="text-lg sm:text-xl text-gray-300 leading-relaxed">
                Build stunning surveys, quizzes, and feedback forms in minutes. Collect responses, analyze data, and
                make informed decisions.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10 hover-lift"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <stat.icon className="h-5 w-5 text-purple-400" />
                    <div>
                      <div className="text-2xl font-bold text-white">{stat.number}</div>
                      <div className="text-sm text-gray-400">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Features grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                  style={{ animationDelay: `${(index + 4) * 100}ms` }}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                  <span>{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right side - Login form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8">
          <div className="w-full max-w-sm sm:max-w-md space-y-8 animate-pop-in" style={{ animationDelay: "200ms" }}>
            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-xl hover-lift">
              <CardHeader className="text-center pb-6">
                <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg hover-glow">
                  <Rocket className="h-8 w-8 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-gray-900">Welcome Back</CardTitle>
                <CardDescription className="text-gray-600 text-lg">
                  Sign in to start creating amazing forms
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  className="w-full h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-lg hover-lift"
                >
                  <Chrome className="h-6 w-6 mr-3" />
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Continue with Google"
                  )}
                </Button>

                {/* Security features */}
                <div className="space-y-4 pt-6 border-t border-gray-200">
                  <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    <Lock className="h-4 w-4 text-green-500" />
                    <span>256-bit SSL encryption</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    <Shield className="h-4 w-4 text-blue-500" />
                    <span>GDPR compliant data handling</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 hover:text-gray-800 transition-colors">
                    <CheckCircle className="h-4 w-4 text-purple-500" />
                    <span>SOC 2 Type II certified</span>
                  </div>
                </div>

                {/* Testimonial */}
                <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100 hover-scale">
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-700 italic">
                    "Googly Forms transformed how we collect feedback. The interface is intuitive and the analytics are
                    powerful."
                  </p>
                  <p className="text-xs text-gray-500 mt-2">- Sarah Chen, Product Manager</p>
                </div>
              </CardContent>
            </Card>

            {/* Footer */}
            <p className="text-center text-sm text-gray-400">
              By signing in, you agree to our{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-purple-400 hover:text-purple-300 underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
