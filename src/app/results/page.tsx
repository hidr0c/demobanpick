'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Song } from '../interface';

export default function Results() {
  const [history, setHistory] = useState<Song[]>([]);
  const router = useRouter();

  useEffect(() => {
    const h = localStorage.getItem('randomHistory');
    if (h) setHistory(JSON.parse(h));
  }, []);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-6">Random History</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {history.map((song, index) => (
          <div key={index} className="border rounded p-4">
            <Image src={song.imgUrl} alt={song.title} width={150} height={150} />
            <h3>{song.title}</h3>
            <p>{song.artist}</p>
            <p>{song.lv} {song.diff}</p>
          </div>
        ))}
      </div>
      <button onClick={() => router.push('/')} className="mt-6 px-4 py-2 bg-blue-500 text-white rounded">
        {history.length >= 6 ? 'Proceed to Ban Pick' : 'Back to Random'}
      </button>
    </div>
  );
}