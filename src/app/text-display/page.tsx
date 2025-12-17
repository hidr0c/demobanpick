'use client';

import { useEffect, useState } from 'react';
import { subscribeToMessages, ChannelMessage } from '../lib/gameChannel';

interface StreamTextData {
    player1: string;
    player1Tag: string;
    player2: string;
    player2Tag: string;
    player3: string;
    player3Tag: string;
    player4: string;
    player4Tag: string;
    roundName: string;
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
        player4Tag: '',
        roundName: ''
    });

    // Listen for text data changes via BroadcastChannel
    useEffect(() => {
        // Load initial data from localStorage
        try {
            const saved = localStorage.getItem('streamTextData');
            if (saved) {
                setTextData(JSON.parse(saved));
            }
        } catch {
            // localStorage not available (OBS)
        }

        // Subscribe to BroadcastChannel updates
        const unsubscribe = subscribeToMessages((message: ChannelMessage) => {
            if (message.type === 'SETTINGS_UPDATE' && message.payload?.textData) {
                setTextData(message.payload.textData);
            }
        });

        // Also listen to storage events (fallback)
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'streamTextData' && e.newValue) {
                setTextData(JSON.parse(e.newValue));
            }
        };
        window.addEventListener('storage', handleStorage);

        return () => {
            unsubscribe();
            window.removeEventListener('storage', handleStorage);
        };
    }, []);

    return (
        <div className="min-h-screen w-full relative" style={{ background: 'transparent' }}>
            {/* Row 1: Round Name - Top Left */}
            <div
                className="absolute"
                style={{
                    top: '8px',
                    left: '16px',
                    right: '16px'
                }}
            >
                <div
                    className="px-4 py-2 rounded-lg inline-block"
                    style={{
                        background: 'rgba(0, 0, 0, 0.7)',
                        backdropFilter: 'blur(4px)'
                    }}
                >
                    <span className="text-white font-bold text-lg">
                        {textData.roundName || 'Round Name'}
                    </span>
                </div>
            </div>

            {/* Row 2: Player Names */}
            <div
                className="absolute flex justify-between"
                style={{
                    top: '60px',
                    left: '16px',
                    right: '16px'
                }}
            >
                {/* Player 1 */}
                <div className="text-center">
                    <div className="text-white font-bold text-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {textData.player1 || 'Player 1'}
                    </div>
                    {textData.player1Tag && (
                        <div className="text-gray-300 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {textData.player1Tag}
                        </div>
                    )}
                </div>

                {/* Player 2 */}
                <div className="text-center">
                    <div className="text-white font-bold text-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {textData.player2 || 'Player 2'}
                    </div>
                    {textData.player2Tag && (
                        <div className="text-gray-300 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {textData.player2Tag}
                        </div>
                    )}
                </div>

                {/* Player 3 */}
                <div className="text-center">
                    <div className="text-white font-bold text-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {textData.player3 || 'Player 3'}
                    </div>
                    {textData.player3Tag && (
                        <div className="text-gray-300 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {textData.player3Tag}
                        </div>
                    )}
                </div>

                {/* Player 4 */}
                <div className="text-center">
                    <div className="text-white font-bold text-2xl" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                        {textData.player4 || 'Player 4'}
                    </div>
                    {textData.player4Tag && (
                        <div className="text-gray-300 text-sm" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                            {textData.player4Tag}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
