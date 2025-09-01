import { useRouter } from 'next/navigation';

export function requireSpotifyAuth(){
  // TODO: implement session lookup. For now, throw to indicate unauthenticated in server actions/routes
  throw new Error("UNAUTHORIZED");
}

export function useAuthRedirect() {
  const router = useRouter();

  const handleAuthError = (error: string, currentPath?: string) => {
    if (error === "unauthorized" || error === "no_token") {
      const loginUrl = `/login?next=${encodeURIComponent(currentPath || window.location.pathname)}`;
      router.push(loginUrl);
      return true; // Indicates redirect happened
    }
    return false; // No redirect needed
  };

  return { handleAuthError };
}
