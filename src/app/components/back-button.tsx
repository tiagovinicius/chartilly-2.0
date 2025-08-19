"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export function BackButton(){
  const router = useRouter();
  return (
    <div className="mt-4 flex items-center justify-start pb-3">
      <Button
        type="button"
        variant="secondary"
        size="icon"
        className="rounded-full w-12 h-12"
        aria-label="Back"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-6 h-6" />
      </Button>
    </div>
  );
}
