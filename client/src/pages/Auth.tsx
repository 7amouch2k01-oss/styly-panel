import React, { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Mail, Lock, User, Shield, Sparkles, LogIn, UserPlus, Sun, Moon } from "lucide-react";

export default function Auth() {
  const [, setLocation] = useLocation();
  const { user, loading, refresh } = useAuth();
  const { theme, toggleTheme } = useTheme();

  React.useEffect(() => {
    if (!loading && user && user.role === "admin") {
      setLocation("/");
    }
  }, [user, loading, setLocation]);
  
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");
  
  const [signUpName, setSignUpName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [signUpRole, setSignUpRole] = useState<"admin" | "user">("admin");

  const [isLoading, setIsLoading] = useState(false);

  // tRPC Mutations
  const signInMutation = trpc.auth.signIn.useMutation();
  const signUpMutation = trpc.auth.signUp.useMutation();

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signInEmail || !signInPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      await signInMutation.mutateAsync({
        email: signInEmail,
        password: signInPassword,
      });
      toast.success("Signed in successfully!");
      await refresh();
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in. Please verify your credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!signUpName || !signUpEmail || !signUpPassword) {
      toast.error("Please fill in all fields");
      return;
    }
    
    setIsLoading(true);
    try {
      await signUpMutation.mutateAsync({
        name: signUpName,
        email: signUpEmail,
        password: signUpPassword,
        role: signUpRole,
      });
      toast.success("Account created successfully!");
      await refresh();
      setLocation("/");
    } catch (err: any) {
      toast.error(err.message || "Registration failed. Try a different email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center overflow-hidden bg-gradient-to-tr from-neutral-50 via-neutral-100 to-red-50/20 dark:from-neutral-900 dark:via-neutral-950 dark:to-black p-4 transition-colors duration-300">
      {/* Floating Theme Toggle */}
      {toggleTheme && (
        <div className="absolute top-4 right-4 z-20 animate-in fade-in slide-in-from-top-4 duration-500">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={toggleTheme}
            className="h-10 w-10 rounded-xl bg-white/80 dark:bg-neutral-900/60 border-neutral-200 dark:border-neutral-800 backdrop-blur-md shadow-sm dark:shadow-md text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500/20"
            aria-label="Toggle theme"
          >
            {theme === "dark" ? (
              <Sun className="h-5 w-5 text-orange-500 animate-pulse" />
            ) : (
              <Moon className="h-5 w-5 text-indigo-600" />
            )}
          </Button>
        </div>
      )}

      {/* Decorative Blur Blobs */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-red-500/5 dark:bg-red-500/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-300" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-orange-500/5 dark:bg-orange-500/10 rounded-full blur-[100px] pointer-events-none transition-colors duration-300" />

      {/* Main Container */}
      <div className="w-full max-w-[460px] z-10 animate-in fade-in zoom-in duration-500">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center gap-2.5 mb-8 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full overflow-hidden shadow-xl shadow-red-500/15 border border-white/10">
            <img src="/logo.png" alt="Styly Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-neutral-900 via-neutral-800 to-neutral-600 dark:from-white dark:via-neutral-100 dark:to-neutral-400 bg-clip-text text-transparent">
              Styly Portal
            </h1>
            <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1.5 font-medium">
              Manage your fashion collection & analytics
            </p>
          </div>
        </div>

        {/* Card Component */}
        <Card className="border-neutral-200 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-xl shadow-xl dark:shadow-2xl dark:shadow-black/60 relative overflow-hidden transition-colors duration-300">
          <Tabs defaultValue="signin" className="w-full">
            <div className="px-6 pt-6 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-neutral-100/80 dark:bg-neutral-950/80 p-1 border border-neutral-200/50 dark:border-neutral-800/50 rounded-lg transition-colors duration-300">
                <TabsTrigger value="signin" className="text-sm font-medium rounded-md py-1.5 text-neutral-600 dark:text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-white">
                  Sign In
                </TabsTrigger>
                <TabsTrigger value="signup" className="text-sm font-medium rounded-md py-1.5 text-neutral-600 dark:text-neutral-400 data-[state=active]:bg-white data-[state=active]:text-neutral-900 data-[state=active]:shadow-sm dark:data-[state=active]:bg-neutral-800 dark:data-[state=active]:text-white">
                  Register
                </TabsTrigger>
              </TabsList>
            </div>

            {/* TAB: SIGN IN */}
            <TabsContent value="signin">
              <form onSubmit={handleSignIn}>
                <CardHeader className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white">Welcome back</CardTitle>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Enter your email to sign in to your dashboard
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="signin-email"
                        type="email"
                        placeholder="name@example.com"
                        value={signInEmail}
                        onChange={(e) => setSignInEmail(e.target.value)}
                        className="pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-red-500/20"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signin-password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="signin-password"
                        type="password"
                        placeholder="••••••••"
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        className="pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-red-500/20"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : (
                      <>
                        <LogIn className="mr-2 h-4 w-4" />
                        Sign In
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>

            {/* TAB: SIGN UP */}
            <TabsContent value="signup">
              <form onSubmit={handleSignUp}>
                <CardHeader className="space-y-1.5">
                  <CardTitle className="text-xl font-bold text-neutral-900 dark:text-white">Create an account</CardTitle>
                  <CardDescription className="text-neutral-500 dark:text-neutral-400 text-sm">
                    Enter your details to create your admin dashboard account
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Name Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-name" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="John Doe"
                        value={signUpName}
                        onChange={(e) => setSignUpName(e.target.value)}
                        className="pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-red-500/20"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Email Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="name@example.com"
                        value={signUpEmail}
                        onChange={(e) => setSignUpEmail(e.target.value)}
                        className="pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-red-500/20"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div className="space-y-2">
                    <Label htmlFor="signup-password" className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        className="pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:border-red-500/50 focus:ring-red-500/20"
                        required
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  {/* Developmental Role Input */}
                  <div className="space-y-2">
                    <Label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Account Access Role</Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Select value={signUpRole} onValueChange={(val: "admin" | "user") => setSignUpRole(val)}>
                          <SelectTrigger className="w-full pl-11 bg-white/95 dark:bg-neutral-950/60 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white focus:border-red-500/50 focus:ring-red-500/20">
                            <Shield className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-neutral-400 dark:text-neutral-500" />
                            <SelectValue placeholder="Select role" />
                          </SelectTrigger>
                          <SelectContent className="bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 text-neutral-900 dark:text-white">
                            <SelectItem value="admin" className="focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white">Admin (Full Access)</SelectItem>
                            <SelectItem value="user" className="focus:bg-neutral-100 dark:focus:bg-neutral-800 focus:text-neutral-900 dark:focus:text-white">User (Read-only / Locked)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500">
                      * Choose "Admin" to view the full dashboard panel. Choosing "User" will trigger the Unauthorized guard.
                    </p>
                  </div>
                </CardContent>
                <CardFooter className="pt-2">
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/10 active:scale-[0.98] transition-all font-semibold"
                    disabled={isLoading}
                  >
                    {isLoading ? "Creating Account..." : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Create Account
                      </>
                    )}
                  </Button>
                </CardFooter>
              </form>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
