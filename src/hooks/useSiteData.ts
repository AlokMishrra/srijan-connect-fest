import { useQuery } from "@tanstack/react-query";
import { fetchSiteData, type SiteData, DEFAULT_DATA } from "@/lib/siteData";

export const useSiteData = () => {
  return useQuery({
    queryKey: ["siteData"],
    queryFn: fetchSiteData,
    placeholderData: DEFAULT_DATA,
    staleTime: 0, // always refetch when invalidated
    gcTime: 1000 * 60 * 5, // keep in cache for 5 minutes
  });
};
