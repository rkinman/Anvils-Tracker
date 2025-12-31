import { 
  Moon, Sun, 
  Star, CandlestickChart, Crown, Sparkles, Gift
} from "lucide-react";
import { useTheme } from "./ThemeProvider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";

export function ThemeToggle() {
  const { setTheme, theme } = useTheme();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          {theme === 'light' && <Sun className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'dark' && <Moon className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'midnight' && <Star className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'tasty' && <CandlestickChart className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'luxury' && <Crown className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'legend' && <Sparkles className="h-[1.2rem] w-[1.2rem]" />}
          {theme === 'christmas' && <Gift className="h-[1.2rem] w-[1.2rem]" />}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="mr-2 h-4 w-4" /> Light
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="mr-2 h-4 w-4" /> Dark
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme("legend")}>
          <Sparkles className="mr-2 h-4 w-4" /> Legend
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("tasty")}>
          <CandlestickChart className="mr-2 h-4 w-4" /> Tastytrade
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("midnight")}>
          <Star className="mr-2 h-4 w-4" /> Midnight
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setTheme("luxury")}>
          <Crown className="mr-2 h-4 w-4" /> Luxury Gold
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("christmas")}>
          <Gift className="mr-2 h-4 w-4" /> Christmas
        </DropdownMenuItem>

      </DropdownMenuContent>
    </DropdownMenu>
  );
}