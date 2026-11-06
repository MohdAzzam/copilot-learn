import { useEffect, useState, type ReactNode } from 'react';
import { getJson } from '../api/client.js';

type ApiItem = Record<string, unknown>;
type Props = {
  title: string;
  description: string;
  endpoint: string;
  collectionKey: string;
  emptyMessage: string;
  renderItem: (item: ApiItem) => ReactNode;
};

type RequestState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; items: ApiItem[] };

export function CapabilityCard({ title, description, endpoint, collectionKey, emptyMessage, renderItem }: Props) {
  const [state, setState] = useState<RequestState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    getJson<Record<string, ApiItem[]>>(endpoint).then((response) => {
      const items = response[collectionKey];
      if (!Array.isArray(items)) throw new Error(`Missing ${collectionKey} in API response`);
      if (active) setState({ status: 'success', items });
    }).catch((error: unknown) => {
      if (active) {
        setState({
          status: 'error',
          message: error instanceof Error ? error.message : String(error),
        });
      }
    });

    return () => {
      active = false;
    };
  }, [collectionKey, endpoint]);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">{title}</h2>
    <p>{description}</p>
    {state.status === 'loading' && <p role="status">Loading {title.toLowerCase()}...</p>}
    {state.status === 'error' && <p role="alert">Unable to load {title.toLowerCase()}: {state.message}</p>}
    {state.status === 'success' && (state.items.length === 0
      ? <p>{emptyMessage}</p>
      : <ul>{state.items.map((item, index) => <li key={index}>{renderItem(item)}</li>)}</ul>)}
  </div></section>;
}
