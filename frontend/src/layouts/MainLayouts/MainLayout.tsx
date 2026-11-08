import { Menu } from "@mantine/core";
import { Link, NavLink, Outlet } from "react-router";

import { ROLE_LABELS } from "../../constants/review";
import { useCurrentUser } from "../../context/UserContext";
import classes from "./MainLayout.module.css";

export function MainLayout(){

    const { user, users, switchUser } = useCurrentUser();

    return(
        <div className={classes.Shell}>
            <header className={classes.Header}>
                <Link to="/projects" className={classes.Logo}>
                    Video Review
                </Link>

                <nav className={classes.Nav} aria-label="Основная навигация">
                    <NavLink
                        to="/projects"
                        className={({ isActive }) => `${classes.NavItem} ${isActive ? classes.NavItemActive : ""}`}
                    >
                        Монтажи
                    </NavLink>

                    <Menu position="bottom-end" offset={8} width={260}>
                        <Menu.Target>
                            <button type="button" className={classes.User}>
                                {user.name}
                                <span className={classes.Role}>{ROLE_LABELS[user.role]}</span>
                            </button>
                        </Menu.Target>
                        <Menu.Dropdown>
                            <Menu.Label>Войти как</Menu.Label>
                            {users.map((item) => (
                                <Menu.Item
                                    key={item.id}
                                    onClick={() => switchUser(item.id)}
                                    rightSection={item.id === user.id ? <span className={classes.Current}>сейчас</span> : null}
                                >
                                    {item.name}
                                    <span className={classes.MenuRole}>{ROLE_LABELS[item.role]}</span>
                                </Menu.Item>
                            ))}
                        </Menu.Dropdown>
                    </Menu>
                </nav>
            </header>

            <main className={classes.Main}>
                <Outlet />
            </main>
        </div>
    );
}
