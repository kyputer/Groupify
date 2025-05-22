import { useRouter } from 'next/navigation';

interface RainbowButtonProps {
    text: string;
    href?: string;
    onClick?: () => void;
    className?: string;
}

export function RainbowButton({ text, href, onClick, className = '' }: RainbowButtonProps) {
    const router = useRouter();

    const handleClick = () => {
        if (href) {
            router.push(href);
        } else if (onClick) {
            onClick();
        }
    };

    return (
        <button 
            className={`rainbow-button ${className} bg-gray-800`} 
            onClick={handleClick}
        >
            <span>{text}</span>
        </button>
    );
} 