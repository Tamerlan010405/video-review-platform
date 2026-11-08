export function formatDate(value: string | undefined): string {
    if (!value){
        return "–";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())){
        return "–";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    }).format(date);
}

export function formatDateTime(value: string | undefined): string {
    if (!value){
        return "–";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())){
        return "–";
    }

    return new Intl.DateTimeFormat("ru-RU", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
}

export function getInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? "")
        .join("");
}

export function createId(prefix: string): string {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}
