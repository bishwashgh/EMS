# 🎉 Event Management System (EMS)

A comprehensive NestJS-based backend API for venue booking and event management in Nepal. Features user authentication, venue management, booking system, reviews, payments (eSewa & Khalti), real-time notifications, and admin dashboard.

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Authentication Flow](#-authentication-flow)
- [Payment Integration](#-payment-integration)
- [WebSocket Events](#-websocket-events)
- [Module Reference](#-module-reference)

---

## ✨ Features

- **User Management**: Registration with OTP verification, JWT authentication, role-based access
- **Venue Management**: Full CRUD, geolocation search, featured venues, inquiry system
- **Booking System**: Create bookings, check availability, reschedule, cancellation with refund calculation
- **Review System**: Ratings, helpful marks, reporting, owner responses
- **Payment Integration**: eSewa and Khalti payment gateways (Nepal)
- **File Uploads**: Cloudinary integration for images
- **Real-time Notifications**: WebSocket-based notification system
- **Dashboard**: User, owner, and admin dashboards with statistics

---

## 🛠 Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | 11.x | Backend framework |
| MongoDB | 8.x | Database (via Mongoose) |
| Passport.js | 0.7.x | Authentication |
| JWT | 11.x | Token-based auth |
| Socket.IO | 4.8.x | Real-time communication |
| Cloudinary | 2.8.x | Image storage |
| Nodemailer | 7.x | Email service |
| Axios | 1.13.x | HTTP client |
| bcrypt | 6.x | Password hashing |

---

## 📁 Project Structure

```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── app.controller.ts            # Health check endpoint
├── app.service.ts               # App service
│
├── auth/                        # Authentication Module
│   ├── auth.module.ts
│   ├── auth.controller.ts       # Auth endpoints
│   ├── auth.service.ts          # Auth business logic
│   ├── otp.service.ts           # OTP generation
│   ├── strategies/
│   │   └── jwt.strategy.ts      # JWT validation
│   ├── guards/
│   │   ├── jwt-auth.guard.ts    # JWT protection
│   │   ├── roles.guard.ts       # Role-based access
│   │   └── optional-jwt-auth.guard.ts
│   ├── decorators/
│   │   └── roles.decorator.ts   # @Roles() decorator
│   └── dto/
│       ├── registerUser.dto.ts
│       ├── loginUser.dto.ts
│       └── ...
│
├── user/                        # User Module
│   ├── user.module.ts
│   ├── user.controller.ts       # User endpoints
│   ├── user.service.ts          # User business logic
│   ├── schemas/
│   │   └── user.schema.ts       # User model
│   └── dto/
│       └── updateProfile.dto.ts
│
├── venue/                       # Venue Module
│   ├── venue.module.ts
│   ├── venue.controller.ts      # Venue endpoints
│   ├── venue.service.ts         # Venue business logic
│   ├── schemas/
│   │   ├── venue.schema.ts      # Venue model
│   │   └── inquiry.schema.ts    # Inquiry model
│   └── dto/
│       ├── createVenue.dto.ts
│       ├── updateVenue.dto.ts
│       ├── queryVenue.dto.ts
│       └── createInquiry.dto.ts
│
├── booking/                     # Booking Module
│   ├── booking.module.ts
│   ├── booking.controller.ts    # Booking endpoints
│   ├── booking.service.ts       # Booking business logic
│   ├── schemas/
│   │   └── booking.schema.ts    # Booking model
│   └── dto/
│       ├── createBooking.dto.ts
│       └── updateBooking.dto.ts
│
├── review/                      # Review Module
│   ├── review.module.ts
│   ├── review.controller.ts     # Review endpoints
│   ├── review.service.ts        # Review business logic
│   ├── schemas/
│   │   └── review.schema.ts     # Review model
│   └── dto/
│       ├── createReview.dto.ts
│       ├── updateReview.dto.ts
│       ├── reportReview.dto.ts
│       └── ownerResponse.dto.ts
│
├── payment/                     # Payment Module
│   ├── payment.module.ts
│   ├── payment.controller.ts    # Payment endpoints
│   ├── payment.service.ts       # eSewa & Khalti integration
│   ├── schemas/
│   │   └── payment.schema.ts    # Payment model
│   └── dto/
│       └── initiatePayment.dto.ts
│
├── upload/                      # Upload Module
│   ├── upload.module.ts
│   ├── upload.controller.ts     # Upload endpoints
│   └── upload.service.ts        # Cloudinary integration
│
├── notification/                # Notification Module
│   ├── notification.module.ts
│   ├── notification.controller.ts  # REST endpoints
│   ├── notification.service.ts     # Notification logic
│   ├── notification.gateway.ts     # WebSocket gateway
│   └── schemas/
│       └── notification.schema.ts
│
├── dashboard/                   # Dashboard Module
│   ├── dashboard.module.ts
│   ├── dashboard.controller.ts  # Dashboard endpoints
│   └── dashboard.service.ts     # Statistics logic
│
└── common/                      # Shared Module
    └── email.service.ts         # SMTP email service
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB 6+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd ems1

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Configure your environment variables (see below)

# Start development server
npm run start:dev
```

### Available Scripts

```bash
npm run start          # Start production server
npm run start:dev      # Start development server with hot reload
npm run start:debug    # Start with debugging
npm run build          # Build for production
npm run test           # Run unit tests
npm run test:e2e       # Run e2e tests
npm run test:cov       # Run tests with coverage
npm run lint           # Lint code
```

---

## 🔧 Environment Variables

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# MongoDB
MONGO_URL=mongodb://localhost:27017/ems

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# SMTP Email (for OTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@yourapp.com

# Cloudinary (File Uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# eSewa Payment Gateway
# Sandbox: EPAYTEST / 8gBm/:&EnhH.1/q
ESEWA_MERCHANT_CODE=EPAYTEST
ESEWA_SECRET_KEY=8gBm/:&EnhH.1/q

# Khalti Payment Gateway
KHALTI_SECRET_KEY=your-khalti-secret-key
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
Most endpoints require JWT authentication:
```
Authorization: Bearer <access_token>
```

---

### 🔐 Auth Module (`/auth`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | ❌ | Register new user |
| POST | `/auth/verify-otp` | ❌ | Verify email OTP |
| POST | `/auth/resend-otp` | ❌ | Resend verification OTP |
| POST | `/auth/login` | ❌ | User login |
| POST | `/auth/forgot-password` | ❌ | Request password reset |
| POST | `/auth/reset-password` | ❌ | Reset password with OTP |
| POST | `/auth/logout` | ✅ | Logout (invalidate token) |
| POST | `/auth/refresh-token` | ❌ | Refresh access token |

#### Register User
```bash
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Password123!",
  "phoneNumber": "+9779812345678",
  "role": "USER"  # USER | OWNER | ADMIN
}
```

#### Login
```bash
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "Password123!"
}

# Response
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "USER"
  }
}
```

---

### 👤 User Module (`/users`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/users/me` | ✅ | Any | Get current profile |
| PATCH | `/users/me` | ✅ | Any | Update profile |
| POST | `/users/change-password` | ✅ | Any | Change password |
| DELETE | `/users/me` | ✅ | Any | Delete own account |
| GET | `/users/favorites` | ✅ | Any | Get favorites |
| POST | `/users/favorites/:venueId` | ✅ | Any | Add to favorites |
| DELETE | `/users/favorites/:venueId` | ✅ | Any | Remove from favorites |
| GET | `/users/favorites/:venueId/check` | ✅ | Any | Check if favorite |
| GET | `/users` | ✅ | ADMIN | List all users |
| GET | `/users/:id` | ✅ | ADMIN | Get user by ID |
| PATCH | `/users/:id/role` | ✅ | ADMIN | Update user role |
| PATCH | `/users/:id/suspend` | ✅ | ADMIN | Suspend user |
| DELETE | `/users/:id` | ✅ | ADMIN | Delete user |

---

### 🏢 Venue Module (`/venues`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/venues` | ❌ | - | List venues with filters |
| GET | `/venues/featured` | ❌ | - | Get featured venues |
| GET | `/venues/popular` | ❌ | - | Get popular venues |
| GET | `/venues/nearby` | ❌ | - | Find nearby venues |
| GET | `/venues/:id` | ❌ | - | Get venue details |
| POST | `/venues` | ✅ | OWNER | Create venue |
| GET | `/venues/owner/my-venues` | ✅ | OWNER | Get my venues |
| PATCH | `/venues/:id` | ✅ | OWNER | Update venue |
| DELETE | `/venues/:id` | ✅ | OWNER | Delete venue |
| POST | `/venues/:id/block-dates` | ✅ | OWNER | Block dates |
| POST | `/venues/:id/unblock-dates` | ✅ | OWNER | Unblock dates |
| PATCH | `/venues/:id/verify` | ✅ | ADMIN | Verify venue |
| PATCH | `/venues/:id/featured` | ✅ | ADMIN | Set featured |

#### Inquiry Endpoints
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/venues/:id/inquiries` | Optional | Send inquiry |
| GET | `/venues/:id/inquiries` | ✅ OWNER | Get venue inquiries |
| GET | `/venues/inquiries/my` | ✅ | Get my inquiries |
| PATCH | `/venues/inquiries/:id/respond` | ✅ OWNER | Respond to inquiry |
| PATCH | `/venues/inquiries/:id/close` | ✅ | Close inquiry |
| GET | `/venues/inquiries/:id` | ✅ | Get inquiry details |

#### Query Parameters for `/venues`
```
?city=Kathmandu
?venueType=BANQUET
?minCapacity=50
?maxCapacity=500
?minPrice=5000
?maxPrice=50000
?amenities=parking,wifi
?search=wedding hall
?page=1
?limit=10
?sortBy=price_asc|price_desc|rating|newest
```

#### Nearby Search
```
GET /venues/nearby?latitude=27.7172&longitude=85.3240&radius=10&limit=20
```

---

### 📅 Booking Module (`/bookings`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| POST | `/bookings` | ✅ | Any | Create booking |
| GET | `/bookings/my-bookings` | ✅ | Any | Get my bookings |
| GET | `/bookings/venue/:venueId` | ✅ | OWNER | Get venue bookings |
| GET | `/bookings/check-availability/:venueId` | ❌ | - | Check availability |
| GET | `/bookings/:id` | ✅ | Any | Get booking details |
| PATCH | `/bookings/:id/status` | ✅ | OWNER | Update status |
| PATCH | `/bookings/:id/reschedule` | ✅ | Any | Reschedule booking |
| GET | `/bookings/:id/refund-estimate` | ✅ | Any | Get refund estimate |
| DELETE | `/bookings/:id` | ✅ | Any | Cancel/delete booking |

#### Create Booking
```bash
POST /bookings
Content-Type: application/json

{
  "venueId": "venue_object_id",
  "eventDate": "2025-02-14",
  "startTime": "10:00",
  "endTime": "18:00",
  "eventType": "WEDDING",
  "guestCount": 200,
  "contactName": "John Doe",
  "contactPhone": "+9779812345678",
  "contactEmail": "john@example.com",
  "specialRequests": "Need extra decoration"
}
```

#### Booking Status Flow
```
PENDING → CONFIRMED → COMPLETED
    ↓
CANCELLED
```

---

### ⭐ Review Module (`/reviews`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/reviews/venue/:venueId` | ❌ | - | Get venue reviews |
| GET | `/reviews/:id` | ❌ | - | Get review details |
| POST | `/reviews` | ✅ | Any | Create review |
| GET | `/reviews/user/my-reviews` | ✅ | Any | Get my reviews |
| PATCH | `/reviews/:id` | ✅ | Any | Update review |
| DELETE | `/reviews/:id` | ✅ | Any | Delete review |
| POST | `/reviews/:id/helpful` | ✅ | Any | Toggle helpful |
| POST | `/reviews/:id/report` | ✅ | Any | Report review |
| POST | `/reviews/:id/owner-response` | ✅ | OWNER | Owner response |
| GET | `/reviews/admin/reported` | ✅ | ADMIN | Get reported reviews |
| PATCH | `/reviews/:id/hide` | ✅ | ADMIN | Hide review |
| PATCH | `/reviews/:id/unhide` | ✅ | ADMIN | Unhide review |

#### Create Review
```bash
POST /reviews
Content-Type: application/json

{
  "venueId": "venue_object_id",
  "bookingId": "booking_object_id",  # optional
  "rating": 5,
  "comment": "Amazing venue! Highly recommended.",
  "images": ["url1", "url2"]
}
```

---

### 💳 Payment Module (`/payments`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/payments/initiate` | ✅ | Initiate payment |
| GET | `/payments/success` | ❌ | Gateway callback (success) |
| GET | `/payments/failure` | ❌ | Gateway callback (failure) |
| POST | `/payments/verify/esewa` | ✅ | Verify eSewa payment |
| POST | `/payments/verify/khalti` | ✅ | Verify Khalti payment |
| GET | `/payments/:id` | ✅ | Get payment details |
| GET | `/payments/booking/:bookingId` | ✅ | Get booking payments |
| GET | `/payments/user/history` | ✅ | Get payment history |
| POST | `/payments/:id/refund` | ✅ | Request refund |
| GET | `/payments/owner/earnings` | ✅ OWNER | Get earnings summary |
| GET | `/payments/owner/transactions` | ✅ OWNER | Get transactions |

#### Initiate Payment
```bash
POST /payments/initiate
Content-Type: application/json

{
  "bookingId": "booking_object_id",
  "amount": 50000,
  "gateway": "ESEWA",  # ESEWA | KHALTI
  "paymentType": "FULL"  # ADVANCE | FULL | BALANCE
}

# Response (eSewa)
{
  "gateway": "ESEWA",
  "paymentUrl": "https://rc-epay.esewa.com.np/api/epay/main/v2/form",
  "formData": {
    "amount": "50000",
    "tax_amount": "0",
    "total_amount": "50000",
    "transaction_uuid": "PAY-xxx",
    "product_code": "EPAYTEST",
    "signature": "xxx",
    "success_url": "http://localhost:3000/api/payments/success?gateway=esewa",
    "failure_url": "http://localhost:3000/api/payments/failure?gateway=esewa"
  }
}
```

---

### 📤 Upload Module (`/upload`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/upload/avatar` | ✅ | Upload user avatar |
| POST | `/upload/venue` | ✅ OWNER | Upload venue images |
| POST | `/upload/review` | ✅ | Upload review images |
| DELETE | `/upload/:publicId` | ✅ | Delete uploaded file |

#### Upload File
```bash
POST /upload/venue
Content-Type: multipart/form-data

files: [file1, file2, ...]  # Max 10 files, 5MB each
```

**Supported formats:** JPEG, PNG, WebP, GIF

---

### 🔔 Notification Module (`/notifications`)

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/notifications` | ✅ | Get notifications |
| GET | `/notifications/unread-count` | ✅ | Get unread count |
| POST | `/notifications/:id/read` | ✅ | Mark as read |
| POST | `/notifications/read-all` | ✅ | Mark all as read |
| DELETE | `/notifications/:id` | ✅ | Delete notification |
| DELETE | `/notifications/read/all` | ✅ | Delete all read |

---

### 📊 Dashboard Module (`/dashboard`)

| Method | Endpoint | Auth | Roles | Description |
|--------|----------|------|-------|-------------|
| GET | `/dashboard` | ✅ | Any | User dashboard |
| GET | `/dashboard/owner` | ✅ | OWNER | Owner dashboard |
| GET | `/dashboard/admin` | ✅ | ADMIN | Admin dashboard |

---

## 🗄️ Database Schema

### User Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique),
  password: String (hashed),
  role: "USER" | "OWNER" | "ADMIN",
  phoneNumber: String,
  avatar: String,
  isVerified: Boolean,
  otp: String,
  otpExpires: Date,
  favorites: [ObjectId], // ref: Venue
  isSuspended: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Venue Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  address: String,
  city: String,
  minCapacity: Number,
  maxCapacity: Number,
  pricePerHour: Number,
  pricePerDay: Number,
  amenities: [String],
  images: [String],
  ownerId: ObjectId, // ref: User
  venueType: "BANQUET" | "PARTY_HALL" | "GARDEN" | "ROOFTOP" | 
             "CONFERENCE_HALL" | "RESTAURANT" | "OTHER",
  openingTime: String,
  closingTime: String,
  blockedDates: [Date],
  isActive: Boolean,
  isVerified: Boolean,
  rating: Number,
  reviewCount: Number,
  contactPhone: String,
  contactEmail: String,
  cancellationPolicy: {
    fullRefundHours: Number,
    partialRefundHours: Number,
    partialRefundPercentage: Number,
    noRefundHours: Number
  },
  location: {
    type: "Point",
    coordinates: [Number, Number] // [longitude, latitude]
  },
  isFeatured: Boolean,
  featuredUntil: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Booking Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: User
  venueId: ObjectId, // ref: Venue
  eventDate: Date,
  startTime: String,
  endTime: String,
  eventType: "WEDDING" | "BIRTHDAY" | "CORPORATE" | "ANNIVERSARY" | 
             "ENGAGEMENT" | "RECEPTION" | "CONFERENCE" | "SEMINAR" | "OTHER",
  guestCount: Number,
  totalAmount: Number,
  advancePaid: Number,
  balanceAmount: Number,
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED",
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID" | "REFUNDED",
  specialRequests: String,
  contactName: String,
  contactPhone: String,
  contactEmail: String,
  cancellationReason: String,
  cancelledAt: Date,
  refundAmount: Number,
  refundPercentage: Number,
  createdAt: Date,
  updatedAt: Date
}
```

### Review Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: User
  venueId: ObjectId, // ref: Venue
  bookingId: ObjectId, // ref: Booking
  rating: Number (1-5),
  comment: String,
  images: [String],
  helpfulBy: [ObjectId], // ref: User
  helpfulCount: Number,
  reports: [{
    userId: ObjectId,
    reason: "SPAM" | "INAPPROPRIATE" | "FAKE" | "OFFENSIVE" | "OTHER",
    description: String,
    reportedAt: Date
  }],
  isHidden: Boolean,
  ownerResponse: String,
  ownerResponseAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Payment Collection
```javascript
{
  _id: ObjectId,
  bookingId: ObjectId, // ref: Booking
  userId: ObjectId, // ref: User
  venueId: ObjectId, // ref: Venue
  amount: Number,
  gateway: "ESEWA" | "KHALTI",
  paymentType: "ADVANCE" | "FULL" | "BALANCE" | "REFUND",
  status: "INITIATED" | "PENDING" | "COMPLETED" | "FAILED" | "REFUNDED",
  transactionId: String,
  referenceId: String (unique),
  gatewayResponse: Object,
  refundReason: String,
  originalPaymentId: ObjectId, // ref: Payment
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: User
  title: String,
  message: String,
  type: "BOOKING_CREATED" | "BOOKING_CONFIRMED" | "BOOKING_CANCELLED" | 
        "BOOKING_COMPLETED" | "PAYMENT_RECEIVED" | "PAYMENT_FAILED" | 
        "REVIEW_RECEIVED" | "VENUE_VERIFIED" | "VENUE_REJECTED" | 
        "OTP_SENT" | "SYSTEM",
  isRead: Boolean,
  refId: ObjectId,
  refModel: "Booking" | "Venue" | "Payment" | "Review",
  metadata: Object,
  createdAt: Date,
  updatedAt: Date
}
```

### Inquiry Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId, // ref: User (optional)
  venueId: ObjectId, // ref: Venue
  name: String,
  email: String,
  phone: String,
  message: String,
  eventDate: Date,
  guestCount: Number,
  status: "PENDING" | "RESPONDED" | "CLOSED",
  ownerResponse: String,
  respondedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## 🔐 Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    REGISTRATION FLOW                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                   Server                  Database  │
│    │                        │                        │      │
│    │  POST /auth/register   │                        │      │
│    │──────────────────────▶│                        │      │
│    │                        │  Create user (unverified)     │
│    │                        │──────────────────────▶│      │
│    │                        │  Generate OTP                 │
│    │                        │  Send email                   │
│    │  { userId, message }   │                        │      │
│    │◀──────────────────────│                        │      │
│    │                        │                        │      │
│    │  POST /auth/verify-otp │                        │      │
│    │──────────────────────▶│                        │      │
│    │                        │  Verify OTP                   │
│    │                        │  Mark verified                │
│    │                        │──────────────────────▶│      │
│    │  { success: true }     │                        │      │
│    │◀──────────────────────│                        │      │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      LOGIN FLOW                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client                   Server                  Database  │
│    │                        │                        │      │
│    │  POST /auth/login      │                        │      │
│    │──────────────────────▶│                        │      │
│    │                        │  Find user by email           │
│    │                        │──────────────────────▶│      │
│    │                        │  Verify password (bcrypt)     │
│    │                        │  Generate JWT                 │
│    │  { accessToken, user } │                        │      │
│    │◀──────────────────────│                        │      │
│    │                        │                        │      │
│    │  GET /users/me         │                        │      │
│    │  Authorization: Bearer │                        │      │
│    │──────────────────────▶│                        │      │
│    │                        │  Validate JWT                 │
│    │                        │  Extract user info            │
│    │  { user data }         │                        │      │
│    │◀──────────────────────│                        │      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 💳 Payment Integration

### eSewa Flow
```
┌─────────────────────────────────────────────────────────────┐
│                     eSEWA PAYMENT FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client        API Server        eSewa Gateway    Database  │
│    │               │                   │              │     │
│    │ POST /payments/initiate           │              │     │
│    │─────────────▶│                   │              │     │
│    │               │ Create payment record            │     │
│    │               │─────────────────────────────────▶│     │
│    │               │ Generate HMAC signature          │     │
│    │ { formData }  │                   │              │     │
│    │◀─────────────│                   │              │     │
│    │               │                   │              │     │
│    │ Submit form to eSewa              │              │     │
│    │─────────────────────────────────▶│              │     │
│    │               │                   │ User pays    │     │
│    │               │                   │              │     │
│    │ Redirect to success_url?data=xxx  │              │     │
│    │◀─────────────────────────────────│              │     │
│    │               │                   │              │     │
│    │ GET /payments/success?data=xxx    │              │     │
│    │─────────────▶│                   │              │     │
│    │               │ Decode & verify   │              │     │
│    │               │ Update payment    │              │     │
│    │               │─────────────────────────────────▶│     │
│    │ { success }   │                   │              │     │
│    │◀─────────────│                   │              │     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Khalti Flow
```
┌─────────────────────────────────────────────────────────────┐
│                    KHALTI PAYMENT FLOW                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client        API Server       Khalti Gateway    Database  │
│    │               │                   │              │     │
│    │ POST /payments/initiate           │              │     │
│    │─────────────▶│                   │              │     │
│    │               │ POST /epayment/initiate          │     │
│    │               │──────────────────▶│              │     │
│    │               │ { payment_url, pidx }            │     │
│    │               │◀──────────────────│              │     │
│    │               │ Save pidx         │              │     │
│    │               │─────────────────────────────────▶│     │
│    │ { paymentUrl }│                   │              │     │
│    │◀─────────────│                   │              │     │
│    │               │                   │              │     │
│    │ Redirect to payment_url           │              │     │
│    │─────────────────────────────────▶│              │     │
│    │               │                   │ User pays    │     │
│    │ Redirect with pidx                │              │     │
│    │◀─────────────────────────────────│              │     │
│    │               │                   │              │     │
│    │ GET /payments/success?pidx=xxx    │              │     │
│    │─────────────▶│                   │              │     │
│    │               │ POST /epayment/lookup            │     │
│    │               │──────────────────▶│              │     │
│    │               │ { status: Completed }            │     │
│    │               │◀──────────────────│              │     │
│    │               │ Update records    │              │     │
│    │               │─────────────────────────────────▶│     │
│    │ { success }   │                   │              │     │
│    │◀─────────────│                   │              │     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔌 WebSocket Events

### Connection
```javascript
// Connect to WebSocket
const socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Or via query parameter
const socket = io('http://localhost:3000/notifications?token=your-jwt-token');
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `authenticate` | `{ token: string }` | Authenticate connection |
| `subscribe` | `{ types: string[] }` | Subscribe to notification types |
| `unsubscribe` | `{ types: string[] }` | Unsubscribe from types |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `connected` | `{ userId, socketId }` | Connection confirmed |
| `notification` | `NotificationData` | New notification |

### Example Usage
```javascript
// Subscribe to specific notification types
socket.emit('subscribe', { 
  types: ['BOOKING_CONFIRMED', 'PAYMENT_RECEIVED'] 
});

// Listen for notifications
socket.on('notification', (data) => {
  console.log('New notification:', data);
  // { title, message, type, refId, createdAt }
});
```

---

## 📦 Module Reference

### AuthService Methods
| Method | Description |
|--------|-------------|
| `registerUser(dto)` | Register new user with OTP |
| `verifyOtp(email, otp)` | Verify email OTP |
| `resendOtp(email)` | Resend verification OTP |
| `login(email, password)` | Authenticate and return JWT |
| `forgotPassword(email)` | Send password reset OTP |
| `resetPassword(email, otp, newPassword)` | Reset password |
| `logout(token)` | Blacklist JWT token |
| `refreshToken(token)` | Issue new JWT |

### UserService Methods
| Method | Description |
|--------|-------------|
| `createUser(dto)` | Create new user |
| `findByEmail(email)` | Find user by email |
| `findById(id)` | Find user by ID |
| `updateProfile(id, dto)` | Update user profile |
| `changePassword(id, dto)` | Change password |
| `addFavorite(userId, venueId)` | Add venue to favorites |
| `removeFavorite(userId, venueId)` | Remove from favorites |
| `getFavorites(userId)` | Get user's favorites |
| `deleteOwnAccount(userId)` | Delete own account |

### VenueService Methods
| Method | Description |
|--------|-------------|
| `create(dto, ownerId)` | Create new venue |
| `findAll(query)` | List venues with filters |
| `findById(id)` | Get venue by ID |
| `findByOwner(ownerId)` | Get owner's venues |
| `update(id, dto, userId, role)` | Update venue |
| `delete(id, userId, role)` | Delete venue |
| `findFeatured(limit)` | Get featured venues |
| `findPopular(limit)` | Get popular venues |
| `findNearby(lat, lng, radius)` | Find nearby venues |
| `createInquiry(venueId, dto, userId)` | Create inquiry |
| `respondToInquiry(id, response, userId, role)` | Respond to inquiry |

### BookingService Methods
| Method | Description |
|--------|-------------|
| `create(dto, userId)` | Create booking |
| `checkAvailability(venueId, date, start, end)` | Check slot availability |
| `findUserBookings(userId, status)` | Get user's bookings |
| `findVenueBookings(venueId, status)` | Get venue bookings |
| `updateStatus(id, status, userId, role)` | Update booking status |
| `rescheduleBooking(id, dto, userId)` | Reschedule booking |
| `getRefundEstimate(id)` | Calculate refund amount |
| `deleteBooking(id, userId, role)` | Delete/cancel booking |

### ReviewService Methods
| Method | Description |
|--------|-------------|
| `create(dto, userId)` | Create review |
| `findByVenue(venueId, page, limit)` | Get venue reviews |
| `findById(id)` | Get review by ID |
| `update(id, dto, userId)` | Update review |
| `delete(id, userId, role)` | Delete review |
| `markHelpful(reviewId, userId)` | Toggle helpful |
| `reportReview(reviewId, userId, reason)` | Report review |
| `addOwnerResponse(reviewId, ownerId, response)` | Add owner response |

### PaymentService Methods
| Method | Description |
|--------|-------------|
| `initiatePayment(dto, userId)` | Start payment process |
| `verifyEsewaPayment(data)` | Verify eSewa payment |
| `verifyKhaltiPayment(pidx)` | Verify Khalti payment |
| `getPaymentById(id)` | Get payment details |
| `getUserPayments(userId)` | Get user's payments |
| `initiateRefund(paymentId, reason, userId)` | Request refund |
| `getOwnerEarnings(ownerId)` | Get earnings summary |
| `getOwnerTransactions(ownerId, page, limit)` | Get transactions |

### NotificationService Methods
| Method | Description |
|--------|-------------|
| `create(dto)` | Create notification |
| `findByUser(userId, page, limit)` | Get user notifications |
| `getUnreadCount(userId)` | Count unread |
| `markAsRead(id, userId)` | Mark as read |
| `markAllAsRead(userId)` | Mark all as read |
| `delete(id, userId)` | Delete notification |
| `sendBookingCreated(booking, ownerUserId)` | Booking notification |
| `sendPaymentReceived(payment)` | Payment notification |

### UploadService Methods
| Method | Description |
|--------|-------------|
| `uploadFile(file, folder, options)` | Upload single file |
| `uploadMultipleFiles(files, folder)` | Upload multiple files |
| `deleteFile(publicId)` | Delete file from Cloudinary |
| `deleteMultipleFiles(publicIds)` | Delete multiple files |

### DashboardService Methods
| Method | Description |
|--------|-------------|
| `getUserDashboard(userId)` | User statistics |
| `getOwnerDashboard(ownerId)` | Owner statistics |
| `getAdminDashboard()` | Admin statistics |

---

## 🔒 Role-Based Access Control

| Role | Permissions |
|------|-------------|
| **USER** | Browse venues, book events, write reviews, manage favorites |
| **OWNER** | All USER + Create venues, manage bookings, respond to reviews |
| **ADMIN** | All permissions + User management, venue verification, system dashboard |

---

## 📝 Response Formats

### Success Response (Paginated)
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "totalPages": 10
  }
}
```

### Success Response (Single)
```json
{
  "_id": "...",
  "name": "...",
  ...
}
```

### Error Response
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

---

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Bishwas Ghimire**

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
