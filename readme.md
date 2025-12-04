# Event Management System API 📅

A comprehensive API roadmap for the Banquet & Party Palace Booking System built with **NestJS**.

## 📌 Project Roadmap
The development is divided into **3 Levels** of complexity.

- [ ] **Level 1:** Foundation (MVP) - Auth, Basic Listing, Booking.
- [ ] **Level 2:** Real World Features - Images, Calendar, Packages.
- [ ] **Level 3:** Production Ready - Notifications, Reviews, Admin Dashboard.

---

## 🟢 Level 1: Foundation (MVP)
*Goal: Core functionality. Users can register, owners can list basic text details, and booking works.*

### 🔐 Auth Module
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/auth/register` | Register User or Venue Owner | Public |
| ⬜ | `POST` | `/auth/login` | Login (Returns JWT) | Public |
| ⬜ | `GET` | `/users/me` | Get current profile details | Auth |

### 🏢 Venues Module (Basic)
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/venues` | Create a new Venue (Name, Loc, Price) | Owner |
| ⬜ | `GET` | `/venues` | List all venues (Simple list) | Public |
| ⬜ | `GET` | `/venues/:id` | Get specific venue details | Public |
| ⬜ | `PATCH` | `/venues/:id` | Update basic venue info | Owner |

### 📅 Booking Module (Transactional)
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/bookings` | Create a booking (Date, Guest Count) | User |
| ⬜ | `GET` | `/bookings/my-bookings` | User booking history | User |
| ⬜ | `GET` | `/bookings/venue/:venueId` | Owner sees bookings for their venue | Owner |
| ⬜ | `PATCH` | `/bookings/:id/status` | Owner approves/rejects booking | Owner |

---

## 🟡 Level 2: Advanced Features
*Goal: Handle complexity. File uploads, calendar blocking logic, and search filters.*

### 📂 File Uploads
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/uploads/venue-images` | Upload venue gallery images | Owner |
| ⬜ | `POST` | `/uploads/avatar` | Upload profile picture | Auth |

### 📆 Calendar & Availability
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `GET` | `/calendar/:venueId` | Get booked/blocked dates | Public |
| ⬜ | `POST` | `/calendar/block` | Owner manually blocks dates | Owner |
| ⬜ | `DELETE` | `/calendar/block/:id` | Unblock a date | Owner |
| ⬜ | `GET` | `/calendar/check` | Check if a specific date is free | Public |

### 🍽️ Packages & Menus
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/venues/:id/packages` | Create package (e.g. "Gold Menu") | Owner |
| ⬜ | `GET` | `/venues/:id/packages` | List packages for a venue | Public |
| ⬜ | `DELETE` | `/packages/:id` | Remove a package | Owner |

### 🔍 Advanced Search
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `GET` | `/venues/search` | Filter: `?date=X&guests=Y&price=Z` | Public |

---

## 🔴 Level 3: Official & Admin
*Goal: Platform management, social proof, and polish.*

### 🔔 Notifications
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `GET` | `/notifications` | Get list of notifications | Auth |
| ⬜ | `PATCH` | `/notifications/read` | Mark notification as read | Auth |

### ⭐ Reviews
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `POST` | `/reviews` | Write review (After booking done) | User |
| ⬜ | `GET` | `/reviews/venue/:id` | List public reviews | Public |
| ⬜ | `POST` | `/reviews/:id/reply` | Owner reply to review | Owner |

### 👑 Super Admin Dashboard
| Status | Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- | :--- |
| ⬜ | `GET` | `/admin/stats` | Total revenue / User counts | Super Admin |
| ⬜ | `GET` | `/admin/venues/pending` | Venues waiting for verification | Super Admin |
| ⬜ | `PATCH` | `/admin/venues/:id/verify`| Verify venue (Blue tick) | Super Admin |
| ⬜ | `PATCH` | `/admin/users/:id/ban` | Ban a user/owner | Super Admin |

---

## 🛠️ Recommended DTO Structure

**CreateVenueDto**
```json
{
  "name": "Grand Palace",
  "address": "Kathmandu",
  "description": "Best for weddings",
  "pricePerHour": 5000,
  "capacity": 500,
  "type": "BANQUET"
}
```

**CreateBookingDto**
```json
{
  "venueId": 1,
  "eventDate": "2025-12-25",
  "shift": "EVENING",
  "guestCount": 300,
  "packageId": 5
}
```
