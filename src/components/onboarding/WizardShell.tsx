"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface WizardStep {
  label: string;
  description: string;
}

interface WizardShellProps {
  steps: WizardStep[];
  currentStep: number;
  onBack: () => void;
  children: ReactNode;
}

export function WizardShell({
  steps,
  currentStep,
  onBack,
  children,
}: WizardShellProps) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight">Marketary</h1>
          <span className="text-sm text-muted-foreground">Setup</span>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {currentStep} of {steps.length}
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b px-6 py-3">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          {steps.map((step, i) => {
            const stepNum = i + 1;
            const isActive = stepNum === currentStep;
            const isComplete = stepNum < currentStep;
            return (
              <div key={step.label} className="flex flex-1 items-center gap-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors",
                      isComplete && "bg-primary text-primary-foreground",
                      isActive && "bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                      !isActive && !isComplete && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isComplete ? (
                      <svg className="h-3.5 w-3.5" viewBox="0 0 12 12" fill="none">
                        <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : (
                      stepNum
                    )}
                  </div>
                  <span
                    className={cn(
                      "hidden text-xs md:block",
                      isActive ? "font-medium text-foreground" : "text-muted-foreground"
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {i < steps.length - 1 && (
                  <div
                    className={cn(
                      "h-px flex-1",
                      i === 1
                        ? "bg-transparent"
                        : isComplete
                          ? "bg-primary"
                          : "bg-border"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <main className="flex flex-1 justify-center overflow-auto px-6 py-8">
        <div className="w-full max-w-2xl">
          {currentStep > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 -ml-2 gap-1.5 text-muted-foreground"
              onClick={onBack}
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          )}
          {children}
        </div>
      </main>
    </div>
  );
}
