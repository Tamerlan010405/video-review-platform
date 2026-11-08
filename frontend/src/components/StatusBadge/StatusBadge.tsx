import { STATUS_META } from "../../constants/review";
import type { ReviewStatus } from "../../types";
import classes from "./StatusBadge.module.css";

interface StatusBadgeProps {
    status: ReviewStatus;
}

// Статус — цветная точка и слово: серая, янтарная, зелёная
export function StatusBadge({ status }: StatusBadgeProps){
    return(
        <span className={classes.Status}>
            <span className={classes.Dot} data-status={status} />
            {STATUS_META[status].label}
        </span>
    );
}
