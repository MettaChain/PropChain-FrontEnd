// Property domain - combines property, portfolio, favorites, comparison stores
export { usePortfolioStore } from '../portfolioStore';
export { useFavoritesStore } from '../favoritesStore';
// Selection and history now live in one store (#1090).
export { useCompareStore, MAX_COMPARE, MAX_HISTORY } from '../compareStore';
export type { ComparisonHistory } from '../compareStore';
export { useRecentlyViewedStore } from '../recentlyViewedStore';
export { useCertificateStore } from '../certificateStore';
