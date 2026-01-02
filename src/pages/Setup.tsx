import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle, AlertCircle, Database, Server, Key, Loader2,
  Copy, ExternalLink, ArrowRight, Terminal, Sparkles, Wrench
} from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { toast } from "sonner";
import { fetchSchemaContent } from "@/utils/setupHelpers";

type Step = "credentials" | "schema" | "auth" | "finish";

export default function Setup() {
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");

  // Status states
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>("credentials");

  const navigate = useNavigate();
  const { theme } = useTheme();

  useEffect(() => {
    const storedUrl = localStorage.getItem("supabase_url");
    const storedKey = localStorage.getItem("supabase_key");
    if (storedUrl) setUrl(storedUrl);
    if (storedKey) setKey(storedKey);
  }, []);

  // --- Handlers ---

  const handleConnect = async () => {
    setIsChecking(true);
    setError(null);

    try {
      if (!url || !key) throw new Error("Please enter both URL and Anon Key.");
      if (!url.startsWith("https://")) throw new Error("URL must start with https://");

      // 1. Verify credentials work
      const tempClient = createClient(url, key);
      const { error: authError } = await tempClient.auth.getSession();

      if (authError && authError.message !== "Auth session missing!") {
        console.warn("Auth check warning:", authError);
      }

      // 2. Save to local storage
      localStorage.setItem("supabase_url", url);
      localStorage.setItem("supabase_key", key);

      toast.success("Connected to Supabase!");
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
      const text = await fetchSchemaContent();
      await navigator.clipboard.writeText(text);
      toast.success("SQL Schema copied to clipboard!");
    } catch (e) {
      toast.error("Failed to load schema file.");
    }
  };

  // --- Main Setup Form ---

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
      <div className="w-full max-w-2xl space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-purple-400">
            Setup Wizard
          </h1>
          <p className="text-muted-foreground">
            {step === "credentials"
              ? "Let's connect to your database."
              : step === "schema"
                ? "Initialize the database tables."
                : step === "auth"
                  ? "Configure authentication redirects."
                  : "You are ready to go!"}
          </p>
        </div>

        <Card className="border-2 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" />
              {step === "credentials" ? "1. Connection Details" : step === "schema" ? "2. Run SQL Migration" : step === "auth" ? "3. Auth Configuration" : "Complete"}
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">

            {/* --- STEP 1: CREDENTIALS --- */}
            {step === "credentials" && (
              <>
                <div className="bg-secondary/30 p-4 rounded-lg border border-dashed border-secondary-foreground/20 flex justify-between items-center text-sm">
                  <div>
                    <span className="font-semibold block">Need a project?</span>
                    <span className="text-muted-foreground">Create a free Supabase project first.</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => window.open('https://database.new', '_blank')}>
                    Create Project <ExternalLink className="ml-2 h-3 w-3" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="url">Project URL</Label>
                    <Input
                      id="url"
                      placeholder="https://your-project.supabase.co"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="key">Anon / Public Key</Label>
                    <Input
                      id="key"
                      type="password"
                      placeholder="eyJ..."
                      value={key}
                      onChange={(e) => setKey(e.target.value)}
                      className="font-mono"
                    />
                  </div>
                </div>

                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Setup Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
              </>
            )}

            {/* --- STEP 2: SCHEMA --- */}
            {step === "schema" && (
              <div className="space-y-6">
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <CheckCircle className="h-4 w-4 text-blue-500" />
                  <AlertTitle className="text-blue-700 dark:text-blue-400">Connected</AlertTitle>
                  <AlertDescription className="text-blue-600 dark:text-blue-400/80">Now run the SQL to create your tables.</AlertDescription>
                </Alert>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="h-auto py-4 justify-between"
                    onClick={() => window.open('https://supabase.com/dashboard/project/_/sql/new', '_blank')}
                  >
                    <div className="text-left">
                      <span className="block font-semibold">1. Open SQL Editor</span>
                      <span className="text-xs text-muted-foreground">Opens in new tab</span>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    variant="default"
                    className="h-auto py-4 justify-between"
                    onClick={copySchema}
                  >
                    <div className="text-left">
                      <span className="block font-semibold">2. Copy SQL Schema</span>
                      <span className="text-xs opacity-80">Ready to paste</span>
                    </div>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="text-xs text-center text-muted-foreground bg-muted/50 p-2 rounded">
                  Paste the schema into the editor and click "Run".
                </div>
              </div>
            )}

            {/* --- STEP 3: AUTH REDIRECTS --- */}
            {step === "auth" && (
              <div className="space-y-5">
                <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                  <h4 className="font-semibold text-sm flex items-center gap-2 mb-2">
                    <Key className="h-4 w-4" />
                    Crucial for Login
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To ensure users are redirected back to your app after confirming their email, you must configure the URL settings in Supabase.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold">1</div>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-sm"
                      onClick={() => window.open('https://supabase.com/dashboard/project/_/auth/url-configuration', '_blank')}
                    >
                      Open URL Configuration <ExternalLink className="ml-1 h-3 w-3" />
                    </Button>
                  </div>

                  <div className="space-y-2 ml-9">
                    <div className="p-3 bg-muted rounded border text-xs space-y-2">
                      <div>
                        <span className="font-semibold block text-primary">Site URL:</span>
                        <code className="bg-background px-1 rounded border border-primary/20">{window.location.origin}</code>
                      </div>
                      <div>
                        <span className="font-semibold block text-primary">Redirect URLs:</span>
                        <code className="bg-background px-1 rounded border border-primary/20">{window.location.origin}/**</code>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* --- STEP 4: FINISH --- */}
            {step === "finish" && (
              <div className="space-y-6 py-6 text-center">
                <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-semibold">Setup Complete!</h3>
                  <p className="text-muted-foreground">Your trading journal is fully configured and ready.</p>
                </div>
              </div>
            )}

          </CardContent>

          <CardFooter className="flex justify-between pt-2 border-t bg-muted/5 p-6 rounded-b-xl">
            {step !== "credentials" && step !== "finish" ? (
              <Button variant="ghost" onClick={() => {
                if (step === "schema") setStep("credentials");
                if (step === "auth") setStep("schema");
              }}>
                Back
              </Button>
            ) : (
              <div />
            )}

            {step === "credentials" && (
              <Button onClick={handleConnect} disabled={isChecking} className="px-8 transition-all active:scale-95">
                {isChecking ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Connecting...</> : "Connect Database"}
              </Button>
            )}

            {step === "schema" && (
              <Button onClick={() => setStep("auth")} className="px-8 transition-all active:scale-95">
                Next: Configuration
              </Button>
            )}

            {step === "auth" && (
              <Button onClick={() => setStep("finish")} className="px-8 transition-all active:scale-95">
                Final Step
              </Button>
            )}

            {step === "finish" && (
              <Button onClick={handleFinish} className="w-full bg-green-600 hover:bg-green-700 transition-all active:scale-95">
                Launch App
              </Button>
            )}
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


