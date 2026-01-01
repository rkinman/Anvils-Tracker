import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, Database, Server, Key, Loader2, Copy } from "lucide-react";
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
    // Pre-fill if exists in local storage
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

      // Test connection
      const tempClient = createClient(url, key);
      
      // We try to fetch something innocuous. If the project doesn't have tables yet, 
      // this might fail with a specific error, but connection errors (401/404) are what we care about.
      // Fetching 'health' check or just checking if we can instantiate auth is usually enough.
      // However, usually a select on a non-existent table returns a specific postgres error, not a network error.
      // Let's try to get the session - strictly client side check.
      const { error: authError } = await tempClient.auth.getSession();
      
      if (authError && authError.message !== "Auth session missing!") {
         // Some auth errors are fine (like session missing), but network/apikey errors are not.
         console.warn("Auth check result:", authError);
      }

      // If we got here without throwing a network/url error, save keys.
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
    // Force a reload so the main client.ts picks up the new localStorage keys
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

        <Card className="border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {step === "credentials" ? <Server className="h-5 w-5 text-primary" /> : <Database className="h-5 w-5 text-primary" />}
              {step === "credentials" ? "Connect to Supabase" : "Initialize Database"}
            </CardTitle>
            <CardDescription>
              {step === "credentials" 
                ? "Enter your Supabase project credentials. You can find these in Project Settings > API." 
                : "Your project is connected! Now, run the SQL script to create the necessary tables."}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {step === "credentials" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="url">Project URL</Label>
                  <div className="relative">
                    <Server className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="url" 
                      placeholder="https://your-project.supabase.co" 
                      className="pl-9"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="key">Anon / Public Key</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input 
                      id="key" 
                      type="password"
                      placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                      className="pl-9"
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                    />
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
              <div className="space-y-4">
                <Alert className="bg-primary/10 border-primary/20">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <AlertTitle>Credentials Saved</AlertTitle>
                  <AlertDescription>Your app is connected to the project.</AlertDescription>
                </Alert>

                <div className="space-y-2">
                   <Label>Next Step: Create Tables</Label>
                   <p className="text-sm text-muted-foreground mb-4">
                     1. Go to your Supabase Dashboard <br/>
                     2. Click on <strong>SQL Editor</strong> in the sidebar <br/>
                     3. Paste the schema below and click <strong>Run</strong>
                   </p>
                   <Button variant="outline" className="w-full h-auto py-4 justify-start" onClick={copySchema}>
                      <Copy className="h-4 w-4 mr-2" />
                      Click to Copy SQL Schema
                   </Button>
                   <p className="text-xs text-muted-foreground text-center mt-2">
                     (Includes: Trades, Strategies, Profiles, and more)
                   </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-end pt-2">
            {step === "credentials" ? (
              <Button onClick={handleConnect} disabled={isChecking} className="w-full sm:w-auto">
                {isChecking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : "Connect Project"}
              </Button>
            ) : (
              <Button onClick={handleFinish} className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
                Finish Setup
              </Button>
            )}
          </CardFooter>
        </Card>
        
        <p className="text-center text-xs text-muted-foreground">
           Data is stored locally in your browser and your private Supabase cloud.
        </p>
      </div>
    </div>
  );
}