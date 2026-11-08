import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import { setApiUser } from "../api/client";
import { USERS } from "../constants/review";
import type { User } from "../types";

const CURRENT_USER_KEY = "vrp:current-user";

interface UserContextValue {
    user: User;
    users: User[];
    switchUser: (userId: string) => void;
}

const UserContext = createContext<UserContextValue | null>(null);

function loadInitialUser(): User {
    let user = USERS[0];

    try{
        const savedId = localStorage.getItem(CURRENT_USER_KEY);
        user = USERS.find((item) => item.id === savedId) ?? USERS[0];
    }catch{
        // localStorage недоступен — берём первого пользователя
    }

    // Заголовок X-User-Id должен быть задан до первого запроса дочерних компонентов
    setApiUser(user.id);
    return user;
}

export function UserProvider({ children }: { children: ReactNode }){

    const [user, setUser] = useState<User>(loadInitialUser);

    const switchUser = useCallback((userId: string) => {
        const next = USERS.find((item) => item.id === userId);

        if (!next){
            return;
        }

        setApiUser(next.id);
        setUser(next);
        try{
            localStorage.setItem(CURRENT_USER_KEY, next.id);
        }catch{
            // хранилище недоступно — роль просто не запомнится
        }
    }, []);

    const value = useMemo(() => ({ user, users: USERS, switchUser }), [user, switchUser]);

    return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useCurrentUser(): UserContextValue {
    const context = useContext(UserContext);

    if (!context){
        throw new Error("useCurrentUser должен использоваться внутри UserProvider");
    }
    return context;
}
