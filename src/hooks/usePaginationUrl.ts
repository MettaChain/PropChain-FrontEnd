import { useSearchParams } from "react-router-dom";

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