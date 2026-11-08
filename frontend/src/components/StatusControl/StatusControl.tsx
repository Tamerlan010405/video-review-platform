import { useState } from "react";
import { Button, Group, Popover, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";

import { ROLE_LABELS, STATUS_META } from "../../constants/review";
import type { ReviewStatus, StatusChange, User } from "../../types";
import { formatDateTime } from "../../utils/format";
import { StatusBadge } from "../StatusBadge/StatusBadge";
import classes from "./StatusControl.module.css";

interface StatusControlProps {
    status: ReviewStatus;
    history: StatusChange[];
    user: User;
    openCommentsCount: number;
    onChange: (status: ReviewStatus) => Promise<void>;
}

const PRODUCER_ACTIONS: ReviewStatus[] = ["revision", "approved"];

export function StatusControl({ status, history, user, openCommentsCount, onChange }: StatusControlProps){

    const [pendingStatus, setPendingStatus] = useState<ReviewStatus | null>(null);

    const isProducer = user.role === "producer";

    async function handleChange(next: ReviewStatus){
        setPendingStatus(next);
        try{
            await onChange(next);
            notifications.show({
                color: "dark",
                message: `Статус изменён: ${STATUS_META[next].label}`,
            });
        }catch(caught){
            notifications.show({
                color: "brand",
                title: "Не удалось изменить статус",
                message: caught instanceof Error ? caught.message : "Неизвестная ошибка",
            });
        }finally{
            setPendingStatus(null);
        }
    }

    return(
        <Group gap={24} wrap="nowrap">
            <StatusBadge status={status} />

            {isProducer ? (
                <Group gap={8} wrap="nowrap">
                    {PRODUCER_ACTIONS.map((action) => (
                        <Button
                            key={action}
                            size="xs"
                            variant={action === "approved" ? "filled" : "default"}
                            loading={pendingStatus === action}
                            disabled={status === action || pendingStatus !== null}
                            onClick={() => handleChange(action)}
                        >
                            {STATUS_META[action].label}
                        </Button>
                    ))}
                </Group>
            ) : (
                <Text className={classes.Note}>Статус меняет продюсер · вы: {ROLE_LABELS[user.role]}</Text>
            )}

            {isProducer && status !== "approved" && openCommentsCount > 0 && (
                <Text className={classes.Warning}>Открытых замечаний: {openCommentsCount}</Text>
            )}

            <Popover position="bottom-end" width={340}>
                <Popover.Target>
                    <button type="button" className={classes.HistoryButton}>История</button>
                </Popover.Target>
                <Popover.Dropdown>
                    <Text className={classes.HistoryTitle}>История статусов</Text>
                    <ol className={classes.History}>
                        {[...history].reverse().map((change) => (
                            <li key={`${change.status}-${change.changedAt}`} className={classes.HistoryItem}>
                                <span>
                                    {STATUS_META[change.status].label}
                                    <span className={classes.Who}> · {change.changedBy}</span>
                                </span>
                                <span className={classes.HistoryDate}>{formatDateTime(change.changedAt)}</span>
                            </li>
                        ))}
                    </ol>
                </Popover.Dropdown>
            </Popover>
        </Group>
    );
}
