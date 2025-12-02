"use client";
import Header from "@/components/Header";
import { getFilePreview } from "@/services/fileservice";
import { Button, ScrollShadow, Spinner } from "@heroui/react";
import { AlignLeft, EyeIcon, WrapText } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import '../../../styles/markdown.css';

export default function NotesPage() {
    const params = useParams();
    const filePath = decodeURIComponent(
        Array.isArray(params.path)
            ? params.path.join('/')
            : params.path ?? ''
    );

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [textWrap, setTextWrap] = useState(true);

    useEffect(() => {
        console.log('filePath', filePath);
        setLoading(true);
        getFilePreview(filePath ?? '').then(response => {
            setContent(response);
            setLoading(false);
        }).catch(error => {
            console.error('Error loading file:', error);
            setLoading(false);
        }).finally(() => {
            setLoading(false);
        });
    }, [filePath]);





    return (
        <div className="flex flex-col h-full bg-background text-foreground">
            <Header>
                <div className="flex items-center justify-between h-full w-full">
                    <div className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Preview</h3>
                        <span className="text-sm text-gray-500 truncate max-w-md">
                            {filePath}
                        </span>
                    </div>
                    <Button
                        isIconOnly
                        variant="light"
                        size="sm"
                        onPress={() => setTextWrap(!textWrap)}
                        aria-label={textWrap ? "Disable text wrap" : "Enable text wrap"}
                    >
                        {textWrap ? (
                            <WrapText className="h-5 w-5" />
                        ) : (
                            <AlignLeft className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </Header>

            {loading ? (
                <div className="flex items-center justify-center h-[90%]">
                    <Spinner />
                </div>
            ) : (
                <ScrollShadow className="flex-1">
                    <div
                        id="preview-area"
                        className={`flex-1 overflow-auto p-4 ${textWrap
                            ? 'break-words whitespace-pre-wrap'
                            : 'whitespace-pre overflow-x-auto'
                            }`}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </ScrollShadow>
            )}
        </div>
    );
}