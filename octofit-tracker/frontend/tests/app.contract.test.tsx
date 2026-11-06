import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../src/App.js';

function renderRoute(route: string) {
  return render(<MemoryRouter initialEntries={[route]}><App /></MemoryRouter>);
}

const capabilities = [
  { route: '/activities', endpoint: '/api/activities', empty: { activities: [] }, emptyText: /no activities/i, success: { activities: [{ type: 'run', minutes: 30, points: 30 }] }, successText: /run/i },
  { route: '/teams', endpoint: '/api/teams', empty: { teams: [] }, emptyText: /no teams/i, success: { teams: [{ name: 'Octocats', members: ['Mona'] }] }, successText: /Octocats/i },
  { route: '/leaderboard', endpoint: '/api/leaderboard', empty: { leaderboard: [] }, emptyText: /no (leaderboard|rankings|scores)/i, success: { leaderboard: [{ teamName: 'Octocats', totalPoints: 90, rank: 1 }] }, successText: /90/ },
  { route: '/workouts', endpoint: '/api/workouts/suggestions/mona%40example.com', empty: { suggestions: [] }, emptyText: /no (workout|suggestions)/i, success: { suggestions: [{ title: 'Intervals', reason: 'Build endurance' }] }, successText: /Intervals/i },
];

describe('OctoFit presentation contract', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/api/activities')) return new Response(JSON.stringify({ activities: [{ type: 'run', minutes: 30, points: 30 }] }), { status: 200 });
      if (url.includes('/api/teams')) return new Response(JSON.stringify({ teams: [{ name: 'Octocats', members: ['Mona'] }] }), { status: 200 });
      if (url.includes('/api/leaderboard')) return new Response(JSON.stringify({ leaderboard: [{ teamName: 'Octocats', totalPoints: 90, rank: 1 }] }), { status: 200 });
      if (/\/api\/workouts\/suggestions\/mona(%40|@)example\.com$/.test(url)) return new Response(JSON.stringify({ suggestions: [{ title: 'Intervals', reason: 'Build endurance' }] }), { status: 200 });
      return new Response(JSON.stringify({ message: 'Not found' }), { status: 404 });
    }));
  });

  it('renders activity data from the API', async () => {
    renderRoute('/activities');
    expect(screen.getByRole('heading', { name: /activities/i })).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText(/run/i)).toBeInTheDocument());
  });

  it('renders teams, leaderboard, and workout suggestions with accessible content', async () => {
    const teams = renderRoute('/teams');
    await waitFor(() => expect(screen.getByText(/Octocats/)).toBeInTheDocument());
    teams.unmount();
    const leaderboard = renderRoute('/leaderboard');
    await waitFor(() => expect(screen.getByText(/90/)).toBeInTheDocument());
    leaderboard.unmount();
    renderRoute('/workouts');
    await waitFor(() => expect(screen.getByText(/Intervals/)).toBeInTheDocument());
  });

  it('requests workout suggestions for a specific user', async () => {
    renderRoute('/workouts');
    await waitFor(() => expect(fetch).toHaveBeenCalledWith('/api/workouts/suggestions/mona%40example.com'));
  });

  for (const capability of capabilities) {
    describe(capability.route, () => {
      it('renders successful API results', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(capability.success), { status: 200 })));
        renderRoute(capability.route);
        await waitFor(() => expect(screen.getByText(capability.successText)).toBeInTheDocument());
        expect(fetch).toHaveBeenCalledWith(capability.endpoint);
      });

      it('announces a loading state while the API request is pending', () => {
        vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})));
        renderRoute(capability.route);
        expect(screen.getByRole('status')).toHaveTextContent(/loading/i);
      });

      it('shows a meaningful empty state', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify(capability.empty), { status: 200 })));
        renderRoute(capability.route);
        await waitFor(() => expect(screen.getByText(capability.emptyText)).toBeInTheDocument());
      });

      it('announces API failures as an accessible alert', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ message: 'Unavailable' }), { status: 503 })));
        renderRoute(capability.route);
        await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(/unable|unavailable|error/i));
      });
    });
  }
});
