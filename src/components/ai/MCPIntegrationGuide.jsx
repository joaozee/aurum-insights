import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Copy, Check, Info, Zap, Shield, Code } from "lucide-react";
import { useState } from "react";

export default function MCPIntegrationGuide({ apiKey }) {
  const [copiedConfig, setCopiedConfig] = useState(null);

  const copyToClipboard = (text, configName) => {
    navigator.clipboard.writeText(text);
    setCopiedConfig(configName);
    setTimeout(() => setCopiedConfig(null), 2000);
  };

  const claudeCodeCommand = `claude mcp add --transport http --header "Authorization:Bearer ${apiKey || 'SEU_TOKEN'}" brapi https://brapi.dev/api/mcp/mcp`;

  const claudeDesktopConfig = {
    mcpServers: {
      brapi: {
        command: "npx",
        args: [
          "mcp-remote",
          "https://brapi.dev/api/mcp/mcp",
          "--header",
          `Authorization:Bearer ${apiKey || 'SEU_TOKEN'}`
        ]
      }
    }
  };

  const cursorConfig = {
    mcpServers: {
      brapi: {
        command: "npx",
        args: [
          "mcp-remote",
          "https://brapi.dev/api/mcp/mcp",
          "--header",
          "Authorization:Bearer ${BRAPI_API_KEY}"
        ],
        env: {
          BRAPI_API_KEY: apiKey || 'SEU_TOKEN'
        }
      }
    }
  };

  const vscodeConfig = {
    mcp: {
      servers: {
        brapi: {
          command: "npx",
          args: [
            "mcp-remote",
            "https://brapi.dev/api/mcp/mcp",
            "--header",
            `Authorization:Bearer ${apiKey || 'SEU_TOKEN'}`
          ]
        }
      }
    }
  };

  const tools = [
    { name: "get_available_stocks", desc: "Lista ações, FIIs, BDRs e índices", premium: false },
    { name: "get_available_currencies", desc: "Lista pares de moedas disponíveis", premium: false },
    { name: "get_available_cryptocurrencies", desc: "Lista criptomoedas disponíveis", premium: false },
    { name: "get_stock_quotes", desc: "Cotações e histórico de ações", premium: true },
    { name: "get_currency_rates", desc: "Taxas de câmbio em tempo real", premium: true },
    { name: "get_crypto_prices", desc: "Preços de criptomoedas", premium: true },
    { name: "get_inflation_data", desc: "Dados de inflação (IPCA, IGPM)", premium: true },
    { name: "get_prime_rate_data", desc: "Taxa SELIC e histórico", premium: true }
  ];

  const examples = [
    "Analise o desempenho da PETR4 no último mês",
    "Qual é a cotação atual do dólar?",
    "Compare Bitcoin e Ethereum em reais",
    "Qual é a taxa SELIC atual?",
    "Liste FIIs com maior volume",
    "Mostre a inflação acumulada no ano"
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-violet-500/20 flex items-center justify-center">
            <Zap className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white mb-2">Servidor MCP para IAs</h2>
            <p className="text-gray-400 text-sm">
              Integre dados financeiros brasileiros em tempo real com assistentes de IA usando o Model Context Protocol (MCP). 
              Funciona com Claude Code, Claude Desktop, Cursor, VS Code, n8n, e 100+ clientes compatíveis.
            </p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="claude-code" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
          <TabsTrigger value="claude-code">Claude Code</TabsTrigger>
          <TabsTrigger value="claude-desktop">Claude Desktop</TabsTrigger>
          <TabsTrigger value="cursor">Cursor</TabsTrigger>
          <TabsTrigger value="vscode">VS Code</TabsTrigger>
        </TabsList>

        <TabsContent value="claude-code" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Claude Code (CLI)</CardTitle>
              <CardDescription>Configure via linha de comando</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">Terminal</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(claudeCodeCommand, 'claude-code')}
                    className="h-6 text-xs"
                  >
                    {copiedConfig === 'claude-code' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{claudeCodeCommand}</code>
                </pre>
              </div>

              <Alert className="bg-blue-500/10 border-blue-500/20">
                <Info className="h-4 w-4 text-blue-400" />
                <AlertDescription className="text-gray-300 text-sm">
                  Use <code className="text-blue-400">--scope project</code> para configuração de projeto ou 
                  <code className="text-blue-400"> --scope user</code> para global
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="claude-desktop" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Claude Desktop</CardTitle>
              <CardDescription>Edite o arquivo de configuração</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">macOS:</span> <code className="text-gray-300">~/Library/Application Support/Claude/claude_desktop_config.json</code>
                </p>
                <p className="text-sm text-gray-400">
                  <span className="font-semibold text-white">Windows:</span> <code className="text-gray-300">%APPDATA%\Claude\claude_desktop_config.json</code>
                </p>
              </div>

              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">JSON</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(claudeDesktopConfig, null, 2), 'claude-desktop')}
                    className="h-6 text-xs"
                  >
                    {copiedConfig === 'claude-desktop' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{JSON.stringify(claudeDesktopConfig, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cursor" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Cursor</CardTitle>
              <CardDescription>Configure em ~/.cursor/mcp.json</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">JSON</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(cursorConfig, null, 2), 'cursor')}
                    className="h-6 text-xs"
                  >
                    {copiedConfig === 'cursor' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{JSON.stringify(cursorConfig, null, 2)}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vscode" className="space-y-4">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">VS Code</CardTitle>
              <CardDescription>Configure em .vscode/mcp.json</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-gray-950 rounded-lg p-4 border border-gray-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-gray-500 font-mono">JSON</span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(JSON.stringify(vscodeConfig, null, 2), 'vscode')}
                    className="h-6 text-xs"
                  >
                    {copiedConfig === 'vscode' ? (
                      <Check className="h-3 w-3 text-emerald-400" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
                <pre className="text-sm text-gray-300 overflow-x-auto">
                  <code>{JSON.stringify(vscodeConfig, null, 2)}</code>
                </pre>
              </div>

              <Alert className="bg-amber-500/10 border-amber-500/20">
                <Info className="h-4 w-4 text-amber-400" />
                <AlertDescription className="text-gray-300 text-sm">
                  Requer VS Code 1.99+ e habilitar <code className="text-amber-400">chat.mcp.enabled</code> nas configurações
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Code className="h-5 w-5 text-violet-400" />
            Ferramentas Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {tools.map((tool) => (
              <div
                key={tool.name}
                className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 border border-gray-700/50"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <code className="text-sm text-violet-400">{tool.name}</code>
                    {tool.premium && (
                      <Badge variant="outline" className="text-amber-400 border-amber-500/30 bg-amber-500/10">
                        Premium
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">{tool.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white">Exemplos de Consultas</CardTitle>
          <CardDescription>Pergunte ao assistente de IA em linguagem natural</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2">
            {examples.map((example, idx) => (
              <div
                key={idx}
                className="p-3 rounded-lg bg-gray-800/30 border border-gray-700/30 text-sm text-gray-300"
              >
                "{example}"
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Alert className="bg-emerald-500/10 border-emerald-500/20">
        <Shield className="h-4 w-4 text-emerald-400" />
        <AlertDescription className="text-gray-300 text-sm">
          <span className="font-semibold text-white">Segurança:</span> Todas as requisições usam HTTPS/TLS e validação de token. 
          Seu token nunca é compartilhado com terceiros.
        </AlertDescription>
      </Alert>
    </div>
  );
}