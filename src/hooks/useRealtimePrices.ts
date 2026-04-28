import { useEffect, useRef, useState } from 'react';

export default function useRealtimePrices(url) {
  const [status, setStatus] = useState('connecting');
  const [prices, setPrices] = useState({});
  const retry = useRef(0);

  useEffect(() => {
    let ws;
    let timer;

    const connect = () => {
      ws = new WebSocket(url);

      ws.onopen = () => {
        retry.current = 0;
        setStatus('connected');
      };

      ws.onmessage = e => {
        const data = JSON.parse(e.data);
        setPrices(prev => ({ ...prev, [data.id]: data.price }));
      };

      ws.onclose = () => {
        setStatus('reconnecting');
        const delay = Math.min(1000 * 2 ** retry.current++, 30000);
        timer = setTimeout(connect, delay);
      };

      ws.onerror = () => ws.close();
    };

    connect();
    return () => {
      ws?.close();
      clearTimeout(timer);
    };
  }, [url]);

  return { prices, status };
}