import { useState } from "react";
import { Alert, Button, FileInput, Group, Modal, Progress, Select, Stack, Text, Textarea, TextInput } from "@mantine/core";
import { useForm } from "@mantine/form";

import { ApiError } from "../../api/client";
import { createProject } from "../../api/projects";
import { DEFAULT_FPS, FPS_OPTIONS, MAX_FILE_SIZE_MB } from "../../constants/review";
import type { VideoProject } from "../../types";
import { capturePoster } from "../../utils/capturePoster";

interface UploadModalProps {
    opened: boolean;
    onClose: () => void;
    onCreated: (project: VideoProject) => void;
}

interface UploadFormValues {
    title: string;
    description: string;
    fps: string;
    file: File | null;
}

export function UploadModal({ opened, onClose, onCreated }: UploadModalProps){

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [progress, setProgress] = useState<number | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    const form = useForm<UploadFormValues>({
        initialValues: {
            title: "",
            description: "",
            fps: String(DEFAULT_FPS),
            file: null,
        },
        validate: {
            title: (value) => (value.trim() === "" ? "Введите название монтажа" : null),
            file: (value) => {
                if (!value){
                    return "Выберите видеофайл";
                }
                if (!value.type.startsWith("video/")){
                    return "Файл должен быть видео";
                }
                if (value.size > MAX_FILE_SIZE_MB * 1024 * 1024){
                    return `Размер файла не больше ${MAX_FILE_SIZE_MB} МБ`;
                }
                return null;
            },
        },
    });

    function handleClose(){
        if (isSubmitting){
            return;
        }
        form.reset();
        setApiError(null);
        onClose();
    }

    async function handleSubmit(values: UploadFormValues){
        if (!values.file){
            return;
        }

        setIsSubmitting(true);
        setProgress(0);
        setApiError(null);
        try{
            const poster = await capturePoster(values.file);
            const project = await createProject(
                {
                    title: values.title,
                    description: values.description,
                    fps: Number(values.fps),
                    file: values.file,
                    poster,
                },
                setProgress,
            );
            form.reset();
            onCreated(project);
        }catch(caught){
            // Ошибку валидации с сервера показываем у нужного поля, остальные — над кнопками
            if (caught instanceof ApiError && caught.field && caught.field in values){
                form.setFieldError(caught.field, caught.message);
            }else{
                setApiError(caught instanceof Error ? caught.message : "Не удалось загрузить монтаж");
            }
        }finally{
            setIsSubmitting(false);
            setProgress(null);
        }
    }

    return(
        <Modal opened={opened} onClose={handleClose} title="Загрузить черновой монтаж" centered size="md">
            <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
                <Stack gap={14}>
                    <TextInput
                        label="Название"
                        placeholder="Например, Промо-ролик v2"
                        withAsterisk
                        {...form.getInputProps("title")}
                    />
                    <Textarea
                        label="Описание"
                        placeholder="На что обратить внимание ревьюерам"
                        autosize
                        minRows={2}
                        maxRows={4}
                        {...form.getInputProps("description")}
                    />
                    <Select
                        label="Частота кадров"
                        description="Нужна для точной привязки комментариев к кадрам"
                        data={FPS_OPTIONS.map((value) => ({ value, label: `${value} fps` }))}
                        allowDeselect={false}
                        {...form.getInputProps("fps")}
                    />
                    <FileInput
                        label="Видеофайл"
                        placeholder="Выберите файл"
                        accept="video/*"
                        withAsterisk
                        clearable
                        {...form.getInputProps("file")}
                    />

                    {progress !== null && (
                        <div>
                            <Progress value={progress} size="sm" aria-label="Прогресс загрузки" />
                            <Text size="xs" c="dimmed" mt={6}>
                                {progress < 100 ? `Загрузка файла: ${progress}%` : "Файл отправлен, сервер обрабатывает…"}
                            </Text>
                        </div>
                    )}

                    {apiError && (
                        <Alert color="brand" variant="light">
                            {apiError}
                        </Alert>
                    )}

                    <Group justify="flex-end" mt={4}>
                        <Button variant="default" onClick={handleClose} disabled={isSubmitting}>
                            Отмена
                        </Button>
                        <Button type="submit" loading={isSubmitting}>
                            Загрузить
                        </Button>
                    </Group>
                </Stack>
            </form>
        </Modal>
    );
}
