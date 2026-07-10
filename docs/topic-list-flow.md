# Topic & List Retrieval Flow

## Purpose
Describe how topics and lists are fetched and how solve summaries are attached.

## Entry Points
- `GET /api/v1/topics`
- `GET /api/v1/topics/:id`
- `GET /api/v1/lists?topicId=...`

## Primary Actors
- Topics UI
- Lists UI
- Topics API
- Lists API
- Prisma + database

## Step-by-Step
1. Client requests `GET /api/v1/topics` (auth required).
2. API returns topics plus list counts.
3. Client navigates to a topic, requests topic metadata via `GET /api/v1/topics/:id`.
4. Client requests lists via `GET /api/v1/lists?topicId=...`.
5. Lists API joins list data with user solves (when authenticated).
6. Client updates store: `setTopics`, `setLists`, `selectTopic`, `selectList`.

```mermaid
flowchart TD
    UI[Topics UI] -->|GET /api/v1/topics| TopicsAPI[/api/v1/topics/]
    TopicsAPI -->|topic.findMany + _count| DB[(Prisma)]
    DB --> TopicsAPI
    TopicsAPI --> TOPICS["topics[]"]
    TOPICS --> UI

    UI -->|GET /api/v1/lists?topicId=ID| ListsAPI[/api/v1/lists/]
    ListsAPI -->|list.findMany| DB
    DB --> ListsAPI
    ListsAPI --> AUTH{Authenticated?}
    AUTH -- Yes --> SOLVES["solve.findMany(userId, listIds)"]
    SOLVES --> WITHSOLVES[lists + solves]
    AUTH -- No --> LISTSONLY[lists]
    WITHSOLVES --> UI
    LISTSONLY --> UI
    UI --> STORE["useAppStore.setTopics/lists(...)"]
```

## Data Artifacts
- `topics` table
- `lists` table
- `list_items` table
- `solves` table (user history)

## Failure Modes
- Missing session -> 401.
- Topic not found -> 404 / error payload.

## Key Files
- `src/app/api/v1/topics/route.ts`
- `src/app/api/v1/topics/[id]/route.ts`
- `src/app/api/v1/lists/route.ts`
