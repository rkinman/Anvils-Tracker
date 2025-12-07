import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Plus, Trash2, TrendingUp, TrendingDown, Target } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { showSuccess, showError } from "@/utils/toast";
import { Badge } from "@/components/ui/badge";

export default function Strategies() {
  const [isOpen, setIsOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState({ name: "", description: "" });
  const queryClient = useQueryClient();

  // Fetch strategies using the efficient View
  const { data: strategies, isLoading } = useQuery({
    queryKey: ['strategies'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('strategy_performance')
        .select('*')
        .order('realized_pnl', { ascending: false });

      if (error) throw error;
      return data;
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not found");
      
      const { error } = await supabase.from('strategies').insert({
        ...data,
        user_id: user.id
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      setIsOpen(false);
      setNewStrategy({ name: "", description: "" });
      showSuccess("Strategy created successfully");
    },
    onError: (error) => {
      showError(error.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('strategies').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      showSuccess("Strategy deleted");
    }
  });

  const handleCreate = () => {
    if (!newStrategy.name) {
      showError("Strategy name is required");
      return;
    }
    createMutation.mutate(newStrategy);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Strategies</h2>
            <p className="text-muted-foreground">Group your trades to track specific campaigns.</p>
          </div>
          
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> New Strategy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Strategy</DialogTitle>
                <DialogDescription>
                  Create a container to group related trades (e.g., "Iron Condor AAPL").
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name</Label>
                  <Input 
                    id="name" 
                    placeholder="e.g. SPY Wheel Strategy" 
                    value={newStrategy.name}
                    onChange={(e) => setNewStrategy({ ...newStrategy, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="desc">Description (Optional)</Label>
                  <Textarea 
                    id="desc" 
                    placeholder="Notes about this strategy..."
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy({ ...newStrategy, description: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleCreate} disabled={createMutation.isPending}>
                  {createMutation.isPending ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoading ? (
          <div className="text-center py-10">Loading strategies...</div>
        ) : strategies?.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 border border-dashed rounded-lg bg-muted/10 text-center">
            <Target className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium">No Strategies Yet</h3>
            <p className="text-muted-foreground max-w-sm mb-4">
              Create a strategy to start grouping your trades and tracking P&L for specific setups.
            </p>
            <Button onClick={() => setIsOpen(true)}>Create Your First Strategy</Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {strategies?.map((strategy) => {
              const unrealizedPnL = Number(strategy.total_pnl) - Number(strategy.realized_pnl);
              const isPositive = strategy.realized_pnl >= 0;

              return (
                <Card key={strategy.id} className="flex flex-col">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{strategy.name}</CardTitle>
                        <CardDescription className="line-clamp-1 mt-1">
                          {strategy.description || "No description"}
                        </CardDescription>
                      </div>
                      {isPositive ? (
                        <TrendingUp className="h-5 w-5 text-green-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2 flex-1">
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Realized P&L</p>
                        <p className={`text-xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(strategy.realized_pnl)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground">Unrealized P&L</p>
                        <p className={`text-xl font-bold ${unrealizedPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(unrealizedPnL)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground">Total Trades</p>
                      <p className="text-xl font-bold">{strategy.trade_count}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-4 border-t flex justify-between">
                     <div className="flex gap-2">
                        <Badge variant="secondary">
                          {strategy.win_count}W / {strategy.loss_count}L (Realized)
                        </Badge>
                     </div>
                     <div className="flex gap-2">
                       <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => {
                          if(confirm('Are you sure? This will unlink all trades from this strategy.')) {
                            deleteMutation.mutate(strategy.id);
                          }
                       }}>
                          <Trash2 className="h-4 w-4" />
                       </Button>
                     </div>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}