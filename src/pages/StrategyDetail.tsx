import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardLayout from "@/components/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { showSuccess, showError } from "@/utils/toast";
import { Loader2, Save, Plus, ArrowLeft, Unlink, Search } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

// Simplified Trade type for this page
interface Trade {
  id: string;
  date: string;
  symbol: string;
  action: string;
  amount: number;
}

export default function StrategyDetail() {
  const { strategyId } = useParams<{ strategyId: string }>();
  const queryClient = useQueryClient();
  const [isAddTradesOpen, setIsAddTradesOpen] = useState(false);
  const [selectedUnassigned, setSelectedUnassigned] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  // --- QUERIES ---
  const { data: strategy, isLoading: strategyLoading } = useQuery({
    queryKey: ['strategy', strategyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('strategies').select('*').eq('id', strategyId!).single();
      if (error) throw error;
      return data;
    }
  });

  const [formState, setFormState] = useState({ name: strategy?.name || '', description: strategy?.description || '' });
  useState(() => {
    if (strategy) {
      setFormState({ name: strategy.name, description: strategy.description || '' });
    }
  }, [strategy]);

  const { data: assignedTrades, isLoading: assignedTradesLoading } = useQuery<Trade[]>({
    queryKey: ['assignedTrades', strategyId],
    queryFn: async () => {
      const { data, error } = await supabase.from('trades').select('id, date, symbol, action, amount').eq('strategy_id', strategyId!);
      if (error) throw error;
      return data;
    }
  });

  const { data: unassignedTrades, isLoading: unassignedTradesLoading } = useQuery<Trade[]>({
    queryKey: ['unassignedTrades'],
    queryFn: async () => {
      const { data, error } = await supabase.from('trades').select('id, date, symbol, action, amount').is('strategy_id', null).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: isAddTradesOpen, // Only fetch when the dialog is open
  });

  // --- MUTATIONS ---
  const updateStrategyMutation = useMutation({
    mutationFn: async (details: { name: string; description: string }) => {
      const { error } = await supabase.from('strategies').update(details).eq('id', strategyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['strategy', strategyId] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] }); // To update list page
      showSuccess("Strategy updated");
    },
    onError: (err) => showError(err.message)
  });

  const unassignTradeMutation = useMutation({
    mutationFn: async (tradeId: string) => {
      const { error } = await supabase.from('trades').update({ strategy_id: null }).eq('id', tradeId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignedTrades', strategyId] });
      queryClient.invalidateQueries({ queryKey: ['unassignedTrades'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] }); // For stats
      showSuccess("Trade unassigned");
    },
    onError: (err) => showError(err.message)
  });

  const assignTradesMutation = useMutation({
    mutationFn: async (tradeIds: string[]) => {
      const { error } = await supabase.from('trades').update({ strategy_id: strategyId }).in('id', tradeIds);
      if (error) throw error;
    },
    onSuccess: (_, tradeIds) => {
      queryClient.invalidateQueries({ queryKey: ['assignedTrades', strategyId] });
      queryClient.invalidateQueries({ queryKey: ['unassignedTrades'] });
      queryClient.invalidateQueries({ queryKey: ['strategies'] });
      showSuccess(`Assigned ${tradeIds.length} trades`);
      setSelectedUnassigned([]);
      setIsAddTradesOpen(false);
    },
    onError: (err) => showError(err.message)
  });

  // --- HANDLERS ---
  const handleSave = () => {
    if (!formState.name.trim()) {
      showError("Strategy name cannot be empty.");
      return;
    }
    updateStrategyMutation.mutate(formState);
  };

  const handleAddSelected = () => {
    if (selectedUnassigned.length === 0) {
      showError("No trades selected.");
      return;
    }
    assignTradesMutation.mutate(selectedUnassigned);
  };

  const filteredUnassignedTrades = useMemo(() =>
    unassignedTrades?.filter(trade =>
      trade.symbol.toLowerCase().includes(searchTerm.toLowerCase())
    ), [unassignedTrades, searchTerm]);

  if (strategyLoading) {
    return <DashboardLayout><div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Link to="/strategies" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="h-4 w-4" />
          Back to Strategies
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Strategy Details</CardTitle>
            <CardDescription>Edit the name and description for this strategy.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Strategy Name</Label>
              <Input id="name" value={formState.name} onChange={(e) => setFormState({ ...formState, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formState.description} onChange={(e) => setFormState({ ...formState, description: e.target.value })} />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSave} disabled={updateStrategyMutation.isPending}>
              {updateStrategyMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Assigned Trades</CardTitle>
              <CardDescription>Trades currently part of this strategy.</CardDescription>
            </div>
            <Dialog open={isAddTradesOpen} onOpenChange={setIsAddTradesOpen}>
              <DialogTrigger asChild>
                <Button><Plus className="mr-2 h-4 w-4" /> Add Trades</Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl">
                <DialogHeader>
                  <DialogTitle>Add Unassigned Trades</DialogTitle>
                  <DialogDescription>Select trades to add to "{strategy?.name}".</DialogDescription>
                </DialogHeader>
                <div className="relative my-4">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search by symbol..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <div className="max-h-[50vh] overflow-y-auto border rounded-md">
                  {unassignedTradesLoading ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12"></TableHead>
                          <TableHead>Date</TableHead>
                          <TableHead>Symbol</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredUnassignedTrades?.map(trade => (
                          <TableRow key={trade.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedUnassigned.includes(trade.id)}
                                onCheckedChange={(checked) => {
                                  setSelectedUnassigned(prev => checked ? [...prev, trade.id] : prev.filter(id => id !== trade.id));
                                }}
                              />
                            </TableCell>
                            <TableCell>{format(new Date(trade.date), 'MMM d, yyyy')}</TableCell>
                            <TableCell><Badge variant="outline" className="font-mono">{trade.symbol}</Badge></TableCell>
                            <TableCell>{trade.action}</TableCell>
                            <TableCell className={`text-right font-bold ${trade.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trade.amount)}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddTradesOpen(false)}>Cancel</Button>
                  <Button onClick={handleAddSelected} disabled={assignTradesMutation.isPending || selectedUnassigned.length === 0}>
                    {assignTradesMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Add Selected ({selectedUnassigned.length})
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {assignedTradesLoading ? <div className="text-center p-8"><Loader2 className="h-6 w-6 animate-spin mx-auto" /></div> : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignedTrades?.map(trade => (
                    <TableRow key={trade.id}>
                      <TableCell>{format(new Date(trade.date), 'MMM d, yyyy')}</TableCell>
                      <TableCell><Badge variant="outline" className="font-mono">{trade.symbol}</Badge></TableCell>
                      <TableCell>{trade.action}</TableCell>
                      <TableCell className={`text-right font-bold ${trade.amount >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(trade.amount)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => unassignTradeMutation.mutate(trade.id)} disabled={unassignTradeMutation.isPending}>
                          <Unlink className="mr-2 h-4 w-4" /> Unassign
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}