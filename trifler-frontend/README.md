# Trifler Chat

Trifler is a responsive chat application with a React frontend and a Spring Boot backend scaffold. The frontend currently works in **local demo mode**: it lets you create a local profile, groups, private conversations, and messages without a server. Local demo data is stored in this browser and is not delivered to other users.

This README walks through the project from setup to daily use, explains the code layout, and describes what is needed to connect a real backend.

## 1. Project overview

The repository contains two separate applications:

| Directory | Technology | Current purpose |
| --- | --- | --- |
| `trifler-frontend/` | React, Vite, Tailwind CSS | Complete interactive user interface and local demo behavior |
| `trifler-chat-application/` | Java 21, Spring Boot, Maven | Backend starter project and dependencies; application API and chat behavior are not implemented yet |

The frontend does not require the backend for local development. Backend mode is disabled by default.

## 2. Features

- Registration and sign-in screens with local demo authentication.
- A responsive workspace for browsing and searching conversations.
- One-to-one private chat creation by entering a contact name.
- Group creation, group member display, and group conversation views.
- Sending messages and saving local conversations in browser storage.
- Profile editing, sign-out, and account deletion.
- Protected pages and navigation using React Router.
- Browser-console messages for local demo activity.
- Optional Axios REST and STOMP WebSocket integration points for a future backend.

In local mode, a private conversation is only a local conversation record. It does not look up a real user or send messages to another person. Voice and video calls and some other chat actions are informational placeholders.

## 3. Requirements

For the frontend:

- Node.js `20.19+` or `22.12+`.
- npm (included with Node.js).
- A modern browser.

For the backend scaffold:

- JDK 21.
- The included Maven wrapper (`mvnw.cmd` on Windows).
- MySQL and database configuration before enabling JPA-backed server functionality.

## 4. Set up the frontend

### Step 1: Open the frontend directory

From the repository root:

```powershell
cd .\trifler-frontend
```

### Step 2: Install dependencies

Use the lockfile to install the versions selected for this project:

```powershell
npm ci
```

If you intentionally changed `package.json` and need to update the lockfile, use `npm install` instead.

### Step 3: Configure environment variables

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

The example configuration is:

```dotenv
VITE_ENABLE_BACKEND=false
VITE_API_BASE_URL=http://localhost:8080/api
VITE_WS_URL=ws://localhost:8080/ws
VITE_WS_SEND_DESTINATION=/app/chat.send
```

Keep `VITE_ENABLE_BACKEND=false` for local demo use. Do not put passwords, API keys, or other secrets in `VITE_*` variables: Vite includes these values in browser-side code.

### Step 4: Start the development server

```powershell
npm run dev
```

Vite starts the frontend and opens it in your browser. The terminal prints the local URL if the browser does not open automatically. Keep the terminal running while you use the app.

### Step 5: Use the local demo

1. Register with a name, email, and password, or open the sign-in page and enter an email and password.
2. In local mode, credentials are not verified by a server. Registration requires a password of at least eight characters because of the form's client-side validation.
3. Use the workspace navigation to open Messages, Private chats, or Groups.
4. Create a private conversation by entering a contact name. This creates a local demo thread; it does not find or message a real account.
5. Create a group from the Groups view. Group members and messages remain local unless you implement and connect a backend.
6. Edit your display name or email in Profile. Use the delete control to clear the local demo account and saved conversations.
7. Open the browser developer tools and select **Console** to see demo activity. Message text may be logged there, so do not use sensitive information in demo conversations.

## 5. Frontend commands

Run these commands from `trifler-frontend/`:

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run lint` | Run ESLint |
| `npm run build` | Create the optimized frontend in `dist/` |
| `npm run preview` | Serve the production build locally after building |

There is no frontend test script configured in `package.json`.

To preview a production build:

```powershell
npm run build
npm run preview
```

## 6. Frontend configuration

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_ENABLE_BACKEND` | `false` | Enables the frontend's REST and WebSocket integration paths when set to `true` |
| `VITE_API_BASE_URL` | `http://localhost:8080/api` | Axios REST API base URL |
| `VITE_WS_URL` | `ws://localhost:8080/ws` | STOMP WebSocket broker URL |
| `VITE_WS_SEND_DESTINATION` | `/app/chat.send` | STOMP destination used to publish messages |

Restart Vite after changing `.env`. The `.env` file is local configuration; keep credentials and secrets out of it.

## 7. Data, privacy, and local mode

Local demo data is stored in the browser's `localStorage` for the frontend's origin:

| Storage key | Data |
| --- | --- |
| `chatconnect_token` | Local demo access token |
| `chatconnect_user` | Local profile |
| `trifler_conversations` | Conversation metadata and messages |

The frontend removes the legacy `trifler_demo_conversations` key when it loads local conversations. Clearing this browser's site data removes the local demo data. Account deletion in local mode clears the local profile, token, and saved conversations; it cannot delete a remote account or data on another device.

Local sign-in and registration are demonstrations, not authentication. Do not rely on local storage for secure credentials, private messages, or production account data. The application does not send local messages to other users.

## 8. Routes and application flow

| Route | Access | Page |
| --- | --- | --- |
| `/` | Redirect | Redirects to `/dashboard` |
| `/login` | Public | Sign-in |
| `/register` | Public | Registration |
| `/dashboard` | Protected | Main workspace and conversation view |
| `/private-chat` | Protected | Private conversation list |
| `/private-chat/:userId` | Protected | Selected one-to-one conversation |
| `/groups` | Protected | Group list and group conversation view |
| `/groups/:groupId` | Protected | Selected group conversation |
| `/profile` | Protected | Profile settings and account actions |
| Any unmatched path | Public fallback | Not found page |

`AppRoutes.jsx` composes the authentication and chat providers. `ProtectedRoute.jsx` redirects signed-out visitors to `/login`, preserving the route they originally requested.

## 9. Frontend source map

```text
trifler-frontend/
├── .env.example
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── public/
│   ├── favicon.svg
│   └── icons.svg
└── src/
    ├── App.jsx
    ├── main.jsx
    ├── index.css
    ├── assets/
    │   ├── hero.png
    │   ├── react.svg
    │   └── vite.svg
    ├── components/
    │   ├── auth/
    │   │   ├── LoginForm.jsx
    │   │   └── RegisterForm.jsx
    │   ├── chat/
    │   │   ├── ChatHeader.jsx
    │   │   ├── ChatWindow.jsx
    │   │   ├── MessageInput.jsx
    │   │   ├── MessageItem.jsx
    │   │   ├── MessageList.jsx
    │   │   ├── StartDirectChatModal.jsx
    │   │   └── TypeIndicator.jsx
    │   ├── common/
    │   │   ├── Avatar.jsx
    │   │   ├── Loader.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── ProtectedRoute.jsx
    │   │   └── Sidebar.jsx
    │   └── groups/
    │       ├── AddMemberModel.jsx
    │       ├── CreateGroupModel.jsx
    │       ├── GroupInfoPanel.jsx
    │       ├── GroupItem.jsx
    │       ├── GroupList.jsx
    │       └── GroupMembers.jsx
    ├── context/
    │   ├── AuthContext.jsx
    │   ├── ChatContext.jsx
    │   ├── authContextValue.js
    │   └── chatContextValue.js
    ├── hooks/
    │   ├── useAuth.js
    │   ├── useChat.js
    │   └── useWebSocket.js
    ├── pages/
    │   ├── Dashboard.jsx
    │   ├── Groups.jsx
    │   ├── Login.jsx
    │   ├── NotFound.jsx
    │   ├── PrivateChat.jsx
    │   ├── Profile.jsx
    │   └── Register.jsx
    ├── routes/
    │   └── AppRoutes.jsx
    ├── services/
    │   ├── api.js
    │   ├── authService.js
    │   ├── chatService.js
    │   ├── groupService.js
    │   ├── userService.js
    │   └── websocketService.js
    ├── styles/
    │   ├── auth.css
    │   ├── chat.css
    │   ├── dashboard.css
    │   ├── global.css
    │   ├── not-found.css
    │   └── profile.css
    └── utils/
        ├── constants.js
        ├── formatData.js
        └── validators.js
```

### What the frontend folders do

- `components/auth/` contains the sign-in and registration forms.
- `components/chat/` contains reusable chat headers, message list/input components, and the private-chat creation modal.
- `components/common/` contains shared navigation, avatars, loading UI, and route protection.
- `components/groups/` contains group list, member, information, and creation UI.
- `context/` stores shared authentication and conversation state. `ChatContext.jsx` persists local conversations and coordinates message actions.
- `hooks/` exposes the auth/chat contexts and wraps WebSocket connection behavior.
- `pages/` contains route-level screens. `Groups.jsx` reuses the dashboard in group mode; `PrivateChat.jsx` provides the dedicated one-to-one view.
- `routes/` declares public and protected routes.
- `services/` contains REST and STOMP integration points. These are not a substitute for implemented server endpoints.
- `styles/` contains global and page/component stylesheet rules. Tailwind CSS is also available through the Vite plugin.
- `utils/` is reserved for shared helpers.

## 10. Backend status and setup

The sibling `trifler-chat-application/` directory is a Spring Boot project configured for Java 21. Its Maven dependencies include Spring MVC, Security, Validation, JPA, WebSocket, MySQL, Springdoc OpenAPI, and test starters. At present, the backend source contains the Spring Boot application entry point and a context-load test; it does **not** contain the REST controllers, authentication flow, database entities/repositories, or WebSocket message handlers needed by the frontend. `application.properties` currently only sets the application name.

The backend scaffold is therefore not a working chat API yet. In particular, JPA and MySQL are declared but no database connection properties are configured. Add the required server-side implementation, database configuration, authentication and authorization, and frontend-origin CORS/WebSocket configuration before using backend mode.

To run the scaffold from PowerShell, after installing JDK 21:

```powershell
cd ..\trifler-chat-application
.\mvnw.cmd spring-boot:run
```

The command may require database configuration because the project includes JPA/MySQL dependencies without a configured datasource. Do not enable frontend backend mode until the server starts successfully and implements the routes and WebSocket protocol below.

### Frontend integration contract

When `VITE_ENABLE_BACKEND=true`, the frontend expects these backend operations:

| Method | Path or destination | Use |
| --- | --- | --- |
| `POST` | `/auth/register` | Register a user |
| `POST` | `/auth/login` | Sign in |
| `GET` | `/users/me` | Load the current user |
| `PATCH` | `/users/me` | Update the current user's profile |
| `DELETE` | `/users/me` | Delete the current account |
| `GET` | `/conversations` | Load conversations |
| `POST` | `/conversations/direct` | Create a one-to-one conversation |
| `GET` | `/groups` | Load groups |
| `POST` | `/groups` | Create a group |
| `POST` | `/groups/{groupId}/members` | Add a group member |
| STOMP subscribe | `/topic/conversations/{conversationId}` | Receive conversation messages |
| STOMP publish | `/app/chat.send` by default | Send a conversation message |

These are frontend integration defaults, **not endpoints verified to exist in the Spring Boot project**. Match the request/response payloads, security rules, CORS policy, and WebSocket destinations in the backend before enabling the flag. Configure a different publish destination with `VITE_WS_SEND_DESTINATION` if needed.

## 11. Frontend technology

- React 19 and React Router.
- Vite 8 and the React Vite plugin.
- Tailwind CSS 4 through `@tailwindcss/vite`, alongside project CSS.
- Axios for REST integration.
- STOMP.js for optional WebSocket integration.
- Lucide React for icons.
- ESLint for linting.

## 12. Build and validation

Before sharing frontend changes, run:

```powershell
npm run lint
npm run build
```

Both commands run from `trifler-frontend/`. The build output is written to `dist/`, which is generated and should not be edited by hand.

## 13. Generated and local files

`node_modules/` contains installed npm dependencies, `dist/` contains the generated frontend build, and the backend's `target/` contains generated Maven output. These directories are generated artifacts and are not part of the application source. Keep local `.env` files and credentials out of version control.
