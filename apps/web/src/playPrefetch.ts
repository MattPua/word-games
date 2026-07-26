/** Shared play-route warm — keep out of `routeTree` to avoid HomePage ↔ router cycles. */
export const prefetchPlayPage = () => import("./pages/PlayPage");
