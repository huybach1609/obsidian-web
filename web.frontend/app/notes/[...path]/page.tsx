"use client";
import Header from "@/components/Header";
import { getFilePreview } from "@/services/fileservice";
import { Button, ScrollShadow, Spinner } from "@heroui/react";
import { AlignLeft, EyeIcon, PencilIcon, WrapText } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { siteConfig } from "@/config/site";
import { decodePathParam } from "@/utils/stringhelper";

import '../../../styles/markdown.css';
import AnimatedContent from "@/components/AnimatedContent";

export default function NotesPage() {

    const params = useParams();
    const router = useRouter();
    const filePath = decodePathParam(params.path as string | string[] | undefined);

    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState('');
    const [textWrap, setTextWrap] = useState(true);

    useEffect(() => {
        // console.log('filePath', filePath);
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

    // Update browser tab title based on fileName
    useEffect(() => {
        if (filePath) {
            const fileName = filePath.split('/').pop() || filePath;
            document.title = `${fileName} - ${siteConfig.name}`;
        } else {
            document.title = siteConfig.name;
        }

        // Cleanup: reset title when component unmounts
        return () => {
            document.title = siteConfig.name;
        };
    }, [filePath]);

    return (
        <div className="h-screen overflow-hidden relative flex flex-col">
            <Header className="top-0 z-10 absolute w-full bg-background/50 backdrop-blur-sm">
                <div className="flex items-center justify-between h-full w-full">
                    <div className="flex items-center gap-2">
                        <EyeIcon className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Preview</h3>
                        <span className="text-sm text-gray-500 truncate max-w-md">
                            {filePath}
                        </span>
                    </div>
                    <div>
                        {/* wrap text button */}
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
                        <Button
                            isIconOnly
                            variant="light"
                            size="sm"
                            onPress={() => router.push(`/notes/edit/${filePath}`)}
                            aria-label="Edit"
                        >
                            <PencilIcon className="h-5 w-5" />
                        </Button>

                    </div>
                </div>
            </Header>


            <AnimatedContent animationType="blur" isContentLoading={loading}>
                <div className="h-full overflow-y-auto">
                    <div className="h-24 bg-transparent"></div>
                    <div
                        id="preview-area"
                        className={`flex-1  p-4 ${textWrap
                            ? 'break-words whitespace-pre-wrap'
                            : 'whitespace-pre overflow-x-auto'
                            }`}
                        dangerouslySetInnerHTML={{ __html: content }}
                    />
                </div>
            </AnimatedContent>
        </div>
    );
}