# Edrev

A real-time collaborative code editor that allows multiple users to edit code simultaneously with live synchronization.

## Features

- **Real-time Collaborative Editing** - Multiple users can edit the same code file at the same time
- **Live Presence Tracking** - See who's currently editing (with user avatars and names)
- **Monaco Editor Integration** - Syntax highlighting and rich code editing features
- **Operational Transformation** - Uses Yjs for conflict-free collaborative editing
- **Docker Support** - Easy deployment with Docker containerization

## Tech Stack

### Backend
- **Express.js** - Web server framework
- **Socket.IO** - Real-time bidirectional communication
- **y-socket.io** - Socket.IO provider for Yjs document synchronization

### Frontend
- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor component
- **Yjs** - CRDT library for collaborative editing
- **y-monaco** - Monaco Editor binding for Yjs
- **Tailwind CSS** - Utility-first CSS framework

## Project Structure

```
edrev/
├── backend/               # Express server
│   ├── package.json
│   ├── server.js         # Main server file
│   └── public/           # Static files (built frontend)
├── frontend/             # React application
│   ├── package.json
│   ├── src/
│   │   ├── main.jsx      # React entry point
│   │   ├── App.jsx       # Main app component
│   │   └── App.css
│   ├── vite.config.js
│   └── index.html
└── dockerfile            # Docker configuration
```

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd edrev
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Running Locally

#### Terminal 1 - Start the Backend
```bash
cd backend
npm run dev
```
The backend will start on `http://localhost:3000` (or configured port)

#### Terminal 2 - Start the Frontend (Development)
```bash
cd frontend
npm run dev
```
The frontend will be available at the URL shown in the terminal (typically `http://localhost:5173`)

### Building for Production

1. **Build the frontend**
   ```bash
   cd frontend
   npm run build
   ```
   This creates optimized files in `frontend/dist/`

2. **Start the backend** (serves the built frontend)
   ```bash
   cd backend
   npm start
   ```

## Docker Deployment

Build and run the application using Docker:

```bash
docker build -t edrev .
docker run -p 3000:3000 edrev
```

Access the application at `http://localhost:3000`

## Usage

1. Open the application in your browser
2. Enter your name to join the session
3. Share the URL with others to collaborate
4. Start typing - changes are synchronized in real-time across all connected clients
5. See live presence indicators showing who else is editing

## Development

### Frontend Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint
- `npm run preview` - Preview production build

### Backend Scripts
- `npm run dev` - Start with auto-reload (nodemon)
- `npm run start` - Start production server

## How It Works

The application uses **Yjs**, a high-performance CRDT (Conflict-free Replicated Data Type) library, to synchronize text changes across multiple clients:

1. Each user connects via Socket.IO
2. Text changes are transformed into Yjs updates
3. Updates are broadcast to all connected clients
4. Monaco Editor binding applies changes with cursor/selection awareness
5. Presence information (user list) is maintained and shared

## Architecture

- **Collaborative Editing**: Uses Yjs with Socket.IO provider for real-time document synchronization
- **Presence Tracking**: Socket.IO broadcasts user presence data to all connected clients
- **Stateless Backend**: Each connection manages its own socket, with Yjs handling conflict resolution

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari
- Any modern browser supporting WebSockets

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

ISC

## Support

For issues, questions, or feature requests, please open an issue on the repository.
