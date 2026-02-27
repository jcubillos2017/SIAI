import {useQuery} from "@tanstack/react-query";
import {apiJson} from "@/shared/api/http";
import type {UserMe} from "@/shared/api/types";
import {getAccessToken} from "./auth";

export function useMe() {
    return useQuery({
        queryKey: ["me"],
        queryFn: () => apiJson<UserMe>("/users/me"),
        enabled: !!getAccessToken(),
    }); 
}