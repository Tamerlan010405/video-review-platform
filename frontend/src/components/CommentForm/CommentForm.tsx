import { useState, type KeyboardEvent } from "react";
import { Button, Group, Textarea } from "@mantine/core";

import { formatTimecode } from "../../utils/timecode";
import classes from "./CommentForm.module.css";

interface CommentFormProps {
    currentFrame: number;
    fps: number;
    onFocus: () => void;
    onSubmit: (text: string) => Promise<void>;
}

export function CommentForm({ currentFrame, fps, onFocus, onSubmit }: CommentFormProps){

    const [text, setText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const isEmpty = text.trim() === "";

    async function handleSubmit(){
        if (isEmpty || isSubmitting){
            return;
        }

        setIsSubmitting(true);
        try{
            await onSubmit(text);
            setText("");
        }finally{
            setIsSubmitting(false);
        }
    }

    function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>){
        if (event.key === "Enter" && (event.ctrlKey || event.metaKey)){
            event.preventDefault();
            void handleSubmit();
        }
    }

    return(
        <div className={classes.Form}>
            <div className={classes.Label}>
                Замечание к кадру <span className={classes.Timecode}>{formatTimecode(currentFrame, fps)}</span>
            </div>

            <Textarea
                value={text}
                onChange={(event) => setText(event.currentTarget.value)}
                onFocus={onFocus}
                onKeyDown={handleKeyDown}
                placeholder="Что поправить на этом кадре?"
                aria-label="Текст комментария"
                autosize
                minRows={2}
                maxRows={5}
                maxLength={500}
            />

            <Group justify="space-between" mt={12}>
                <span className={classes.Hint}>Ctrl + Enter — отправить</span>
                <Button size="xs" onClick={handleSubmit} disabled={isEmpty} loading={isSubmitting}>
                    Отправить
                </Button>
            </Group>
        </div>
    );
}
