# 📚 Event Booking System - Complete Study Guide

A comprehensive documentation to understand the entire project workflow, architecture, classes, libraries, and concepts used in this NestJS-based Event Booking System.

---

## 📑 Table of Contents

1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Project Architecture](#3-project-architecture)
4. [NestJS Core Concepts](#4-nestjs-core-concepts)
5. [Module Deep Dive](#5-module-deep-dive)
6. [Authentication Flow](#6-authentication-flow)
7. [Database & Mongoose](#7-database--mongoose)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Key Libraries Explained](#9-key-libraries-explained)
10. [Best Practices Used](#10-best-practices-used)
11. [Testing Guide](#11-testing-guide)
12. [Deployment Considerations](#12-deployment-considerations)

---

## 1. Project Overview

### What is this project?
An **Event Booking System** API that allows:
- Users to register/login with OTP verification
- Organizers to create and manage events
- Users to book tickets for events
- Complete booking lifecycle management

### Key Features
- 🔐 JWT-based authentication with OTP email verification
- 📧 Email service for sending OTPs
- 🎫 Event CRUD operations with filtering & pagination
- 📝 Booking management with payment confirmation
- 🛡️ Role-based access (organizers vs regular users)

---

## 2. Technology Stack

### Core Framework
```
┌─────────────────────────────────────────────────────────┐
│                      NestJS v11                         │
│  A progressive Node.js framework for building efficient │
│  and scalable server-side applications                  │
└─────────────────────────────────────────────────────────┘
```

### Dependencies Breakdown

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/core` | ^11.0.1 | Core NestJS functionality |
| `@nestjs/common` | ^11.0.1 | Common decorators, pipes, guards |
| `@nestjs/platform-express` | ^11.0.1 | Express HTTP adapter |
| `@nestjs/mongoose` | ^11.0.3 | MongoDB ODM integration |
| `@nestjs/jwt` | latest | JWT token generation/verification |
| `@nestjs/passport` | latest | Authentication middleware |
| `@nestjs/config` | ^4.0.2 | Environment configuration |
| `mongoose` | ^8.20.1 | MongoDB object modeling |
| `passport` | latest | Authentication strategies |
| `passport-jwt` | latest | JWT strategy for Passport |
| `bcrypt` | ^6.0.0 | Password hashing |
| `class-validator` | latest | DTO validation decorators |
| `class-transformer` | latest | Object transformation |
| `nodemailer` | latest | Email sending |

### Dev Dependencies

| Package | Purpose |
|---------|---------|
| `@types/*` | TypeScript type definitions |
| `ts-jest` | Jest for TypeScript |
| `eslint` | Code linting |
| `prettier` | Code formatting |

---

## 3. Project Architecture

### Folder Structure
```
src/
├── main.ts                      # Application entry point
├── app.module.ts                # Root module
├── app.controller.ts            # Root controller
├── app.service.ts               # Root service
│
├── auth/                        # Authentication Module
│   ├── auth.module.ts           # Module definition
│   ├── auth.controller.ts       # HTTP endpoints
│   ├── auth.service.ts          # Business logic
│   ├── dto/                     # Data Transfer Objects
│   │   ├── registerUser.dto.ts
│   │   ├── login.dto.ts
│   │   ├── verify-otp.dto.ts
│   │   ├── resend-otp.dto.ts
│   │   ├── forgot-password.dto.ts
│   │   └── reset-password.dto.ts
│   ├── guards/                  # Route protection
│   │   └── jwt-auth.guard.ts
│   ├── strategies/              # Passport strategies
│   │   └── jwt.strategy.ts
│   └── services/                # Additional services
│       └── email.service.ts
│
├── user/                        # User Module
│   ├── user.module.ts
│   ├── user.service.ts
│   └── schemas/
│       └── user.schema.ts       # MongoDB schema
│
├── event/                       # Event Module
│   ├── event.module.ts
│   ├── event.controller.ts
│   ├── event.service.ts
│   ├── dto/
│   │   ├── create-event.dto.ts
│   │   └── update-event.dto.ts
│   └── schemas/
│       └── event.schema.ts
│
└── booking/                     # Booking Module
    ├── booking.module.ts
    ├── booking.controller.ts
    ├── booking.service.ts
    ├── dto/
    │   ├── create-booking.dto.ts
    │   └── cancel-booking.dto.ts
    └── schemas/
        └── booking.schema.ts
```

### Module Dependency Graph
```
                    ┌──────────────┐
                    │  AppModule   │
                    └──────┬───────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│  AuthModule  │   │ EventModule  │   │BookingModule │
└──────┬───────┘   └──────┬───────┘   └──────┬───────┘
       │                  │                  │
       ▼                  │                  │
┌──────────────┐          │                  │
│  UserModule  │◄─────────┴──────────────────┘
└──────────────┘
```

---

## 4. NestJS Core Concepts

### 4.1 Modules (`@Module`)

Modules are the building blocks of NestJS applications. They organize code into cohesive blocks.

```typescript
@Module({
  imports: [],      // Other modules this module depends on
  controllers: [],  // Controllers that belong to this module
  providers: [],    // Services/providers for dependency injection
  exports: [],      // Providers to share with other modules
})
export class SomeModule {}
```

**Example from our project:**
```typescript
// auth.module.ts
@Module({
  imports: [
    UserModule,                    // Import UserModule to use UserService
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({...}), // Configure JWT
    ConfigModule,
  ],
  controllers: [AuthController],   // Handle HTTP requests
  providers: [
    AuthService,                   // Business logic
    JwtStrategy,                   // JWT validation
    EmailService,                  // Send emails
  ],
  exports: [AuthService],          // Allow other modules to use AuthService
})
export class AuthModule {}
```

### 4.2 Controllers (`@Controller`)

Controllers handle incoming HTTP requests and return responses.

```typescript
@Controller('auth')  // Base route: /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')  // POST /auth/register
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('profile')    // GET /auth/profile
  @UseGuards(JwtAuthGuard)  // Protected route
  async getProfile(@Request() req) {
    return req.user;
  }
}
```

**Key Decorators:**
| Decorator | Purpose |
|-----------|---------|
| `@Controller('path')` | Define controller with base route |
| `@Get()`, `@Post()`, `@Patch()`, `@Delete()` | HTTP methods |
| `@Body()` | Extract request body |
| `@Param('id')` | Extract route parameters |
| `@Query('key')` | Extract query parameters |
| `@Request()` | Access full request object |
| `@UseGuards()` | Apply guards for protection |
| `@HttpCode()` | Set response status code |

### 4.3 Services (`@Injectable`)

Services contain business logic and are injectable via dependency injection.

```typescript
@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,  // Injected
    private readonly jwtService: JwtService,    // Injected
  ) {}

  async register(dto: RegisterDto) {
    // Business logic here
  }
}
```

### 4.4 Dependency Injection (DI)

NestJS uses DI to manage dependencies automatically.

```
┌─────────────────────────────────────────────────────────────┐
│                    How DI Works                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Define @Injectable() class (Service)                    │
│                                                              │
│  2. Add to module's providers: [AuthService]                │
│                                                              │
│  3. Inject in constructor: constructor(private auth: Auth)  │
│                                                              │
│  4. NestJS automatically creates & injects instance         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 4.5 Guards

Guards determine if a request should be handled (authentication/authorization).

```typescript
// jwt-auth.guard.ts
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err, user, info) {
    if (err || !user) {
      throw new UnauthorizedException('Please log in');
    }
    return user;
  }
}

// Usage in controller
@Get('profile')
@UseGuards(JwtAuthGuard)  // Only authenticated users
async getProfile(@Request() req) {
  return req.user;
}
```

### 4.6 Pipes (Validation)

Pipes transform and validate input data.

```typescript
// main.ts - Global validation pipe
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,           // Remove unknown properties
    forbidNonWhitelisted: true, // Error on unknown properties
    transform: true,           // Auto-transform types
  }),
);
```

### 4.7 DTOs (Data Transfer Objects)

DTOs define the shape of data and validation rules.

```typescript
// register.dto.ts
export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  @MinLength(2)
  fname: string;

  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[A-Z])(?=.*[0-9])/, {
    message: 'Password must have uppercase and number',
  })
  password: string;
}
```

**Common Validators:**
| Validator | Purpose |
|-----------|---------|
| `@IsString()` | Must be string |
| `@IsNumber()` | Must be number |
| `@IsEmail()` | Valid email format |
| `@IsNotEmpty()` | Cannot be empty |
| `@MinLength(n)` | Minimum length |
| `@MaxLength(n)` | Maximum length |
| `@Matches(regex)` | Match pattern |
| `@IsOptional()` | Field is optional |
| `@IsEnum(enum)` | Must be enum value |
| `@IsDate()` | Must be valid date |
| `@Type(() => Date)` | Transform to type |

---

## 5. Module Deep Dive

### 5.1 User Module

**Purpose:** Manage user data and database operations.

**Schema (`user.schema.ts`):**
```typescript
@Schema({ timestamps: true })
export class User {
  _id: Types.ObjectId;

  @Prop({ required: true })
  fname: string;

  @Prop({ required: true })
  lname: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ required: true })
  password: string;  // Hashed with bcrypt

  @Prop({ default: null })
  otp: string;       // For email verification

  @Prop({ default: null })
  otpExpires: Date;

  @Prop({ default: false })
  isVerified: boolean;
}
```

**Service Methods:**
| Method | Purpose |
|--------|---------|
| `createUser()` | Create new user in DB |
| `findByEmail()` | Find user by email |
| `findById()` | Find user by ID |
| `updateOtp()` | Store OTP for verification |
| `verifyUser()` | Mark user as verified |
| `clearOtp()` | Remove OTP after use |
| `updatePassword()` | Change password |
| `getProfile()` | Get user profile (no sensitive data) |

### 5.2 Auth Module

**Purpose:** Handle all authentication operations.

**Flow Diagram - Registration:**
```
┌──────────┐    ┌──────────────┐    ┌─────────────┐    ┌───────────┐
│  Client  │───▶│ AuthController│───▶│ AuthService │───▶│UserService│
└──────────┘    └──────────────┘    └─────────────┘    └───────────┘
     │                                     │                  │
     │  POST /auth/register                │                  │
     │  {fname, lname, email, password}    │                  │
     │                                     │                  │
     │                              ┌──────▼──────┐           │
     │                              │ Hash Password│           │
     │                              │ (bcrypt)    │           │
     │                              └──────┬──────┘           │
     │                                     │                  │
     │                              ┌──────▼──────┐           │
     │                              │ Generate OTP│           │
     │                              │ (6 digits)  │           │
     │                              └──────┬──────┘           │
     │                                     │                  │
     │                                     ▼                  │
     │                              ┌─────────────┐           │
     │                              │EmailService │           │
     │                              │ Send OTP    │           │
     │                              └─────────────┘           │
     │                                     │                  │
     │◀────────────────────────────────────┘                  │
     │  {message: "Check email for OTP"}                      │
```

**Flow Diagram - Login:**
```
┌──────────┐    ┌──────────────┐    ┌─────────────┐
│  Client  │───▶│ AuthController│───▶│ AuthService │
└──────────┘    └──────────────┘    └─────────────┘
     │                                     │
     │  POST /auth/login                   │
     │  {email, password}                  │
     │                                     │
     │                              ┌──────▼──────┐
     │                              │ Find User   │
     │                              │ by Email    │
     │                              └──────┬──────┘
     │                                     │
     │                              ┌──────▼──────┐
     │                              │Check Verified│
     │                              └──────┬──────┘
     │                                     │
     │                              ┌──────▼──────┐
     │                              │Compare Hash │
     │                              │(bcrypt)     │
     │                              └──────┬──────┘
     │                                     │
     │                              ┌──────▼──────┐
     │                              │Generate JWT │
     │                              │Token        │
     │                              └──────┬──────┘
     │                                     │
     │◀────────────────────────────────────┘
     │  {accessToken: "eyJhbG...", user: {...}}
```

**JWT Strategy (`jwt.strategy.ts`):**
```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extract token from: Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  // Called after token is verified
  async validate(payload: { sub: string; email: string }) {
    // Return value is attached to request.user
    return { userId: payload.sub, email: payload.email };
  }
}
```

### 5.3 Event Module

**Purpose:** CRUD operations for events.

**Schema (`event.schema.ts`):**
```typescript
@Schema({ timestamps: true })
export class Event {
  _id: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  date: Date;

  @Prop()
  endDate: Date;

  @Prop({ required: true })
  venue: string;

  @Prop({ type: String, enum: EventCategory })
  category: EventCategory;

  @Prop({ required: true, min: 0 })
  ticketPrice: number;

  @Prop({ required: true, min: 1 })
  totalTickets: number;

  @Prop({ default: 0 })
  bookedTickets: number;

  @Prop({ type: String, enum: EventStatus })
  status: EventStatus;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  organizer: Types.ObjectId;  // Who created the event
}
```

**Enums:**
```typescript
enum EventStatus {
  UPCOMING = 'upcoming',
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

enum EventCategory {
  CONFERENCE = 'conference',
  WORKSHOP = 'workshop',
  CONCERT = 'concert',
  SPORTS = 'sports',
  EXHIBITION = 'exhibition',
  MEETUP = 'meetup',
  OTHER = 'other',
}
```

**Service Methods:**
| Method | Purpose |
|--------|---------|
| `create()` | Create event (validates date is future) |
| `findAll()` | Get events with filters & pagination |
| `findOne()` | Get single event by ID |
| `update()` | Update event (organizer only) |
| `remove()` | Delete event (no bookings allowed) |
| `findByOrganizer()` | Get user's events |
| `updateBookedTickets()` | Increment/decrement ticket count |
| `getUpcomingEvents()` | Get featured events |

**Filtering & Pagination:**
```typescript
// GET /api/events?category=conference&minPrice=50&page=1&limit=10

async findAll(filters, pagination) {
  const query = {};
  
  if (filters.category) query.category = filters.category;
  if (filters.search) {
    query.$or = [
      { title: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } },
    ];
  }
  
  const skip = (page - 1) * limit;
  
  return this.eventModel
    .find(query)
    .populate('organizer', 'fname lname')
    .sort({ date: 1 })
    .skip(skip)
    .limit(limit);
}
```

### 5.4 Booking Module

**Purpose:** Handle event bookings.

**Schema (`booking.schema.ts`):**
```typescript
@Schema({ timestamps: true })
export class Booking {
  _id: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Event' })
  event: Types.ObjectId;

  @Prop({ required: true, min: 1 })
  numberOfTickets: number;

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ type: String, enum: BookingStatus })
  status: BookingStatus;

  @Prop({ type: String, enum: PaymentStatus })
  paymentStatus: PaymentStatus;

  @Prop()
  bookingReference: string;  // BK-2025-123456
}
```

**Booking Flow:**
```
┌─────────────────────────────────────────────────────────────┐
│                    BOOKING LIFECYCLE                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  1. CREATE BOOKING                                           │
│     └─▶ Status: PENDING, Payment: PENDING                   │
│     └─▶ Event bookedTickets += numberOfTickets              │
│                                                              │
│  2. CONFIRM PAYMENT                                          │
│     └─▶ Status: CONFIRMED, Payment: COMPLETED               │
│                                                              │
│  3. CANCEL (if needed, >24h before event)                   │
│     └─▶ Status: CANCELLED, Payment: REFUNDED                │
│     └─▶ Event bookedTickets -= numberOfTickets              │
│                                                              │
│  4. EVENT COMPLETED                                          │
│     └─▶ Status: COMPLETED                                   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 6. Authentication Flow

### Complete Auth Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    AUTHENTICATION FLOW                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 1. REGISTRATION                                          │   │
│  │    POST /api/auth/register                               │   │
│  │    ─────────────────────────                             │   │
│  │    • Validate DTO (class-validator)                      │   │
│  │    • Check if email exists                               │   │
│  │    • Hash password (bcrypt, 10 rounds)                   │   │
│  │    • Generate 6-digit OTP                                │   │
│  │    • Save user (isVerified: false)                       │   │
│  │    • Send OTP email                                      │   │
│  │    • Return: "Check email for OTP"                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 2. EMAIL VERIFICATION                                    │   │
│  │    POST /api/auth/verify-email                           │   │
│  │    ─────────────────────────────                         │   │
│  │    • Find user by email                                  │   │
│  │    • Validate OTP matches                                │   │
│  │    • Check OTP not expired (10 min)                      │   │
│  │    • Set isVerified: true                                │   │
│  │    • Clear OTP from database                             │   │
│  │    • Generate JWT token                                  │   │
│  │    • Return: { accessToken, user }                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 3. LOGIN                                                 │   │
│  │    POST /api/auth/login                                  │   │
│  │    ───────────────────────                               │   │
│  │    • Find user by email                                  │   │
│  │    • Check isVerified (send OTP if not)                  │   │
│  │    • Compare password hash (bcrypt)                      │   │
│  │    • Generate JWT token                                  │   │
│  │    • Return: { accessToken, user }                       │   │
│  └──────────────────────────────────────────────────────────┘   │
│                           │                                      │
│                           ▼                                      │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ 4. PROTECTED ROUTES                                      │   │
│  │    Authorization: Bearer <token>                         │   │
│  │    ─────────────────────────────                         │   │
│  │    • JwtAuthGuard intercepts request                     │   │
│  │    • Extract token from header                           │   │
│  │    • Verify signature with JWT_SECRET                    │   │
│  │    • Check expiration                                    │   │
│  │    • JwtStrategy.validate() called                       │   │
│  │    • User data attached to request.user                  │   │
│  │    • Continue to controller                              │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### JWT Token Structure

```
Header.Payload.Signature
─────────────────────────

Header (Algorithm & Type):
{
  "alg": "HS256",
  "typ": "JWT"
}

Payload (Data):
{
  "sub": "user_id_here",      // Subject (user ID)
  "email": "user@email.com",
  "iat": 1733356800,          // Issued at
  "exp": 1733961600           // Expires (7 days)
}

Signature:
HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  JWT_SECRET
)
```

---

## 7. Database & Mongoose

### 7.1 Connection Setup

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot(),  // Load .env
    MongooseModule.forRoot(process.env.MONGODB_URL),
  ],
})
```

### 7.2 Schema Definition

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Type for document with Mongoose methods
export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })  // Adds createdAt, updatedAt
export class User {
  _id: Types.ObjectId;  // MongoDB ObjectId

  @Prop({ required: true })
  name: string;

  @Prop({ unique: true, required: true })
  email: string;

  @Prop({ type: Types.ObjectId, ref: 'Event' })
  events: Types.ObjectId[];  // Reference to another collection
}

// Create the schema
export const UserSchema = SchemaFactory.createForClass(User);

// Add indexes
UserSchema.index({ email: 1 });

// Add virtual properties
UserSchema.virtual('fullName').get(function() {
  return `${this.fname} ${this.lname}`;
});

// Pre-save hooks
UserSchema.pre('save', async function(next) {
  // Do something before saving
  next();
});
```

### 7.3 Module Registration

```typescript
// user.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema }
    ]),
  ],
  providers: [UserService],
  exports: [UserService, MongooseModule],  // Export for other modules
})
```

### 7.4 Service Usage

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // CREATE
  async create(data: CreateUserDto): Promise<User> {
    const user = new this.userModel(data);
    return user.save();
  }

  // READ
  async findAll(): Promise<User[]> {
    return this.userModel.find().exec();
  }

  async findById(id: string): Promise<User> {
    return this.userModel.findById(id).exec();
  }

  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  // READ with Population (joins)
  async findWithEvents(id: string): Promise<User> {
    return this.userModel
      .findById(id)
      .populate('events', 'title date')  // Include only title, date
      .exec();
  }

  // UPDATE
  async update(id: string, data: UpdateUserDto): Promise<User> {
    return this.userModel
      .findByIdAndUpdate(id, data, { new: true })  // new: return updated
      .exec();
  }

  // DELETE
  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  // QUERY with Filters
  async findFiltered(filters: any): Promise<User[]> {
    const query: any = {};
    
    if (filters.name) {
      query.name = { $regex: filters.name, $options: 'i' };
    }
    
    return this.userModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip((filters.page - 1) * filters.limit)
      .limit(filters.limit)
      .exec();
  }
}
```

### 7.5 MongoDB Query Operators

| Operator | Purpose | Example |
|----------|---------|---------|
| `$eq` | Equal | `{ age: { $eq: 25 } }` |
| `$ne` | Not equal | `{ status: { $ne: 'deleted' } }` |
| `$gt` / `$gte` | Greater than | `{ price: { $gte: 100 } }` |
| `$lt` / `$lte` | Less than | `{ date: { $lt: new Date() } }` |
| `$in` | In array | `{ category: { $in: ['a', 'b'] } }` |
| `$regex` | Pattern match | `{ name: { $regex: 'john', $options: 'i' } }` |
| `$or` | OR condition | `{ $or: [{ a: 1 }, { b: 2 }] }` |
| `$and` | AND condition | `{ $and: [{ a: 1 }, { b: 2 }] }` |

---

## 8. API Endpoints Reference

### Authentication Endpoints

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | `{fname, lname, email, password}` | ❌ | Register new user |
| POST | `/api/auth/verify-email` | `{email, otp}` | ❌ | Verify email with OTP |
| POST | `/api/auth/resend-otp` | `{email}` | ❌ | Resend verification OTP |
| POST | `/api/auth/login` | `{email, password}` | ❌ | Login user |
| POST | `/api/auth/forgot-password` | `{email}` | ❌ | Request password reset |
| POST | `/api/auth/reset-password` | `{email, otp, newPassword}` | ❌ | Reset password |
| GET | `/api/auth/profile` | - | ✅ | Get current user profile |

### Event Endpoints

| Method | Endpoint | Body/Query | Auth | Description |
|--------|----------|------------|------|-------------|
| POST | `/api/events` | `{title, description, date, venue, ticketPrice, totalTickets, ...}` | ✅ | Create event |
| GET | `/api/events` | `?category=&status=&minPrice=&maxPrice=&search=&page=&limit=` | ❌ | Get all events |
| GET | `/api/events/upcoming` | `?limit=10` | ❌ | Get upcoming events |
| GET | `/api/events/my-events` | - | ✅ | Get organizer's events |
| GET | `/api/events/:id` | - | ❌ | Get single event |
| PATCH | `/api/events/:id` | `{fields to update}` | ✅ | Update event (organizer) |
| DELETE | `/api/events/:id` | - | ✅ | Delete event (organizer) |

### Booking Endpoints

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | `/api/bookings` | `{eventId, numberOfTickets, attendeeDetails?}` | ✅ | Create booking |
| GET | `/api/bookings` | - | ✅ | Get user's bookings |
| GET | `/api/bookings/stats` | - | ✅ | Get booking statistics |
| GET | `/api/bookings/reference/:ref` | - | ✅ | Get by reference number |
| GET | `/api/bookings/event/:eventId` | - | ✅ | Get event bookings (organizer) |
| GET | `/api/bookings/:id` | - | ✅ | Get single booking |
| POST | `/api/bookings/:id/confirm-payment` | `{paymentId}` | ✅ | Confirm payment |
| POST | `/api/bookings/:id/cancel` | `{cancellationReason?}` | ✅ | Cancel booking |

---

## 9. Key Libraries Explained

### 9.1 bcrypt - Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

// Hash a password
const saltRounds = 10;
const hashedPassword = await bcrypt.hash('plainPassword', saltRounds);
// Result: $2b$10$N9qo8uLOickgx2ZMRZoMy...

// Compare passwords
const isMatch = await bcrypt.compare('plainPassword', hashedPassword);
// Result: true or false
```

**Why 10 salt rounds?**
- Balance between security and performance
- Each increment doubles the time to hash
- 10 rounds ≈ 100ms on modern hardware

### 9.2 @nestjs/jwt - Token Management

```typescript
// Generating a token
const payload = { sub: userId, email: userEmail };
const token = this.jwtService.sign(payload);

// Verifying a token (usually done by strategy)
const decoded = this.jwtService.verify(token);

// Decoding without verification
const decoded = this.jwtService.decode(token);
```

### 9.3 Passport & passport-jwt

```typescript
// Strategy setup
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: 'secret',
    });
  }

  validate(payload) {
    // Called after token verified
    // Return value goes to request.user
    return { userId: payload.sub };
  }
}
```

### 9.4 class-validator & class-transformer

```typescript
// Validation
import { IsString, IsEmail, MinLength } from 'class-validator';

class CreateUserDto {
  @IsString()
  @MinLength(2)
  name: string;

  @IsEmail()
  email: string;
}

// Transformation
import { Type, Transform } from 'class-transformer';

class QueryDto {
  @Type(() => Number)  // Convert string "10" to number 10
  page: number;

  @Transform(({ value }) => value.toLowerCase())
  search: string;
}
```

### 9.5 nodemailer - Email Sending

```typescript
import * as nodemailer from 'nodemailer';

// Create transporter
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  auth: {
    user: 'your-email@gmail.com',
    pass: 'app-password',
  },
});

// Send email
await transporter.sendMail({
  from: '"App Name" <noreply@app.com>',
  to: 'user@example.com',
  subject: 'Verify Your Email',
  html: '<h1>Your OTP: 123456</h1>',
});
```

---

## 10. Best Practices Used

### 10.1 Code Organization
- ✅ Feature-based module structure
- ✅ Separation of concerns (Controller → Service → Repository)
- ✅ DTOs for request validation
- ✅ Schemas for database models

### 10.2 Security
- ✅ Password hashing with bcrypt
- ✅ JWT for stateless authentication
- ✅ OTP email verification
- ✅ Input validation and sanitization
- ✅ Guards for route protection
- ✅ Environment variables for secrets

### 10.3 Error Handling
```typescript
// Using NestJS exceptions
throw new BadRequestException('Invalid input');
throw new UnauthorizedException('Please log in');
throw new NotFoundException('Resource not found');
throw new ForbiddenException('Access denied');
throw new ConflictException('Resource already exists');
```

### 10.4 Response Format
```typescript
// Consistent response structure
return {
  success: true,
  message: 'Operation successful',
  data: result,
};

// With pagination
return {
  success: true,
  data: items,
  pagination: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    itemsPerPage: 10,
  },
};
```

### 10.5 Naming Conventions
| Type | Convention | Example |
|------|------------|---------|
| Files | kebab-case | `create-event.dto.ts` |
| Classes | PascalCase | `EventService` |
| Methods | camelCase | `findByEmail()` |
| Constants | UPPER_SNAKE | `SALT_ROUNDS` |
| Interfaces | PascalCase with I prefix | `IUser` (optional) |

---

## 11. Testing Guide

### 11.1 Unit Testing

```typescript
// user.service.spec.ts
describe('UserService', () => {
  let service: UserService;
  let model: Model<UserDocument>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should find user by email', async () => {
    const mockUser = { email: 'test@test.com' };
    jest.spyOn(model, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockUser),
    } as any);

    const result = await service.findByEmail('test@test.com');
    expect(result).toEqual(mockUser);
  });
});
```

### 11.2 E2E Testing

```typescript
// app.e2e-spec.ts
describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/api/auth/register (POST)', () => {
    return request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        fname: 'Test',
        lname: 'User',
        email: 'test@test.com',
        password: 'Password123!',
      })
      .expect(201);
  });
});
```

### 11.3 Running Tests

```bash
# Unit tests
npm run test

# Watch mode
npm run test:watch

# E2E tests
npm run test:e2e

# Coverage report
npm run test:cov
```

---

## 12. Deployment Considerations

### 12.1 Environment Variables (Production)

```env
NODE_ENV=production
PORT=3000

# Use strong, random secret
JWT_SECRET=generate-a-256-bit-random-string

# Use MongoDB Atlas or dedicated server
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/db

# Use production email service
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

### 12.2 Security Checklist

- [ ] Change JWT_SECRET to strong random value
- [ ] Use HTTPS in production
- [ ] Set proper CORS origins
- [ ] Enable rate limiting
- [ ] Add helmet for security headers
- [ ] Validate and sanitize all inputs
- [ ] Use MongoDB Atlas with IP whitelist
- [ ] Store OTPs hashed (not plain text)
- [ ] Implement refresh tokens for long sessions

### 12.3 Performance Tips

- [ ] Add database indexes for frequently queried fields
- [ ] Implement caching (Redis) for repeated queries
- [ ] Use pagination for large datasets
- [ ] Compress responses (gzip)
- [ ] Use connection pooling for MongoDB

### 12.4 Docker Deployment

```dockerfile
# Dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
```

```yaml
# docker-compose.yml (production)
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - MONGODB_URL=mongodb://mongo:27017/ems
    depends_on:
      - mongo
  
  mongo:
    image: mongo
    volumes:
      - mongo_data:/data/db

volumes:
  mongo_data:
```

---

## 🎓 Summary

This Event Booking System demonstrates:

1. **NestJS Architecture** - Modules, Controllers, Services, Guards
2. **Authentication** - JWT + OTP email verification
3. **MongoDB/Mongoose** - Schema design, relationships, queries
4. **Validation** - DTOs with class-validator
5. **Security** - Password hashing, token-based auth, guards
6. **Best Practices** - Clean code, separation of concerns, error handling

### Next Steps to Learn

1. Add refresh tokens for better security
2. Implement role-based access control (RBAC)
3. Add file upload for event images
4. Integrate payment gateway (Stripe)
5. Add WebSocket for real-time notifications
6. Implement caching with Redis
7. Add rate limiting
8. Write comprehensive tests

---

**Happy Coding! 🚀**
