# EAMS Backend

Backend API for the **Employee Attendance Management System (EAMS)**.

## Tech Stack

-   Node.js
-   Express.js
-   MongoDB
-   Mongoose
-   JWT
-   bcrypt
-   Cloudinary
-   CORS
-   cookie-parser
-   dotenv

## Main Features

-   Employee registration and login
-   JWT authentication
-   Role-based authorization (`EMPLOYEE`, `HR`)
-   Employee profile management
-   Profile image upload with Cloudinary
-   Attendance check-in/check-out
-   Working-hours calculation
-   Attendance history
-   Leave application and history
-   HR dashboard statistics
-   Monthly attendance chart
-   Employee search and pagination
-   HR leave approval/rejection

## Attendance Status

The application supports:

``` text
Present
Late
Half Day
Absent
On Leave
```

The attendance record is maintained per employee and per date.

## Attendance Rules

-   Check-in is allowed between **10:00 AM and 9:00 PM**.
-   Check-in between **10:00 AM and 10:30 AM** is not considered late.
-   Late status is calculated after the grace period.
-   If an employee does not check out by the cutoff, the application can
    use **9:00 PM** as the automatic checkout time.
-   Working hours are calculated from check-in and check-out time.

## Roles

  Role         Access
  ------------ -----------------------------------------------------
  `EMPLOYEE`   Personal dashboard, attendance, leave and profile
  `HR`         Dashboard, employee management and leave management

Protected HR routes use:

``` js
authenticate
authorize("HR")
```

## Backend Structure

``` text
backend/
├── config/
├── controllers/
├── middlewares/
├── models/
├── routes/
├── utils/
├── uploads/
├── .env
├── .env.example
├── .gitignore
├── package.json
└── server.js
```

Keep this section synchronized with the actual folder names if the
project structure changes.

## API Base URL

Local development:

``` text
http://localhost:5000/api
```

Production:

``` text
https://employee-attendance-management-backend.onrender.com/api
```

## Authentication

### Register

``` http
POST /api/auth/register
```

Example:

``` json
{
  "fullName": "John Doe",
  "email": "john@example.com",
  "employeeId": "EMP001",
  "password": "Strong@123",
  "department": "IT",
  "designation": "Developer"
}
```

### Login

``` http
POST /api/auth/login
```

Example:

``` json
{
  "email": "john@example.com",
  "password": "Strong@123"
}
```

The authenticated user's role determines the dashboard access.

## Employee APIs

``` http
GET  /api/employee/profile
PUT  /api/employee/profile
PUT  /api/employee/profile/image
PUT  /api/employee/change-password
```

Profile image upload uses `multipart/form-data` with:

``` text
image
```

## Attendance APIs

Typical attendance operations:

``` http
POST /api/attendance/check-in
POST /api/attendance/check-out
GET  /api/attendance/history
```

Attendance data includes:

``` text
employee
date
checkIn
checkOut
workingHours
status
lateMinutes
```

A unique employee/date relationship prevents duplicate daily attendance
records.

## Leave APIs

Typical employee operations:

``` http
POST /api/leave
GET  /api/leave
GET  /api/leave/history
```

Leave statuses:

``` text
Pending
Approved
Rejected
```

## HR APIs

### Dashboard

``` http
GET /api/hr/dashboard
```

Dashboard data includes:

-   Total employees
-   Present today
-   Absent today
-   Late today
-   Half Day today
-   On leave today
-   Pending leave requests

### Monthly Attendance Chart

``` http
GET /api/hr/dashboard/chart?year=2026&month=8
```

### Employees

``` http
GET /api/hr/employees?page=1&limit=10&search=deep
```

Employee search supports fields such as:

-   Full name
-   Email
-   Employee ID
-   Department

### Employee Details

``` http
GET /api/hr/employees/:employeeId
```

### Leave Management

``` http
GET /api/hr/leaves
PUT /api/hr/leave/:leaveId/approve
PUT /api/hr/leave/:leaveId/reject
```

These endpoints are restricted to HR users.

## HR Employee Status

The employee list can display today's status using:

``` text
🟢 Present / Late
🟡 On Leave
🔴 Absent
```

The status is determined from today's attendance and approved leave
information.

## Dashboard Status Logic

-   **Present:** employees with attendance today that counts as
    present/late.
-   **Late:** employees whose attendance status is `Late`.
-   **Half Day:** employees whose attendance status is `Half Day`.
-   **On Leave:** employees whose approved leave covers today.
-   **Absent:** employees without today's attendance and without
    approved leave.

## Environment Variables

Create `.env` in the backend root.

Example:

``` env
PORT=5000

MONGODB_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

CLIENT_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

Use the exact variable names required by the project's configuration
files.

Never commit `.env`.

## Installation

``` bash
npm install
```

Create `.env`, configure MongoDB/JWT/Cloudinary, then run:

``` bash
npm run dev
```

For production:

``` bash
npm start
```

## Security

The backend uses:

-   JWT authentication
-   bcrypt password hashing
-   Role-based access control
-   Protected routes
-   Password exclusion from normal responses
-   Environment variables for secrets
-   CORS
-   Input validation
-   Cloudinary for image storage

Never expose these values to the frontend:

``` text
JWT_SECRET
MONGODB_URI
CLOUDINARY_API_SECRET
```

## Request Flow

``` text
Client
  ↓
API Request
  ↓
authenticate
  ↓
authorize("HR")   [HR routes]
  ↓
Controller
  ↓
Model / Database
  ↓
API Response
```

## Project

**Employee Attendance Management System (EAMS)**

Backend: **Node.js + Express.js**

Database: **MongoDB**

Authentication: **JWT + bcrypt**

Image Storage: **Cloudinary**

Authorization: **Role-Based Access Control**
