import { Loader2Icon } from "lucide-react";

export const Spinner = () => {
  return (
    <div className="grid w-full place-items-center py-8">
      <Loader2Icon size={32} className="animate-spin" />
    </div>
  );
};
