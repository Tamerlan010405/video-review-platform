import { Text } from "@mantine/core";
import { Link, useNavigate } from "react-router";

import type { User, VideoProjectSummary } from "../../types";
import { formatDate } from "../../utils/format";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import classes from "./ProjectTable.module.css";

interface ProjectTableProps {
    projects: VideoProjectSummary[];
    user: User;
    onDelete: (projectId: string) => void;
}

export function ProjectTable({ projects, user, onDelete }: ProjectTableProps){

    const navigate = useNavigate();

    return(
        <div className={classes.Wrapper}>
            <table className={classes.Table}>
                <thead>
                    <tr>
                        <th>Монтаж</th>
                        <th>Статус</th>
                        <th className={classes.Progress}>Правки</th>
                        <th className={classes.Hide}>Загрузил</th>
                        <th className={classes.Hide}>Дата</th>
                        <th aria-label="Действия" />
                    </tr>
                </thead>
                <tbody>
                    {projects.map((project, index) => {
                        const resolved = project.commentsCount - project.openCommentsCount;
                        const percent = project.commentsCount === 0 ? 0 : (resolved / project.commentsCount) * 100;
                        const canDelete = user.role === "producer" || project.uploadedBy === user.name;

                        return(
                            <tr
                                key={project.id}
                                className={`${classes.Row} vrp-rise`}
                                style={{ animationDelay: `${index * 60}ms` }}
                                onClick={() => navigate(`/projects/${project.id}`)}
                            >
                                <td>
                                    <div className={classes.Title}>
                                        <div
                                            className={classes.Poster}
                                            style={project.poster ? { backgroundImage: `url(${project.poster})` } : undefined}
                                        />
                                        <div className={classes.TitleText}>
                                            <Link
                                                to={`/projects/${project.id}`}
                                                className={classes.Link}
                                                onClick={(event) => event.stopPropagation()}
                                            >
                                                {project.title}
                                            </Link>
                                            <Text className={classes.Description} lineClamp={2}>
                                                {project.description || "Без описания"}
                                            </Text>
                                        </div>
                                    </div>
                                </td>
                                <td className={classes.Status}>
                                    <StatusBadge status={project.status} />
                                </td>
                                <td className={classes.Progress}>
                                    <div className={classes.Line} aria-hidden="true">
                                        <div className={classes.LineFill} style={{ width: `${percent}%` }} />
                                    </div>
                                    <span className={classes.ProgressText}>
                                        {project.commentsCount === 0
                                            ? "нет замечаний"
                                            : `исправлено ${resolved} из ${project.commentsCount}`}
                                    </span>
                                </td>
                                <td className={classes.Hide}>{project.uploadedBy}</td>
                                <td className={classes.Hide}>{formatDate(project.createdAt)}</td>
                                <td className={classes.Actions}>
                                    {canDelete && (
                                        <button
                                            type="button"
                                            className={classes.Delete}
                                            aria-label={`Удалить проект ${project.title}`}
                                            onClick={(event) => {
                                                event.stopPropagation();
                                                onDelete(project.id);
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
