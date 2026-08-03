import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function NavHistoryButtons({ className }: { className?: string }) {
  const href = useRouterState({ select: (s) => s.location.href });
  const [canBack, setCanBack] = useState(false);
  const [canForward, setCanForward] = useState(false);
  const skipRef = useRef(false);
  const visitedRef = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (skipRef.current) {
      skipRef.current = false;
    } else {
      // a fresh navigation clears the forward stack
      visitedRef.current += 1;
      setCanForward(false);
    }
    setCanBack(window.history.length > 1 && visitedRef.current > 1);
  }, [href]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onPop = () => {
      skipRef.current = true;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const goBack = () => {
    skipRef.current = true;
    setCanForward(true);
    window.history.back();
  };

  const goForward = () => {
    skipRef.current = true;
    window.history.forward();
    setCanForward(false);
  };

  return (
    <div className={`flex items-center gap-0.5 ${className ?? ""}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Back"
            disabled={!canBack}
            onClick={goBack}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Back</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            aria-label="Forward"
            disabled={!canForward}
            onClick={goForward}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Forward</TooltipContent>
      </Tooltip>
    </div>
  );
}
