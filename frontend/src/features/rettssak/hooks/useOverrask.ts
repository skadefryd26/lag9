import { useMutation } from "@tanstack/react-query";
import { hentOverraskendeSak } from "../api/rettssakApi";
import type { Drama } from "../types/kontrakt";

export function useOverrask(påSak: (saksTekst: string) => void) {
  return useMutation({
    mutationFn: (drama: Drama) => hentOverraskendeSak(drama),
    onSuccess: påSak,
  });
}
