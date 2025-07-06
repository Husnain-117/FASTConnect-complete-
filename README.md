# FASTConnect

A modern, full-featured networking and communication platform for FAST University students.

## 🚀 Overview
FASTConnect enables students to connect, chat, collaborate, and network through real-time text, voice, and video channels. Designed for the FAST community, it offers a secure and interactive experience with advanced search, profile management, and more.

## ✨ Main Features

### 🔐 Authentication & Security
- Secure JWT-based authentication
- Registration and login with **email verification**
- Only emails ending with **@nu.edu.pk** or **@isb.nu.edu.pk** are accepted for registration and login
- Password recovery, secure password hashing
- Persistent sessions (Remember Me)

### 👤 Profile Management
- Create and edit student profiles with academic and personal info
- Profile photo upload and cropping
- Campus and batch selection
- Real-time profile updates

### 🔍 Advanced Search
- Search for students by name, campus, batch, and more
- Real-time filtering and suggestions
- Favorites system and online status indicators

### 💬 Real-time Communication
- **Text Chat:** Global university chat, real-time messaging, emoji support, typing indicators, message filtering, and more
- **Voice Chat:** Random voice matching, peer-to-peer audio, skip functionality, online user tracking
- **Video Chat:** HD video, random matching, dual streams, cross-platform support

### 🎨 Modern UI/UX
- Responsive, mobile-first design
- Beautiful gradients and smooth animations
- Accessibility features and dark/light mode

### 🔧 Technical Highlights
- Real-time notifications and online/offline status
- File uploads, image cropping, error handling
- Performance optimization with lazy loading

## 🛠️ Tech Stack
- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, react-router-dom, Socket.IO Client, Axios, React Easy Crop, Emoji Mart, Lucide React
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT, Socket.IO, Multer, Bcrypt, WebRTC

## ⚡ Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/Husnain-117/FASTConnect.git
cd FASTConnect
```

### 2. Install Dependencies
#### Backend
```bash
cd server
npm install
```
#### Frontend
```bash
cd ../client/fastconnect-client
npm install
```

### 3. Environment Variables
#### Backend
Create a `.env` file in the `server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fastconnect
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```
#### Frontend
Create a `.env` file in `client/fastconnect-client/`:
```env
VITE_API_URL=https://localhost:5000/api
```

### 4. Running the App
#### Backend
```bash
cd server
npm run dev
```
#### Frontend
```bash
cd client/fastconnect-client
npm run dev
```

## 📝 Contribution Guide
- Fork the repository
- Create a feature branch
- Commit and push your changes
- Open a Pull Request

## 📧 Contact
For any inquiries, please contact [husnainakram336@gmail.com](mailto:husnainakram336@gmail.com)

---

**Happy Coding!** 🚀

## Features

### 🔐 User Authentication & Security
- **Secure JWT-based authentication system** with token management
- **User registration and login** with email verification
- **Protected routes** for authenticated users
- **Password recovery** functionality
- **Remember me** option for persistent sessions
- **Secure password hashing** using bcrypt

### 👤 Profile Management
- **Complete profile creation and editing** with academic information
- **Profile photo upload** with image cropping functionality
- **Campus and batch selection** for all FAST University campuses
- **Personal information** including age, gender, and about me sections
- **Profile photo management** with drag-and-drop and crop interface
- **Real-time profile updates** with immediate reflection

### 🔍 Advanced Search & Discovery
- **Multi-filter search functionality** to find other students
- **Search by name** with real-time suggestions
- **Filter by campus** (Islamabad, Lahore, Karachi, Peshawar, Multan, Faisalabad, Chiniot-Faisalabad)
- **Online users filter** to see who's currently active
- **Favorites system** to save and manage preferred connections
- **Real-time online status** indicators
- **Pagination support** for large user lists

### 💬 Real-time Communication Features

#### 📝 Text Chat
- **Global university chat** for all students
- **Real-time messaging** with Socket.IO
- **Message filtering** by date (today, yesterday, week, month, custom range)
- **Emoji support** with emoji picker
- **Typing indicators** and read receipts
- **Message timestamps** and sender information
- **Auto-scroll** to latest messages
- **Online user count** display

#### 🎤 Voice Chat
- **Random voice matching** with other students
- **WebRTC peer-to-peer** audio communication
- **Real-time voice streaming** with low latency
- **Connection status indicators** (searching, matched, connected)
- **Skip functionality** to find different matches
- **Online user tracking** in voice chat rooms
- **Audio quality optimization** for clear communication

#### 📹 Video Chat
- **HD video communication** with WebRTC
- **Face-to-face conversations** for study groups and collaboration
- **Random video matching** with other students
- **Dual video streams** (local and remote)
- **Connection management** with accept/skip options
- **Real-time video quality** optimization
- **Cross-platform compatibility** for all devices

### 🎨 Modern UI/UX
- **Responsive design** that works on all devices
- **Mobile-first approach** with touch-friendly interfaces
- **Beautiful gradient designs** with emerald and teal themes
- **Smooth animations** and transitions
- **Loading states** and error handling
- **Accessibility features** for inclusive design
- **Dark/light mode** considerations

### 🔧 Technical Features
- **Real-time notifications** for new messages and connections
- **Online/offline status** tracking with last seen timestamps
- **Connection caching** for performance optimization
- **File upload handling** with Multer
- **Image processing** with cropping capabilities
- **Error handling** and user feedback
- **Performance optimization** with lazy loading

## Tech Stack

### Frontend
- **React 19** - Latest JavaScript library for building user interfaces
- **TypeScript** - For type-safe JavaScript development
- **Vite** - Next Generation Frontend Tooling
- **Tailwind CSS** - Utility-first CSS framework
- **React Router DOM** - For client-side routing
- **Socket.IO Client** - For real-time communication
- **Axios** - For making HTTP requests
- **React Easy Crop** - For image cropping functionality
- **Emoji Mart** - For emoji picker component
- **Lucide React** - For modern icons

### Backend
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **JSON Web Tokens (JWT)** - For authentication
- **Socket.IO** - For real-time bidirectional communication
- **Multer** - For handling file uploads
- **Bcrypt** - For password hashing
- **WebRTC** - For peer-to-peer communication

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js (v16 or higher)
- npm (v8 or higher) or yarn
- MongoDB (v5 or higher)
- Git

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/fastconnect.git
cd FastConnect
```

### 2. Install Dependencies

#### Backend Setup
```bash
cd server
npm install
```

#### Frontend Setup
```bash
cd ../client/fastconnect-client
npm install
```

### 3. Environment Variables

Create a `.env` file in the server directory with the following variables:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fastconnect
JWT_SECRET=your_jwt_secret_key
NODE_ENV=development
```

### 4. Start the Development Servers

#### Start Backend Server
```bash
cd server
npm run dev
```

The backend server will start on `http://localhost:5000`

#### Start Frontend Development Server
```bash
cd client/fastconnect-client
npm run dev
```

The frontend development server will start on `http://localhost:5173`

## Project Structure

```
FastConnect/
├── client/                    # Frontend React application
│   └── fastconnect-client/    # Vite + React + TypeScript
│       ├── public/            # Static files
│       ├── src/               # Source files
│       │   ├── api/           # API configuration and calls
│       │   ├── assets/        # Images, icons, etc.
│       │   ├── components/    # Reusable UI components
│       │   │   ├── Login.tsx          # Authentication component
│       │   │   ├── Register.tsx       # User registration
│       │   │   ├── Profile.tsx        # Profile management
│       │   │   ├── SearchPage.tsx     # User search and discovery
│       │   │   ├── TextChat.tsx       # Global text chat
│       │   │   ├── VoiceChat.tsx      # Voice communication
│       │   │   ├── VideoChat.tsx      # Video communication
│       │   │   ├── Home.tsx           # Dashboard
│       │   │   └── Navbar.tsx         # Navigation component
│       │   ├── context/       # React context providers
│       │   ├── contexts/      # Socket context
│       │   ├── types/         # TypeScript type definitions
│       │   ├── utils/         # Utility functions
│       │   ├── App.tsx        # Main application component
│       │   └── main.tsx       # Application entry point
│       ├── package.json       # Frontend dependencies
│       └── vite.config.ts     # Vite configuration
│
├── server/                    # Backend Node.js application
│   ├── config/               # Configuration files
│   ├── controllers/          # Route controllers
│   │   ├── authController.js      # Authentication logic
│   │   ├── profileController.js   # Profile management
│   │   ├── textController.js      # Text chat functionality
│   │   ├── videoChatController.js # Video chat handling
│   │   └── voiceSignalingController.js # Voice chat signaling
│   ├── middleware/           # Custom middleware
│   ├── models/               # Database models
│   │   ├── User.js          # User model
│   │   └── Message.js       # Message model
│   ├── routes/               # API routes
│   ├── utils/                # Utility functions
│   ├── uploads/              # File upload directory
│   ├── socket.js             # Socket.IO configuration
│   ├── index.js              # Server entry point
│   └── package.json          # Backend dependencies
│
├── .gitignore                # Git ignore file
└── README.md                 # Project documentation
```

## Available Scripts

### Frontend (from `/client/fastconnect-client`)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend (from `/server`)
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm test` - Run tests

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user profile
- `POST /api/auth/forgot-password` - Request password reset

### Users & Profiles
- `GET /api/auth/search-users` - Search users with filters
- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Profile Management
- `GET /api/profile/:userId` - Get user profile
- `POST /api/profile/:userId` - Create user profile
- `PUT /api/profile/:userId` - Update user profile
- `DELETE /api/profile/:userId` - Delete user profile
- `POST /api/profile/:userId/photo` - Upload profile photo
- `GET /api/profile/online` - Get online users

### Favorites
- `GET /api/auth/favorites` - Get user's favorites
- `POST /api/auth/favorites/add/:id` - Add user to favorites
- `DELETE /api/auth/favorites/remove/:id` - Remove user from favorites

### Messaging
- `GET /api/messages/all` - Get all messages
- `POST /api/messages/send` - Send a new message

### Real-time Communication
- Socket.IO events for real-time chat, voice, and video communication
- WebRTC signaling for peer-to-peer connections

## Real-time Features

### Socket.IO Events
- `new_message` - Real-time text messaging
- `join-voice-chat` / `leave-voice-chat` - Voice chat room management
- `join-video-chat` / `leave-video-chat` - Video chat room management
- `start-search` / `start-video-search` - Random matching
- `match-found` / `video-match-found` - Match notifications
- `offer` / `answer` / `ice-candidate` - WebRTC signaling

### WebRTC Features
- **Peer-to-peer communication** for voice and video
- **STUN servers** for NAT traversal
- **ICE candidate exchange** for connection establishment
- **Media stream handling** for audio/video transmission
- **Connection state management** with automatic cleanup

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Contact

For any inquiries, please contact [husnainakram336@gmail.com](mailto:husnainakram336@gmail.com)

---

**Happy Coding!** 🚀
