# MangasManga Mapper v1

A web application that helps readers map where to continue a story when switching between light novels, web novels, manga, and anime. Built with React, Node.js, and Supabase.

## 🚀 Features

### Core Functionality
- **Jump-Point Finder**: Find corresponding chapters/episodes across different media formats
- **Crowd-Sourced Mapping**: Community-driven mappings with moderation system
- **Quality Control**: Moderation queue with approval/rejection system
- **Discussion & Rating**: Rate arcs across different media formats
- **Gamification**: Points system, leaderboard, and badges

### User Roles
- **Visitor**: Browse and search mappings
- **Contributor**: Submit mappings and earn points
- **Moderator**: Review and approve/reject submissions
- **Admin**: Full system access and user management

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** for styling
- **React Query** for data fetching
- **React Router** for navigation
- **Framer Motion** for animations
- **React Hook Form** with Yup validation

### Backend
- **Node.js** with Express
- **Supabase** for database and authentication
- **PostgreSQL** database
- **JWT** authentication
- **Rate limiting** and security middleware

### Database
- **Supabase PostgreSQL** with Row Level Security
- **Real-time subscriptions**
- **Automatic backups**

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account
- PostgreSQL database (handled by Supabase)

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd mangas-manga-mapper
```

### 2. Install Dependencies
```bash
# Install all dependencies (root, server, and client)
npm run install-all
```

### 3. Set Up Supabase

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Get your project URL and anon key from the project settings
3. Run the database schema:

```sql
-- Copy and paste the contents of database/schema.sql into your Supabase SQL editor
```

### 4. Environment Configuration

#### Server Configuration
```bash
cd server
cp .env.example .env
```

Edit `server/.env`:
```env
PORT=5000
NODE_ENV=development
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
CLIENT_URL=http://localhost:3000
```

#### Client Configuration
```bash
cd client
cp .env.example .env
```

Edit `client/.env`:
```env
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 5. Start Development Servers

```bash
# Start both server and client in development mode
npm run dev

# Or start them separately:
npm run server  # Starts backend on port 5000
npm run client  # Starts frontend on port 3000
```

### 6. Access the Application

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health Check: http://localhost:5000/api/health

## 📊 Database Schema

The application uses the following main entities:

- **Series**: Light novel/manga/anime franchises
- **ContentUnits**: Individual chapters/episodes
- **Mappings**: Relationships between content units
- **Users**: User profiles with roles and points
- **Ratings**: User ratings for arcs across media
- **Badges**: Achievement system
- **Arcs**: Story arc groupings

## 🔐 Authentication

The application uses Supabase Auth with:
- Email/password authentication
- Google OAuth integration
- JWT tokens for API access
- Row Level Security (RLS) policies

## 🎮 Gamification System

### Points System
- **+10 points**: Submit a mapping
- **+40 points**: Mapping approved
- **-20 points**: Mapping rejected

### Role Progression
- **Contributor → Moderator**: 500+ points & 80%+ approval rate
- **Badges**: Earn special badges for achievements

### Badges
- **Cartographer**: 100 approved mappings
- **Oracle**: First to map a new series
- **Archivist**: 10 helpful discussion posts
- **Contributor**: Submit your first mapping
- **Moderator**: Achieve moderator status

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
```

### Backend (Railway/Render)
```bash
cd server
npm start
```

### Environment Variables for Production
Set the following environment variables in your deployment platform:

**Frontend:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

**Backend:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `CLIENT_URL` (your frontend URL)
- `NODE_ENV=production`

## 📱 API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/series` - List all series
- `GET /api/series/:id` - Get series details
- `GET /api/series/:id/units` - Get series content units
- `GET /api/series/:id/jump` - Find jump points
- `GET /api/leaderboard` - Get leaderboard

### Protected Endpoints
- `POST /api/mappings` - Create mapping (authenticated)
- `GET /api/mappings/pending` - Get pending mappings (moderator+)
- `PATCH /api/mappings/:id/status` - Update mapping status (moderator+)
- `POST /api/ratings` - Create rating (authenticated)
- `GET /api/users/profile` - Get user profile (authenticated)

## 🧪 Testing

```bash
# Run tests (when implemented)
npm test

# Run linting
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Join our Discord community (link coming soon)

## 🔮 Roadmap

### Future Features
- Mobile PWA wrapper
- Bulk CSV import for power users
- Graph-style visualizer of mappings
- API endpoints for third-party apps
- Discord bot integration
- Advanced search and filtering
- User-generated content moderation
- Internationalization (i18n)

### Performance Improvements
- Caching layer implementation
- Database query optimization
- CDN integration for static assets
- Real-time updates for moderation queue

---

**Built with ❤️ by the MangasManga Mapper Team**
