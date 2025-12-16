'use server';

// Store connected clients
const clients: Set<ReadableStreamDefaultController> = new Set();

// Broadcast to all connected clients
export function broadcastUpdate(data: any) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  clients.forEach(client => {
    try {
      client.enqueue(new TextEncoder().encode(message));
    } catch {
      clients.delete(client);
    }
  });
}

// GET - SSE connection
export async function GET() {
  const stream = new ReadableStream({
    start(controller) {
      clients.add(controller);
      
      // Send initial connection message
      controller.enqueue(new TextEncoder().encode('data: {"connected": true}\n\n'));
    },
    cancel(controller) {
      clients.delete(controller);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
