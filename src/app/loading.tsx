import { ZodiacWheel } from "@/components/shared/zodiac-wheel";

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 py-12 text-center">
      <ZodiacWheel size={72} className="text-primary spin-slow mb-6" />
      <p className="text-sm text-foreground-muted">Aligning the cosmos...</p>
    </div>
  );
}