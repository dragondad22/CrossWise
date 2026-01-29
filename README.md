# CrossWise - Study Crosswords

CrossWise is a web application that allows you to upload JSON lists of terms and clues to automatically generate shareable crossword puzzles organized by topic. Perfect for students, teachers, and anyone looking to make learning more engaging through interactive puzzles.

## 🎯 Features

### Core Features

- **Topic Management**: Organize word lists by subject matter with custom colors and icons
- **JSON Import**: Upload structured word lists with automatic validation
- **Smart Generation**: Advanced backtracking algorithm creates connected crossword grids
- **Interactive Solving**: Full-featured puzzle solver with keyboard and touch navigation
- **Auto-save**: Progress saved to localStorage on each cell change with resume capability
- **User Accounts**: Sign in to sync puzzle progress and completion history per player
- **Export/Import**: Export lists and solve-state backups for sharing or recovery

### Technical Features

- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Accessibility**: Screen reader friendly with proper ARIA roles and keyboard navigation
- **Performance**: Efficient generation algorithm with <2 second target for 150 words
- **Data Persistence**: PostgreSQL database with Prisma ORM
- **Type Safety**: Full TypeScript implementation with Zod validation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd crosswise
```

2. Install dependencies:

```bash
npm install
```

3. Configure environment variables:

- Create/update `.env` with `DATABASE_URL` (PostgreSQL connection string).

4. Set up the database:

```bash
npm run db:push
```

5. Seed with sample data (optional):

```bash
npm run seed
```

6. Start the development server:

```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser

8. Sign in with the demo account (`demo@crosswise.dev` / `password123`) or create your own profile from the sign-in page to enable per-user progress tracking.

## 📝 Usage

### Creating Topics

1. Click "New Topic" on the topics page
2. Enter a name, description, color, and icon
3. Click "Create Topic"

### Importing Word Lists

1. Navigate to a topic
2. Click "Import List"
3. Upload a JSON file or paste JSON data
4. The app will validate and import your list

### JSON Format

Word lists should follow this schema:

```json
{
  "topic": "Context Engineering",
  "name": "CE Basics",
  "version": 1,
  "items": [
    {
      "answer": "PROMPT",
      "clue": "Instructional text provided to an LLM",
      "note": "Optional note",
      "difficulty": 1
    }
  ]
}
```

**Validation Rules:**

- `answer`: 2-20 characters, A-Z only (auto-normalized)
- `clue`: 3-200 characters
- `items`: 5-150 items for best results (sweet spot: 10-150)
- `difficulty`: 1-5 (optional)

### Generating Puzzles

1. From a topic's list view, click "New Game" on any list
2. The app will generate a crossword using up to 150 random words from the list
3. Generation uses a deterministic seed for reproducible puzzles

### Solving Puzzles

- **Navigation**: Arrow keys, Tab/Shift+Tab, or click/tap cells
- **Input**: Type letters directly or use on-screen keyboard
- **Checking**: Check individual letters, words, or the entire puzzle
- **Progress**: Automatically saved and restored on page refresh

## 🛠 Development

### Project Structure

```
src/
├── app/                    # Next.js App Router pages
├── components/            # Reusable UI components
├── lib/                  # Core utilities and business logic
│   ├── crossword-generator.ts  # Puzzle generation algorithm
│   ├── validation.ts          # Zod schemas
│   ├── store.ts              # Zustand state management
│   └── autosave.ts           # Auto-save functionality
├── types/                # TypeScript type definitions
prisma/                   # Database schema & migrations
```

### Key Technologies

- **Frontend**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **State Management**: Zustand with persistence
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Zod for runtime type checking
- **Generation**: Custom backtracking algorithm with seedrandom

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Add sample data
- `npm run seed:clear` - Clear all data
- `npm run seed:reset` - Reset and reseed data
- `npm run db:push` - Push Prisma schema to database
- `npm run db:studio` - Open Prisma Studio

### Testing the Generation Algorithm

The crossword generator uses a backtracking algorithm with the following features:

- Places longest words first for better grid utilization
- Scores placements based on intersections and centrality
- Ensures all words are connected in a single component
- Targets 90%+ success rate for word placement
- Handles up to 300 generation attempts with different word orderings

## 📱 Mobile Support

CrossWise is fully responsive with:

- Touch-friendly grid cells (44px minimum touch targets)
- Optimized typography and spacing for mobile devices
- Adaptive clue panel for smaller screens

## 🔒 Privacy & Security

- **Auth-required solving**: Solve flows require an authenticated session.
- **PII handling**: Email + password hash are stored for accounts; session cookies power auth.
- **Input Validation**: Server-side validation with Zod
- **HTTPS Ready**: Secure deployment configuration

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables:
   ```
   DATABASE_URL=your_postgres_connection_string
   ```
3. Deploy automatically on git push

### Manual Deployment

1. Build the application:
   ```bash
   npm run build
   ```
2. Set up PostgreSQL database
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Start the application:
   ```bash
   npm start
   ```

## 🎓 Educational Use Cases

- **Language Learning**: Vocabulary building with context clues
- **Technical Training**: Programming concepts, frameworks, APIs
- **Academic Study**: Course-specific terminology and definitions
- **Professional Development**: Industry-specific knowledge reinforcement
- **Team Building**: Collaborative puzzle solving in educational settings

## 🔮 Future Enhancements

- **SSO/OAuth**: Add external identity providers
- **Collaborative Features**: Shared solving sessions
- **Advanced Export**: PDF and PNG puzzle export
- **Analytics**: Generation success rates and solving statistics
- **Mobile App**: Native iOS/Android applications
- **Themes**: Customizable color schemes and visual themes
- **Hints System**: Progressive hint revelation for learning
- **Competitions**: Timed solving challenges and leaderboards

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by traditional crossword puzzles and educational word games
- Built with modern web technologies for optimal performance
- Designed with accessibility and mobile-first principles
- Algorithm optimized for educational vocabulary sets

---

**CrossWise** - Making learning engaging through interactive crossword puzzles! 🧩📚
