# E-Service System Documentation

## Table of Contents
1. [System Overview](#system-overview)
2. [System Architecture](#system-architecture)
3. [User Roles and Permissions](#user-roles-and-permissions)
4. [Core Functionalities](#core-functionalities)
5. [Technical Stack](#technical-stack)
6. [Database Schema](#database-schema)
7. [Features by Role](#features-by-role)

---

## System Overview

**E-Service** is a comprehensive Government Services Management System designed to streamline and digitize public service delivery. The system enables citizens to apply for government services online, track their applications, schedule appointments, and receive services efficiently through a multi-tenant, multi-language platform.

### Key Features
- **Multi-Tenant Architecture**: Support for multiple government offices with independent configurations
- **Multi-Language Support**: Available in English (en), Amharic (am), and Oromo (or)
- **Role-Based Access Control**: Four distinct user roles with specific permissions
- **Service Management**: Complete lifecycle management of government services
- **Request Processing**: Digital application and approval workflow
- **Appointment Scheduling**: Integrated appointment booking system
- **Report Management**: Internal reporting and communication system
- **File Management**: Secure document upload and management
- **Responsive Design**: Mobile-friendly interface with PWA support

---

## System Architecture

### Technology Stack
- **Frontend**: Next.js 15.5.4 (React 19.1.0) with TypeScript
- **Backend**: Next.js API Routes
- **Database**: MySQL (via Prisma ORM)
- **Authentication**: NextAuth.js v5
- **State Management**: Zustand
- **UI Framework**: Tailwind CSS 4 with Radix UI components
- **File Storage**: Local file system (`filedata` directory)
- **PDF Processing**: react-pdf (PDF.js)

### Application Structure
```
app/
├── [lang]/                    # Language routing (en, am, or)
│   ├── dashboard/            # Authenticated user dashboard
│   │   ├── @admin/          # Admin-specific routes
│   │   ├── @manager/        # Manager-specific routes
│   │   ├── @staff/          # Staff-specific routes
│   │   └── @customer/       # Customer-specific routes
│   └── (guest)/             # Public routes
├── api/                      # API endpoints
└── not-found.tsx            # 404 error page
```

---

## User Roles and Permissions

The system supports **4 primary user roles**, each with distinct responsibilities and access levels:

### 1. Admin (Administrator)
**Role ID**: `admin`

**Responsibilities**:
- System-wide administration and oversight
- Complete user management across all offices
- Office creation and management
- Global service management
- System configuration and settings
- Access to all reports and analytics
- Language and localization management
- Gallery and content management

**Key Capabilities**:
- Create, edit, and delete users across all offices
- Assign roles and permissions to users
- Manage offices (create, update, configure)
- View and manage all service requests system-wide
- Access comprehensive system analytics
- Manage system-wide configurations
- Handle reports from managers
- View all appointments across offices

**Dashboard Modules**:
- Overview/Dashboard
- User Management
- Office Management
- My Office (assigned office management)
- Request Management
- Reports
- Profile
- Languages Configuration
- Gallery Management
- About Page Management

---

### 2. Manager (Office Manager)
**Role ID**: `manager`

**Responsibilities**:
- Manage operations within their assigned office
- Oversee staff members in their office
- Manage services offered by their office
- Approve/reject service requests
- Schedule and manage appointments
- Create and send reports to administrators
- Configure office-specific settings

**Key Capabilities**:
- Manage staff members within their office
- Create, edit, and manage services for their office
- Assign services to specific staff members
- Review and approve/reject service requests
- Schedule appointments for approved requests
- Create and send reports to administrators
- Configure office availability and working hours
- View office-specific analytics and statistics
- Manage office profile and settings

**Dashboard Modules**:
- Overview/Dashboard
- Services Management
- Staff Management
- Request Management
- Reports (create and send to admins)
- Configuration (Office settings, Availability)
- Profile

---

### 3. Staff (Service Provider)
**Role ID**: `staff`

**Responsibilities**:
- Process service requests assigned to them
- Approve or reject requests at staff level
- Manage appointments for their assigned services
- Upload and manage service-related documents
- View assigned services and requests
- Create reports for managers

**Key Capabilities**:
- View and process service requests assigned to their services
- Approve or reject requests with notes
- Schedule appointments for approved requests
- Upload and manage files related to requests
- View their assigned services
- Create reports and send to managers
- Manage their profile
- View appointment schedules

**Dashboard Modules**:
- Overview/Dashboard
- Request Management (assigned requests)
- Service Management (assigned services)
- Appointments
- Reports (create and send to managers)
- Profile

---

### 4. Customer (Citizen/Applicant)
**Role ID**: `customer`

**Responsibilities**:
- Apply for government services
- Track application status
- Schedule appointments
- Upload required documents
- Provide feedback on services
- Manage personal profile

**Key Capabilities**:
- Browse available services by office
- Submit service requests with required information
- Upload supporting documents
- Track request status (pending, approved, rejected)
- Schedule appointments for approved requests
- View appointment history
- Submit feedback and ratings for completed services
- Apply for services on behalf of others
- Manage personal profile and information

**Dashboard Modules**:
- Overview/Dashboard
- Apply for Service
- My Requests
- Appointments
- Feedback
- Profile

---

## Core Functionalities

### 1. Service Management
- **Service Creation**: Define services with name, description, and processing time
- **Service Requirements**: Specify required documents/information for each service
- **Service Assignment**: Assign services to specific staff members
- **Service Categories**: Organize services by office and purpose
- **Service For**: Define target audience for each service

### 2. Request Management
- **Request Submission**: Customers can submit service requests with:
  - Selected service
  - Current address
  - Preferred date
  - Supporting documents
- **Request Status**: Three-level status tracking:
  - Staff-level approval/rejection
  - Manager-level approval/rejection
  - Admin-level approval/rejection
- **Request for Others**: Customers can apply on behalf of family members
- **File Attachments**: Support for multiple file types (PDF, images, documents)
- **Request Tracking**: Real-time status updates

### 3. Appointment Scheduling
- **Appointment Booking**: Schedule appointments for approved requests
- **Office Availability**: Configure working hours and availability
- **Slot Management**: Time slot configuration (default: 30 minutes)
- **Date Overrides**: Special hours for specific dates
- **Unavailable Dates**: Holiday and maintenance period management
- **Appointment Status**: Track appointment status (pending, completed, cancelled)

### 4. Report Management
- **Report Creation**: Managers and staff can create reports
- **Report Sending**: Send reports to administrators or managers
- **Report Status**: Track report status (pending, sent, received, read, archived)
- **File Attachments**: Attach files to reports
- **Report Viewing**: View received reports with file previews

### 5. User Management
- **User Creation**: Create users with role assignment
- **Role Assignment**: Assign users to specific roles and offices
- **User Activation**: Enable/disable user accounts
- **Phone Verification**: OTP-based phone number verification
- **Password Management**: Secure password hashing and reset functionality

### 6. Office Management
- **Office Creation**: Create and configure government offices
- **Office Profile**: Manage office information (name, address, contact)
- **Office Logo**: Upload and manage office branding
- **Subdomain Support**: Multi-tenant subdomain configuration
- **Office Settings**: JSON-based flexible settings storage

### 7. File Management
- **File Upload**: Secure file upload system
- **File Types**: Support for PDF, images, and Office documents
- **File Preview**: In-browser preview for PDFs and images
- **File Download**: Secure file download with access control
- **File Organization**: Files organized by request, report, or user

### 8. Multi-Language Support
- **Supported Languages**: English, Amharic, Oromo
- **Language Detection**: Automatic language detection based on browser settings
- **Language Switching**: User-selectable language preference
- **Localized Content**: All UI elements and content translated
- **Language Persistence**: Language preference saved in localStorage

### 9. Authentication & Security
- **Phone-Based Authentication**: Login using phone number and password
- **OTP Verification**: One-time password for phone verification
- **Session Management**: Secure session handling with NextAuth
- **Role-Based Access**: Route protection based on user roles
- **Account Status**: Active/inactive account management

### 10. Gallery Management
- **Gallery Creation**: Create image galleries
- **Image Upload**: Upload and organize images
- **Image Ordering**: Custom ordering for gallery display
- **Gallery Display**: Public-facing gallery showcase

---

## Technical Stack

### Frontend Technologies
- **Next.js 15.5.4**: React framework with App Router
- **React 19.1.0**: UI library
- **TypeScript**: Type-safe development
- **Tailwind CSS 4**: Utility-first CSS framework
- **Radix UI**: Accessible component primitives
- **Lucide React**: Icon library
- **Zustand**: Lightweight state management
- **React Hook Form**: Form management
- **Zod**: Schema validation
- **Sonner**: Toast notifications
- **react-pdf**: PDF viewing capabilities

### Backend Technologies
- **Next.js API Routes**: Server-side API endpoints
- **Prisma ORM**: Database access layer
- **MySQL**: Relational database
- **NextAuth.js v5**: Authentication framework
- **bcryptjs**: Password hashing
- **Date-fns**: Date manipulation

### Development Tools
- **Turbopack**: Fast bundler for development
- **ESLint**: Code linting
- **TypeScript**: Static type checking

---

## Database Schema

### Core Models

#### User
- User accounts with authentication credentials
- Role assignment and account status
- Phone verification status

#### Office
- Government office information
- Multi-tenant configuration
- Office-specific settings

#### Service
- Service definitions
- Office association
- Requirements and target audience

#### Request
- Service application requests
- Multi-level approval workflow
- File attachments

#### Appointment
- Scheduled appointments
- Staff assignment
- Status tracking

#### Report
- Internal reports
- Report status tracking
- File attachments

#### Staff
- Staff member information
- Office assignment
- Service assignments

#### Role & Permission
- Role-based access control
- Custom role creation
- Permission management

---

## Features by Role

### Admin Features
1. **Dashboard Overview**
   - System-wide statistics
   - Recent activities
   - Quick actions

2. **User Management**
   - Create/edit/delete users
   - Assign roles and offices
   - Activate/deactivate accounts
   - Search and filter users

3. **Office Management**
   - Create and manage offices
   - Configure office settings
   - Upload office logos
   - Manage office profiles

4. **My Office**
   - Manage assigned office
   - View office requests
   - Manage office services
   - View office appointments

5. **Request Management**
   - View all requests system-wide
   - Approve/reject requests
   - View request details
   - Manage request files

6. **Reports**
   - Receive reports from managers
   - View report details
   - Archive reports
   - Download report files

7. **Configuration**
   - Language management
   - Gallery management
   - About page content
   - System settings

### Manager Features
1. **Dashboard Overview**
   - Office-specific statistics
   - Recent requests
   - Staff performance

2. **Services Management**
   - Create/edit/delete services
   - Define service requirements
   - Assign services to staff
   - Manage service details

3. **Staff Management**
   - Add/edit staff members
   - Assign staff to office
   - View staff assignments
   - Manage staff profiles

4. **Request Management**
   - View office requests
   - Approve/reject requests
   - Schedule appointments
   - Manage request workflow

5. **Reports**
   - Create reports
   - Send reports to admins
   - View sent reports
   - Attach files to reports

6. **Configuration**
   - Office settings
   - Office availability
   - Working hours configuration
   - Holiday management

### Staff Features
1. **Dashboard Overview**
   - Assigned requests
   - Upcoming appointments
   - Service assignments

2. **Request Management**
   - View assigned requests
   - Approve/reject requests
   - Add approval notes
   - Upload request files

3. **Service Management**
   - View assigned services
   - Service details
   - Service requirements

4. **Appointments**
   - View appointments
   - Appointment details
   - Appointment status

5. **Reports**
   - Create reports
   - Send reports to managers
   - View sent reports

### Customer Features
1. **Dashboard Overview**
   - My requests
   - Upcoming appointments
   - Service applications

2. **Apply for Service**
   - Browse services
   - Select office
   - Submit service request
   - Upload documents

3. **My Requests**
   - View all requests
   - Track request status
   - View request details
   - Upload additional files

4. **Appointments**
   - View appointments
   - Appointment details
   - Appointment history

5. **Feedback**
   - Submit feedback
   - Rate services
   - View feedback history

---

## System Statistics

### User Roles
- **4 Primary Roles**: Admin, Manager, Staff, Customer
- **Unlimited Users**: System supports unlimited users per role
- **Multi-Office Support**: Users can be assigned to specific offices

### Core Entities
- **Offices**: Multiple government offices (multi-tenant)
- **Services**: Unlimited services per office
- **Requests**: Unlimited service requests
- **Appointments**: Unlimited appointment scheduling
- **Reports**: Unlimited report creation
- **Files**: Secure file storage and management

### Supported File Types
- **PDF Documents**: Full preview support with PDF.js
- **Images**: JPG, PNG, GIF with preview
- **Office Documents**: Word, Excel, PowerPoint (via Office Online viewer)
- **Other Files**: Download-only support

---

## Security Features

1. **Authentication**
   - Secure password hashing (bcrypt)
   - Phone-based login
   - Session management

2. **Authorization**
   - Role-based access control
   - Route protection
   - API endpoint security

3. **File Security**
   - Secure file storage
   - Access-controlled file serving
   - File type validation

4. **Data Protection**
   - SQL injection prevention (Prisma)
   - XSS protection
   - CSRF protection

---

## Multi-Language Support

### Supported Languages
1. **English (en)**: Default language
2. **Amharic (am)**: Ethiopian language
3. **Oromo (or)**: Ethiopian language

### Language Features
- Automatic language detection
- User-selectable language
- Persistent language preference
- Fully translated UI
- Localized content

---

## System Requirements

### Server Requirements
- Node.js 18+ 
- MySQL 8.0+
- 2GB+ RAM recommended
- 10GB+ storage for files

### Browser Support
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

---

## Deployment

### Environment Variables
- `DATABASE_URL`: MySQL connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `NEXTAUTH_URL`: Application URL

### File Storage
- Files stored in `filedata/` directory
- Secure API endpoints for file access
- File size limits configurable

---

## Future Enhancements

Potential features for future development:
- Email notifications
- SMS notifications
- Advanced analytics dashboard
- Mobile app (React Native)
- Payment integration
- Digital signatures
- Advanced reporting tools
- API for third-party integrations

---

## Support and Maintenance

### Default Credentials
- **Admin**: username: `admin`, password: `password123`
- **Manager**: username: `manager`, password: `password123`
- **Staff**: username: `staff`, password: `password123`
- **Customer**: username: `customer`, password: `password123`

*Note: Change default passwords in production environment*

---

## Version Information

- **System Version**: 0.1.0
- **Last Updated**: 2024
- **Framework**: Next.js 15.5.4
- **Database**: MySQL via Prisma ORM

---

## Contact and Documentation

For technical support, feature requests, or bug reports, please contact the development team.

**System Name**: E-Service Government Services Management System  
**Purpose**: Digitize and streamline government service delivery  
**Target Users**: Government offices, staff, and citizens

---

*This documentation is maintained as part of the E-Service system. Last updated: 2024*

