import { useState, useEffect } from 'react';

interface CopyButtonProps {
    value: string;
}

const unsecuredCopyToClipboard = (text:string) => { 
    const textArea = document.createElement("textarea"); 
    textArea.value=text; 
    document.body.appendChild(textArea); 
    textArea.focus();
    textArea.select(); 
    try{
        document.execCommand('copy')
    } catch(err) {
        console.error('Unable to copy to clipboard',err)
    }
    document.body.removeChild(textArea)
};

export const CopyButton = ({ value }: CopyButtonProps) => {
    const [copied, setCopied] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleCopy = () => {
        if (window.isSecureContext && navigator.clipboard) {
            navigator.clipboard.writeText(value);
        } else {
            unsecuredCopyToClipboard(value);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 3000);
    };

    return (
        <div className="flex flex-row items-center justify-center">
            <button 
                className={`px-4 py-2 rounded-md ml-4 flex items-center gap-2 transition-all duration-300 ${
                    copied 
                        ? 'bg-[#5230ff]' 
                        : 'bg-gray-800 hover:bg-gray-700'
                } text-white`}
                onClick={handleCopy}
                aria-label={copied ? "Copied to clipboard" : "Copy to clipboard"}
            >
                {copied ? (
                    isMobile ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                        </svg>
                    ) : (
                        <>
                            <span>Copied</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </>
                    )
                ) : (
                    'Copy'
                )}
            </button>
        </div>
    );
};