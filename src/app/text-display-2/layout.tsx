import './transparent.css';

export default function TextDisplayLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="transparent-bg">
            {children}
        </div>
    );
}
