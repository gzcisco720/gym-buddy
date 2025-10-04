"use client";
import React from "react";
import { SiteLogo } from "@/components/svg";
import { Loader2 } from "lucide-react";
const LayoutLoader = () => {
  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="flex items-center gap-2">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    </div>
  );
};

export default LayoutLoader;
