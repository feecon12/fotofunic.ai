import { toast } from "sonner";

interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function useToast() {
  return {
    toast: (options: ToastOptions) => {
      const { title, description, variant } = options;
      const message = title
        ? `${title}${description ? ": " + description : ""}`
        : description;

      if (variant === "destructive") {
        toast.error(message);
      } else {
        toast.success(message);
      }
    },
  };
}
