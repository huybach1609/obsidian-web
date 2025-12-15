export function decodePathParam(param: string | string[] | undefined): string {
    return decodeURIComponent(
        Array.isArray(param)
            ? param.join('/')
            : param ?? ''
    );
}


