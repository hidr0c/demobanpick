'use client';

import { useEffect, useState } from 'react';
import { getSocket, onGameEvent } from '../lib/socketClient';

interface StreamTextData {
    player1: string;
    player1Tag: string;
    player2: string;
    player2Tag: string;
    player3: string;
    player3Tag: string;
    player4: string;
    player4Tag: string;
}

export default function TextDisplayPage() {
    const [textData, setTextData] = useState<StreamTextData>({
        player1: '',
        player1Tag: '',
        player2: '',
        player2Tag: '',
        player3: '',
        player3Tag: '',
        player4: '',
        player4Tag: ''
    });
    const [isClient, setIsClient] = useState(false);

    // Listen for text data changes via Socket.IO
    useEffect(() => {
        setIsClient(true);

        // Initialize socket connection
        getSocket();

        // Load initial data from localStorage
        try {
            const saved = localStorage.getItem('streamTextData');
            if (saved) {
                setTextData(JSON.parse(saved));
            }
        } catch {
            // localStorage not available (OBS)
        }

        // Subscribe to Socket.IO updates
        const unsubSettings = onGameEvent('SETTINGS_UPDATE', (payload: any) => {
            if (payload?.textData) {
                setTextData(payload.textData);
                console.log('📝 Text display updated via Socket.IO');
            }
        });

        // Listen to storage events (fallback for same browser)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'streamTextData' && e.newValue) {
                setTextData(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            unsubSettings();
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    // Don't render during SSR
    if (!isClient) {
        return <div style={{ background: 'transparent' }} />;
    }

    const NAME_FONT_SIZE = 48;
    const TAG_FONT_SIZE = 24;
    return (
        <div className="min-h-screen w-full relative" style={{ background: 'transparent' }}>
            {/* Player 1 - positioned at 12.5% (center of first quarter) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '45.3%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: NAME_FONT_SIZE,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {textData.player1 || 'Player 1'}
                </div>
                {textData.player1Tag && (
                    <div
                        style={{
                            color: '#e5e5e5',
                            fontSize: TAG_FONT_SIZE,
                            marginTop: '4px',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.9)'
                        }}
                    >
                        {textData.player1Tag}
                    </div>
                )}
            </div>

            {/* Player 2 - positioned at 37.5% (center of second quarter) */}
            <div
                style={{
                    position: 'absolute',
                    bottom: '8px',
                    left: '79.1%',
                    transform: 'translateX(-50%)',
                    textAlign: 'center'
                }}
            >
                <div
                    style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: NAME_FONT_SIZE,
                        textShadow: '2px 2px 4px rgba(0,0,0,0.9), 0 0 10px rgba(0,0,0,0.5)',
                        whiteSpace: 'nowrap'
                    }}
                >
                    {textData.player2 || 'Player 2'}
                </div>
                {textData.player2Tag && (
                    <div
                        style={{
                            color: '#e5e5e5',
                            fontSize: TAG_FONT_SIZE,
                            marginTop: '4px',
                            textShadow: '1px 1px 3px rgba(0,0,0,0.9)'
                        }}
                    >
                        {textData.player2Tag}
                    </div>
                )}
            </div>
        </div>
    );
}
