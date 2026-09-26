import { useSearchParams } from "react-router-dom";

/**
 * Reads and writes pagination state through the URL query string, so a paged
 * view survives reload and can be shared as a link.
 */
export function usePaginationUrl() {
    const [searchParams, setSearchParams] = useSearchParams();

    const page =
        Number(searchParams.get("page")) || 1;

    const setPage = (newPage: number) => {
        searchParams.set("page", newPage.toString());
        setSearchParams(searchParams);
    };

    return {
        page,
        setPage,
    };
}