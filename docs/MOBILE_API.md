# SmartChantier AI — Mobile API

REST endpoints for Android and iPhone apps. The web app uses `src/services/api/mobileApi.ts` (demo: in-memory via `dataStore`). Production: set `VITE_API_URL` and implement persistence on the server.

## Base URL

- Demo stub: `npm run api` → `http://localhost:3001`
- Production: `https://api.your-domain.com`

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/v1/projects` | List all projects |
| POST | `/api/v1/projects` | Create project |
| GET | `/api/v1/projects/:id` | Project detail |
| PUT | `/api/v1/projects/:id` | Update project |
| DELETE | `/api/v1/projects/:id` | Delete project |
| GET | `/api/v1/sites/active` | Active sites |
| GET | `/api/v1/sites/delayed` | Delayed sites |
| GET | `/api/v1/sites/at-risk` | Risk sites |
| GET | `/api/v1/sites/:id/timeline` | Site timeline |
| GET | `/api/v1/team` | Team members |
| GET | `/api/v1/attendance` | Attendance records |
| GET | `/api/v1/materials` | Inventory |
| GET | `/api/v1/materials/requests` | Material requests |
| GET | `/api/v1/materials/alerts` | Stock alerts |
| GET | `/api/v1/documents` | Documents list |
| POST | `/api/v1/documents` | Upload document metadata |
| GET | `/api/v1/documents/search?q=` | Search documents |
| GET | `/api/v1/notifications` | Notifications |
| GET | `/api/v1/tasks` | Tasks |
| GET | `/api/v1/photos` | All site photos |
| POST | `/api/v1/photos` | Upload photo metadata |
| GET | `/api/v1/photos/project/:chantierId` | Photos by project |
| GET | `/api/v1/photos/albums` | Photo albums |
| POST | `/api/v1/photos/albums` | Create album |
| GET | `/api/v1/photos/timeline/:chantierId` | Photo timeline |
| POST | `/api/v1/photos/compare` | Save before/after AI comparison |
| GET | `/api/v1/photos/comparisons` | Comparison history |
| GET | `/api/v1/photos/reports/:chantierId/pdf` | Photo report meta (PDF on client) |
| GET | `/api/v1/risks` | Risks |
| GET | `/api/v1/reports/daily` | Daily report meta |
| GET | `/api/v1/reports/weekly` | Weekly report meta |
| GET | `/api/v1/reports/monthly` | Monthly report meta |

## Client usage (TypeScript)

```ts
import { mobileApi } from '@/services/api/mobileApi';

const { data: projects } = await mobileApi.getProjects();
```
