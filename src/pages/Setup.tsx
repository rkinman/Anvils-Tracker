import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, Server, Key, Loader2, Copy, ExternalLink, ArrowRight, Terminal } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";

export default function Setup() {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"credentials" | "schema">("credentials");
  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const storedUrl = localStorage.getItem("supabase_url");
    const storedKey = localStorage.getItem("supabase_key");
    if (storedUrl) setUrl(storedUrl);
    if (storedKey) setKey(storedKey);
  }, []);

  const handleConnect = async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (!url || !key) throw new Error("Please enter both URL and Anon Key.");
      if (!url.startsWith("https://")) throw new Error("URL must start with https://");

      const tempClient = createClient(url, key);
      const { error: authError } = await tempClient.auth.getSession();
      
      if (authError && authError.message !== "Auth session missing!") {
         console.warn("Auth check result:", authError);
      }

      localStorage.setItem("supabase_url", url);
      localStorage.setItem("supabase_key", key);
      
      toast.success("Connection successful!");
      setStep("schema");
    } catch (err: any) {
      setError(err.message || "Failed to connect to Supabase.");
    } finally {
      setIsChecking(false);
    }
  };

  const handleFinish = () => {
    window.location.href = "/";
  };

  const copySchema = async () => {
    try {
      const response = await fetch("/schema.sql");
      const text = await response.text();
      await navigator.clipboard.writeText(text);
      toast.success("SQL Schema copied to clipboard!");
    } catch (e) {
      toast.error("Failed to load schema file.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Welcome to TradeTracker
          </h1>
          <p className="text-muted-foreground text-lg">
            Let's get your trading environment set up.
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === "credentials" ? <Server className="h-5 w-5 text-primary" /> : <Database className="h-5 w-5 text-primary" />}
              {step === "credentials" ? "Step 1: Connect Backend" : "Step 2: Initialize Database"}
            </CardTitle>
            <CardDescription>
              {step === "credentials" 
                ? "Connect to your Supabase project to store your trades securely." 
                : "Your app is connected. Now we need to create the tables."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === "credentials" ? (
              <>
                <div className="bg-secondary/30 p-4 rounded-lg border border-dashed border-secondary-foreground/20 space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-full shrink-0">
                            <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-sm">Don't have a project yet?</h3>
                            <p className="text-xs text-muted-foreground">
                                Supabase provides the free database this app runs on.
                            </p>
                        </div>
                    </div>
                    <Button 
                        variant="secondary" 
                        className="w-full gap-2 bg-white dark:bg-zinc-800 hover:bg-gray-100 dark:hover:bg-zinc-700 border shadow-sm"
                        onClick={() => window.open('https://database.new', '_blank')}
                    >
                        Create Free Project <ExternalLink className="h-3 w-3" />
                    </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="url">Project URL</Label>
                        <a 
                            href="https://supabase.com/dashboard/project/_/settings/api" 
                            target="_blank" 
                            rel="noreferrer" 
                            className="text-xs text-primary hover:underline flex items-center gap-1"
                        >
                           Find in API Settings <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                    <div className="relative">
                      <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="url" 
                        placeholder="https://your-project.supabase.co" 
                        className="pl-9 font-mono text-sm"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label htmlFor="key">Anon / Public Key</Label>
                        <span className="text-xs text-muted-foreground">Never use the service_role key</span>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="key" 
                        type="password"
                        placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                        className="pl-9 font-mono text-sm"
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Connection Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="space-y-6">
                <Alert className="bg-green-500/10 border-green-500/20 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <AlertTitle>Successfully Connected</AlertTitle>
                  <AlertDescription>Your credentials have been verified and saved.</AlertDescription>
                </Alert>

                <div className="space-y-4">
                   <div className="flex items-center justify-between">
                       <Label className="text-base">Setup Database Tables</Label>
                   </div>
                   
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 1</Label>
                            <Button 
                                variant="outline" 
                                className="w-full justify-between h-auto py-4 hover:border-primary/50 group" 
                                onClick={() => window.open('https://supabase.com/dashboard/project/_/sql/new', '_blank')}
                            >
                                <span className="flex items-center gap-2">
                                    <Terminal className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    Open SQL Editor
                                </span>
                                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground uppercase tracking-wide">Step 2</Label>
                            <Button 
                                variant="default" 
                                className="w-full justify-between h-auto py-4" 
                                onClick={copySchema}
                            >
                                <span className="flex items-center gap-2">
                                    <Copy className="h-4 w-4" />
                                    Copy Schema
                                </span>
                                <span className="bg-primary-foreground/20 text-xs px-2 py-0.5 rounded">Click to Copy</span>
                            </Button>
                        </div>
                   </div>

                   <div className="bg-muted/50 p-4 rounded-md text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">Instructions:</p>
                        <ol className="list-decimal list-inside space-y-1 ml-1">
                            <li>Click <strong>Open SQL Editor</strong> (opens in new tab)</li>
                            <li>Click <strong>Copy Schema</strong> to get the code</li>
                            <li>Paste the code into the editor and click <strong>Run</strong></li>
                            <li>Come back here and click Finish</li>
                        </ol>
                   </div>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end pt-2 border-t bg-muted/10 p-6">
            {step === "credentials" ? (
              <Button onClick={handleConnect} disabled={isChecking} className="w-full sm:w-auto min-w-[140px]">
                {isChecking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : <span className="flex items-center">Connect <ArrowRight className="ml-2 h-4 w-4" /></span>}
              </Button>
            ) : (
              <Button onClick={handleFinish} className="w-full sm:w-auto min-w-[140px] bg-green-600 hover:bg-green-700">
                Finish Setup
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}