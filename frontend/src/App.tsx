import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";
import { createTheme, MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { Navigate, Route, Routes } from "react-router";

import { UserProvider } from "./context/UserContext";
import { MainLayout } from "./layouts/MainLayouts/MainLayout";
import { ProjectsPage } from "./pages/ProjectsPage/ProjectsPage";
import { ReviewPage } from "./pages/ReviewPage/ReviewPage";

const theme = createTheme({
    primaryColor: "brand",
    colors: {
        brand: [
            "#eef3f9", "#d9e3ef", "#b5c8de", "#8dabcb", "#6a90b9",
            "#4d7aa8", "#3D5A80", "#33486b", "#2a3e57", "#203044",
        ],
    },
    fontFamily: 'Inter, system-ui, sans-serif',
    headings: { fontFamily: '"Inter Tight", Inter, sans-serif', fontWeight: "500" },
    defaultRadius: "sm",
    shadows: { xs: "none", sm: "none", md: "none", lg: "none", xl: "none" },
});

function App(){
    return(
        <MantineProvider forceColorScheme="light" theme={theme}>
            <Notifications position="bottom-right" />
            <UserProvider>
                <Routes>
                    <Route element={<MainLayout />}>
                        <Route path="/" element={<Navigate to="/projects" replace />} />
                        <Route path="/projects" element={<ProjectsPage />} />
                        <Route path="/projects/:projectId" element={<ReviewPage />} />
                        <Route path="*" element={<Navigate to="/projects" replace />} />
                    </Route>
                </Routes>
            </UserProvider>
        </MantineProvider>
    );
}

export default App;
