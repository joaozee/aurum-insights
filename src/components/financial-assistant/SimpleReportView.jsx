import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export default function SimpleReportView({ title, sections }) {
  return (
    <Card className="bg-gray-800/50 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sections?.map((section, idx) => (
          <div key={idx} className="bg-gray-900/50 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-violet-400 mb-3">{section.title}</h4>
            <div className="space-y-2">
              {section.items?.map((item, itemIdx) => (
                <div key={itemIdx} className="flex items-center justify-between py-2 border-b border-gray-700/50 last:border-0">
                  <span className="text-sm text-gray-300">{item.label}</span>
                  <div className="flex items-center gap-2">
                    {item.trend && (
                      item.trend > 0 ? 
                        <TrendingUp className="h-4 w-4 text-emerald-400" /> :
                        <TrendingDown className="h-4 w-4 text-red-400" />
                    )}
                    <span className={cn(
                      "text-sm font-semibold",
                      item.highlight ? "text-white" : "text-gray-400"
                    )}>
                      {item.value}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            {section.recommendation && (
              <div className="mt-3 p-3 bg-violet-500/10 border border-violet-500/30 rounded-lg">
                <p className="text-xs text-violet-300">{section.recommendation}</p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}