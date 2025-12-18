import './transparent.css';

export default function MatchDisplay2Layout({
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
