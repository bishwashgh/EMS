Level 1: The Foundation (MVP)
Goal: Users can register, venue owners can list properties, and users can make a simple booking. Focus on: Basic CRUD (Create, Read, Update, Delete) and Authentication.

1. Auth & Users (Basic)
Method	Endpoint	Function
POST	/auth/register	Register User/Owner
POST	/auth/login	Login (Get JWT)
GET	/users/me	Get own profile
2. Venues (Basic Listing)
Method	Endpoint	Function
POST	/venues	Create a Venue (Name, Location, Price)
GET	/venues	List all venues (Simple list)
GET	/venues/:id	Get Venue Details
PATCH	/venues/:id	Update Venue
3. Bookings (The Core Transaction)
Method	Endpoint	Function
POST	/bookings	Book a venue (Date, Guest Count)
GET	/bookings/my-bookings	User sees their history
GET	/bookings/venue/:venueId	Owner sees who booked their venue
PATCH	/bookings/:id/status	Owner Accepts/Rejects booking
Level 2: The "Real World" Features
Goal: Handle the complexity of dates, images, and specific requirements (Menus/Packages). Focus on: Logic, Validation, and Media.

4. File Uploads (Images)
You cannot sell a venue without photos.

Method	Endpoint	Function
POST	/uploads/venue-images	Upload venue gallery images
POST	/uploads/avatar	Upload user profile picture
5. Calendar & Availability (Crucial)
Prevent double bookings.

Method	Endpoint	Function
GET	/calendar/:venueId	Get booked/blocked dates for UI
POST	/calendar/block	Owner manually blocks dates (e.g., maintenance)
GET	/calendar/check	API check: Is date X available?
6. Packages & Menus
Users usually book a "Gold Package" or "Buffet".

Method	Endpoint	Function
POST	/venues/:id/packages	Create Menu/Package (e.g., "Wedding Set")
GET	/venues/:id/packages	List packages for a venue
7. Advanced Search
Method	Endpoint	Function
GET	/venues/search	Filter by Date, Guests, Price Range, Location
Level 3: The Official & Admin Layer
Goal: Trust, Communication, and Platform Management. Focus on: Polish, Security, and Admin Control.

8. Notifications
Method	Endpoint	Function
GET	/notifications	List alerts (e.g., "Booking Approved")
PATCH	/notifications/read	Mark as read
9. Reviews & Ratings
Method	Endpoint	Function
POST	/reviews	Rate a venue (Only after booking is completed)
GET	/reviews/venue/:id	Show reviews to public
POST	/reviews/:id/reply	Owner replies to bad reviews
10. Super Admin Dashboard
Control the platform.

Method	Endpoint	Function
GET	/admin/stats	Revenue & User counts
GET	/admin/venues/pending	See venues waiting for approval
PATCH	/admin/venues/:id/verify	Approve a venue (Give it a "Verified" badge)
PATCH	/admin/users/:id/ban	Ban a fraudulent user
