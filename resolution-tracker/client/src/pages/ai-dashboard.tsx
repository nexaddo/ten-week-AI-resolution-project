import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles, TrendingUp, DollarSign, Zap, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { AiModelUsage } from "@shared/schema";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface ModelComparison {
  modelName: string;
  provider: string;
  totalCalls: number;
  successfulCalls: number;
  failedCalls: number;
  successRate: string;
  avgLatency: number;
  totalCost: string;
  avgTokens: number;
}

export function AIDashboard() {
  const { data: stats = [], isLoading: statsLoading } = useQuery<AiModelUsage[]>({
    queryKey: ["/api/ai/model-stats"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai/model-stats");
      return res.json();
    },
  });

  const { data: comparison = [], isLoading: comparisonLoading } = useQuery<ModelComparison[]>({
    queryKey: ["/api/ai/model-comparison"],
    queryFn: async () => {
      const res = await apiRequest("GET", "/api/ai/model-comparison");
      return res.json();
    },
  });

  const isLoading = statsLoading || comparisonLoading;

  // Calculate summary metrics
  const totalCalls = stats.length;
  const successfulCalls = stats.filter((s) => s.status === "success").length;
  const totalCost = stats.reduce((sum, s) => sum + parseFloat(s.estimatedCost), 0);
  const avgLatency = stats.length > 0 ? stats.reduce((sum, s) => sum + s.latencyMs, 0) / stats.length : 0;
  const successRate = totalCalls > 0 ? ((successfulCalls / totalCalls) * 100).toFixed(1) : "0";

  // Prepare chart data
  const providerColors: Record<string, string> = {
    anthropic: "#8b5cf6",
    openai: "#3b82f6",
    google: "#f97316",
  };

  const costByProvider = comparison.reduce((acc, model) => {
    const existing = acc.find((item) => item.provider === model.provider);
    if (existing) {
      existing.cost += parseFloat(model.totalCost);
    } else {
      acc.push({ provider: model.provider, cost: parseFloat(model.totalCost) });
    }
    return acc;
  }, [] as { provider: string; cost: number }[]);

  const tokensByModel = comparison.map((model) => ({
    name: model.modelName.split("-").slice(0, 2).join("-"),
    tokens: model.avgTokens,
  }));

  const latencyByModel = comparison.map((model) => ({
    name: model.modelName.split("-").slice(0, 2).join("-"),
    latency: model.avgLatency,
  }));

  const getProviderBadgeColor = (provider: string) => {
    switch (provider) {
      case "anthropic":
        return "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-200";
      case "openai":
        return "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200";
      case "google":
        return "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-200";
      default:
        return "bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400 border-gray-200";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-9 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (totalCalls === 0) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-semibold flex items-center gap-2">
            <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
            AI Model Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Compare AI model performance across your check-ins
          </p>
        </div>

        <Card className="border-purple-200 dark:border-purple-900">
          <CardHeader>
            <CardTitle>No AI Analysis Data Yet</CardTitle>
            <CardDescription>
              Create check-ins to start tracking AI model performance. Make sure you have at least
              one AI API key configured in your environment variables.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-3xl font-semibold flex items-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          AI Model Analytics
        </h1>
        <p className="text-muted-foreground mt-1">
          Compare performance, cost, and quality across AI models
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total API Calls</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCalls}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {successfulCalls} successful, {totalCalls - successfulCalls} failed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(4)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              ${(totalCost / Math.max(totalCalls, 1)).toFixed(4)} per call
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Latency</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgLatency)}ms</div>
            <p className="text-xs text-muted-foreground mt-1">
              Response time per request
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              API reliability metric
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Model Comparison Table */}
      <Card>
        <CardHeader>
          <CardTitle>Model Performance Comparison</CardTitle>
          <CardDescription>
            Side-by-side comparison of all AI models used for check-in analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Total Calls</TableHead>
                  <TableHead className="text-right">Success Rate</TableHead>
                  <TableHead className="text-right">Avg Latency</TableHead>
                  <TableHead className="text-right">Total Cost</TableHead>
                  <TableHead className="text-right">Avg Tokens</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparison.map((model) => (
                  <TableRow key={model.modelName}>
                    <TableCell className="font-medium">{model.modelName}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getProviderBadgeColor(model.provider)}>
                        {model.provider}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <span>{model.totalCalls}</span>
                        <div className="flex gap-1">
                          {model.successfulCalls > 0 && (
                            <CheckCircle2 className="h-3 w-3 text-green-600" />
                          )}
                          {model.failedCalls > 0 && (
                            <XCircle className="h-3 w-3 text-red-600" />
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={
                          parseFloat(model.successRate) >= 95
                            ? "border-green-200 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-400"
                            : parseFloat(model.successRate) >= 80
                            ? "border-yellow-200 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-400"
                            : "border-red-200 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-400"
                        }
                      >
                        {model.successRate}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">{model.avgLatency}ms</TableCell>
                    <TableCell className="text-right">${model.totalCost}</TableCell>
                    <TableCell className="text-right">{model.avgTokens}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Latency Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Response Time by Model</CardTitle>
            <CardDescription>Average latency in milliseconds</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={latencyByModel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="latency" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Cost Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Cost Distribution by Provider</CardTitle>
            <CardDescription>Total spending breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costByProvider}
                  dataKey="cost"
                  nameKey="provider"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) => `${entry.provider}: $${entry.cost.toFixed(4)}`}
                >
                  {costByProvider.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={providerColors[entry.provider] || "#94a3b8"}
                    />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(4)}`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Token Usage */}
        <Card>
          <CardHeader>
            <CardTitle>Token Usage by Model</CardTitle>
            <CardDescription>Average tokens per request</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={tokensByModel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="tokens" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Success Rate Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Model Reliability</CardTitle>
            <CardDescription>Success vs failure rates</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={comparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="modelName" tickFormatter={(value) => value.split("-").slice(0, 2).join("-")} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="successfulCalls" fill="#22c55e" name="Success" stackId="a" />
                <Bar dataKey="failedCalls" fill="#ef4444" name="Failed" stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
