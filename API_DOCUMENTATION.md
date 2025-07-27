# PlanD API Documentation

## Overview

This document provides comprehensive documentation for all API endpoints in the PlanD School Absence Management System. The API is built with Next.js 15 App Router and follows RESTful conventions.

## Base URL

```
Development: http://localhost:3000/api
Production: https://your-domain.com/api
```

## Authentication

All API endpoints (except public ones) require authentication via NextAuth.js session cookies. Include the session cookie in your requests.

### Authentication Headers
```
Cookie: next-auth.session-token=<session-token>
```

## API Endpoints Summary

### 🏫 **Setup Wizard**
- `POST /api/setup-wizard/complete` - Complete 5-step school setup

### 👥 **Admin Dashboard**
- `GET /api/admin/stats` - Get admin statistics
- `GET /api/admin/schools` - Get all schools (super admin)
- `PUT /api/admin/schools/:schoolId` - Update school settings

### 📧 **Notifications**
- `POST /api/notifications` - Send email notification
- `GET /api/notifications/settings` - Get notification settings
- `PUT /api/notifications/settings` - Update notification settings
- `GET /api/notifications/templates` - Get email templates
- `PUT /api/notifications/templates/:templateId` - Update email template
- `POST /api/notifications/custom` - Send custom notification
- `GET /api/notifications/history` - Get notification history
- `GET /api/notifications/stats` - Get notification statistics
- `GET /api/notifications/preferences/:userId` - Get user notification preferences
- `PUT /api/notifications/preferences/:userId` - Update user notification preferences

### 📋 **Absences Management**
- `GET /api/absences` - Get all absences (with filtering/pagination)
- `POST /api/absences` - Create new absence
- `GET /api/absences/:absenceId` - Get specific absence
- `PUT /api/absences/:absenceId` - Update absence
- `DELETE /api/absences/:absenceId` - Delete absence

### 👨‍🏫 **Teachers Management**
- `GET /api/teachers` - Get all teachers
- `POST /api/teachers` - Create new teacher
- `GET /api/teachers/:teacherId` - Get specific teacher
- `PUT /api/teachers/:teacherId` - Update teacher
- `DELETE /api/teachers/:teacherId` - Delete teacher

### 🔄 **Substitutes Management**
- `GET /api/substitutes` - Get all substitutes
- `POST /api/substitutes` - Create new substitute
- `GET /api/substitutes/:substituteId` - Get specific substitute
- `PUT /api/substitutes/:substituteId` - Update substitute
- `GET /api/substitutes/:substituteId/availability` - Check substitute availability

### 📊 **Coverage Management**
- `POST /api/coverage/assign` - Assign coverage
- `GET /api/coverage/suggestions/:absenceId` - Get AI coverage suggestions
- `PUT /api/coverage/:coverageId` - Update coverage status

### 📈 **Reports & Analytics**
- `GET /api/reports/absences` - Get absence reports
- `GET /api/reports/substitutes` - Get substitute performance reports

### 🔧 **System Configuration**
- `GET /api/settings` - Get system settings
- `PUT /api/settings` - Update system settings

### 🔐 **Authentication** (NextAuth.js)
- Uses session cookies for authentication
- All endpoints require authentication except public ones

**Total: 28+ API endpoints** covering complete school absence management functionality including setup, user management, absence tracking, substitute assignment, notifications, reporting, and system configuration.

## API Endpoints

### 🏫 Setup Wizard

#### Complete Setup Wizard
**POST** `/api/setup-wizard/complete`

Complete the 5-step school setup process and create all necessary database records.

**Request Body:**
```json
{
  "step1": {
    "name": "Lincoln High School",
    "location": "123 Main St, Springfield, IL",
    "type": "public",
    "grades": "9-12",
    "studentCount": 1200,
    "phone": "555-0123",
    "website": "https://lincolnhigh.edu"
  },
  "step2": {
    "startTime": "08:00",
    "endTime": "15:30",
    "periodsPerDay": 7,
    "periodLength": 50,
    "lunchTime": "12:00",
    "lunchDuration": 30
  },
  "step3": [
    {
      "name": "John Smith",
      "email": "john.smith@school.edu",
      "subjects": ["Mathematics", "Algebra"],
      "schedule": {
        "monday": ["Period 1", "Period 3", "Period 5"],
        "tuesday": ["Period 2", "Period 4", "Period 6"],
        "wednesday": ["Period 1", "Period 3", "Period 5"],
        "thursday": ["Period 2", "Period 4", "Period 6"],
        "friday": ["Period 1", "Period 3"]
      }
    }
  ],
  "step4": [
    {
      "name": "Jane Doe",
      "email": "jane.doe@email.com",
      "phone": "555-0199",
      "subjects": ["Mathematics", "Science"],
      "availability": {
        "monday": true,
        "tuesday": true,
        "wednesday": false,
        "thursday": true,
        "friday": true
      },
      "hourlyRate": 25.00,
      "experience": 5,
      "certification": "State Certified"
    }
  ],
  "step5": {
    "notificationEmail": "admin@school.edu",
    "autoAssign": true,
    "requireApproval": false,
    "advanceNotice": 24
  }
}
```

**Response:**
```json
{
  "success": true,
  "schoolId": "clx1234567890",
  "message": "School setup completed successfully",
  "data": {
    "school": { /* school object */ },
    "teachersCreated": 5,
    "substitutesCreated": 3,
    "systemConfigured": true
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "field": "step1.name",
    "message": "School name is required"
  }
}
```

---

### 👥 Admin Dashboard

#### Get Admin Statistics
**GET** `/api/admin/stats`

Retrieve comprehensive statistics for the admin dashboard.

**Query Parameters:**
- `period` (optional): `today` | `week` | `month` | `year` (default: `month`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "overview": {
      "totalAbsences": 45,
      "pendingCoverage": 12,
      "activeSubstitutes": 8,
      "totalTeachers": 25
    },
    "trends": {
      "absencesThisMonth": 45,
      "absencesLastMonth": 38,
      "coverageRate": 89.5,
      "averageResponseTime": "2.5 hours"
    },
    "breakdowns": {
      "absencesByReason": {
        "sick": 28,
        "personal": 12,
        "professional": 5
      },
      "absencesByGrade": {
        "elementary": 15,
        "middle": 18,
        "high": 12
      },
      "substituteUtilization": {
        "high": 3,
        "medium": 8,
        "low": 4
      }
    },
    "recentActivity": [
      {
        "id": "abs_123",
        "type": "absence_created",
        "teacher": "John Smith",
        "date": "2025-01-28",
        "status": "covered",
        "timestamp": "2025-01-27T10:30:00Z"
      }
    ]
  }
}
```

#### Get All Schools
**GET** `/api/admin/schools`

Retrieve list of all schools (super admin only).

**Response:**
```json
{
  "success": true,
  "schools": [
    {
      "id": "school_123",
      "name": "Lincoln High School",
      "location": "Springfield, IL",
      "type": "public",
      "activeUsers": 28,
      "setupCompleted": true,
      "createdAt": "2025-01-15T09:00:00Z"
    }
  ]
}
```

#### Update School Settings
**PUT** `/api/admin/schools/:schoolId`

Update school configuration and settings.

**Request Body:**
```json
{
  "name": "Updated School Name",
  "settings": {
    "autoAssign": true,
    "requireApproval": false,
    "advanceNotice": 48,
    "notificationEmail": "admin@school.edu"
  }
}
```

---

### 📧 Notifications

#### Send Email Notification
**POST** `/api/notifications`

Send email notifications for absences and coverage updates.

**Request Body:**
```json
{
  "type": "absence_created" | "coverage_assigned" | "coverage_completed",
  "recipients": ["email1@school.edu", "email2@school.edu"],
  "templateData": {
    "teacherName": "John Smith",
    "date": "2025-01-28",
    "periods": ["Period 1", "Period 3"],
    "substituteName": "Jane Doe",
    "additionalNotes": "Math homework on desk"
  }
}
```

**Response:**
```json
{
  "success": true,
  "emailsSent": 2,
  "messageId": "email_123456"
}
```

#### Get Notification Settings
**GET** `/api/notifications/settings`

Retrieve current notification preferences.

**Response:**
```json
{
  "success": true,
  "settings": {
    "emailEnabled": true,
    "smsEnabled": false,
    "reminderHours": 24,
    "notifyOnAssignment": true,
    "notifyOnCompletion": true
  }
}
```

#### Update Notification Settings
**PUT** `/api/notifications/settings`

Update notification preferences.

**Request Body:**
```json
{
  "emailEnabled": true,
  "smsEnabled": false,
  "reminderHours": 24,
  "notifyOnAssignment": true,
  "notifyOnCompletion": true
}
```

#### Get Email Templates
**GET** `/api/notifications/templates`

Retrieve all email templates used by the notification system.

**Response:**
```json
{
  "success": true,
  "templates": {
    "absence_created": {
      "id": "tpl_absence_created",
      "name": "Absence Created",
      "subject": "New Absence Request - {{teacherName}} - {{date}}",
      "htmlContent": "<html>...</html>",
      "textContent": "A new absence has been created...",
      "variables": ["teacherName", "date", "periods", "reason", "notes"]
    },
    "coverage_assigned": {
      "id": "tpl_coverage_assigned",
      "name": "Coverage Assigned",
      "subject": "Coverage Assignment - {{teacherName}} - {{date}}",
      "htmlContent": "<html>...</html>",
      "textContent": "You have been assigned to cover...",
      "variables": ["substituteName", "teacherName", "date", "periods", "subjects"]
    }
  }
}
```

#### Update Email Template
**PUT** `/api/notifications/templates/:templateId`

Customize email templates with your school's branding and messaging.

**Request Body:**
```json
{
  "subject": "URGENT: Coverage Assignment - {{teacherName}} - {{date}}",
  "htmlContent": "<html><body>...</body></html>",
  "textContent": "You have been assigned to cover an absence...",
  "active": true
}
```

#### Send Custom Notification
**POST** `/api/notifications/custom`

Send custom notifications outside of the automated system.

**Request Body:**
```json
{
  "recipients": ["admin@school.edu", "substitute@email.com"],
  "subject": "Important School Update",
  "message": "Custom message content",
  "priority": "normal" | "high" | "urgent",
  "scheduleFor": "2025-01-28T08:00:00Z",
  "attachments": [
    {
      "filename": "schedule.pdf",
      "content": "base64-encoded-content",
      "contentType": "application/pdf"
    }
  ]
}
```

#### Get Notification History
**GET** `/api/notifications/history`

Retrieve history of all sent notifications.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `type` (optional): Filter by notification type
- `recipient` (optional): Filter by recipient email
- `dateFrom` (optional): Start date filter (YYYY-MM-DD)
- `dateTo` (optional): End date filter (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "notif_123",
      "type": "absence_created",
      "recipients": ["admin@school.edu"],
      "subject": "New Absence Request - John Smith - 2025-01-28",
      "status": "delivered",
      "sentAt": "2025-01-27T10:30:00Z",
      "deliveredAt": "2025-01-27T10:30:15Z",
      "openedAt": "2025-01-27T10:45:00Z",
      "metadata": {
        "absenceId": "abs_123",
        "teacherId": "teacher_456"
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "pages": 8
  }
}
```

#### Get Notification Statistics
**GET** `/api/notifications/stats`

Retrieve notification delivery and engagement statistics.

**Query Parameters:**
- `period` (optional): `today` | `week` | `month` | `year` (default: `month`)

**Response:**
```json
{
  "success": true,
  "stats": {
    "overview": {
      "totalSent": 485,
      "deliveryRate": 98.5,
      "openRate": 76.2,
      "clickRate": 34.8,
      "bounceRate": 1.5
    },
    "byType": {
      "absence_created": {
        "sent": 125,
        "delivered": 123,
        "opened": 98
      },
      "coverage_assigned": {
        "sent": 89,
        "delivered": 88,
        "opened": 72
      }
    },
    "trends": [
      {
        "date": "2025-01-27",
        "sent": 15,
        "delivered": 15,
        "opened": 12
      }
    ],
    "topRecipients": [
      {
        "email": "admin@school.edu",
        "received": 45,
        "opened": 42,
        "openRate": 93.3
      }
    ]
  }
}
```

#### Notification Preferences API
**GET** `/api/notifications/preferences/:userId`

Get individual user notification preferences.

**Response:**
```json
{
  "success": true,
  "preferences": {
    "userId": "user_123",
    "email": "teacher@school.edu",
    "notifications": {
      "absenceReminders": true,
      "coverageUpdates": true,
      "systemAlerts": false,
      "weeklyReports": true,
      "urgentOnly": false
    },
    "deliveryMethod": "email",
    "timezone": "America/Chicago",
    "preferredTime": "08:00"
  }
}
```

**PUT** `/api/notifications/preferences/:userId`

Update individual user notification preferences.

**Request Body:**
```json
{
  "notifications": {
    "absenceReminders": false,
    "coverageUpdates": true,
    "systemAlerts": true
  },
  "preferredTime": "09:00"
}
```

---

### � Notification System

The PlanD notification system provides comprehensive email notifications for all absence-related events. The system supports automated notifications, custom templates, and configurable settings to keep all stakeholders informed in real-time.

#### System Overview

The notification system automatically triggers emails for the following events:
- **Absence Created**: When a teacher submits an absence request
- **Coverage Assigned**: When a substitute is assigned to cover an absence
- **Coverage Confirmed**: When a substitute confirms their assignment
- **Coverage Completed**: When a coverage assignment is marked as completed
- **Coverage Cancelled**: When a coverage assignment is cancelled
- **Reminder Notifications**: Automated reminders before absence dates

#### System Requirements & Setup

**Infrastructure Requirements:**
- **SMTP Server**: Configured email server for sending notifications
- **Email Service Provider**: Recommended services (SendGrid, AWS SES, Mailgun, or similar)
- **Queue System**: Redis or in-memory queue for handling email delivery
- **Environment Variables**: Proper configuration for email credentials

**Required Environment Variables:**
```bash
# Email Service Configuration
EMAIL_PROVIDER=sendgrid                    # sendgrid | ses | smtp | mailgun
EMAIL_FROM=noreply@yourschool.edu         # Sender email address
EMAIL_FROM_NAME="PlanD School System"      # Sender display name

# SendGrid Configuration (if using SendGrid)
SENDGRID_API_KEY=your_sendgrid_api_key

# SMTP Configuration (if using custom SMTP)
SMTP_HOST=smtp.yourschool.edu
SMTP_PORT=587
SMTP_SECURE=true
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password

# AWS SES Configuration (if using AWS SES)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key

# Notification Settings
NOTIFICATION_QUEUE_URL=redis://localhost:6379/0
EMAIL_RATE_LIMIT=100                       # Emails per minute
NOTIFICATION_RETRY_ATTEMPTS=3
NOTIFICATION_RETRY_DELAY=5000              # Milliseconds
```

**Database Requirements:**
```sql
-- Notification Templates Table
CREATE TABLE notification_templates (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  variables JSON,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Notification History Table
CREATE TABLE notification_history (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(100) NOT NULL,
  recipients JSON NOT NULL,
  subject TEXT NOT NULL,
  content TEXT,
  status ENUM('pending', 'sent', 'delivered', 'failed', 'bounced') DEFAULT 'pending',
  sent_at TIMESTAMP NULL,
  delivered_at TIMESTAMP NULL,
  opened_at TIMESTAMP NULL,
  error_message TEXT NULL,
  metadata JSON,
  school_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Table
CREATE TABLE user_notification_preferences (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  email_enabled BOOLEAN DEFAULT true,
  absence_reminders BOOLEAN DEFAULT true,
  coverage_updates BOOLEAN DEFAULT true,
  system_alerts BOOLEAN DEFAULT true,
  weekly_reports BOOLEAN DEFAULT true,
  urgent_only BOOLEAN DEFAULT false,
  preferred_time TIME DEFAULT '08:00:00',
  timezone VARCHAR(50) DEFAULT 'America/Chicago',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

**Package Dependencies:**
```json
{
  "dependencies": {
    "@sendgrid/mail": "^7.7.0",
    "aws-sdk": "^2.1490.0",
    "nodemailer": "^6.9.7",
    "bull": "^4.12.0",
    "redis": "^4.6.10",
    "handlebars": "^4.7.8",
    "mjml": "^4.14.1"
  }
}
```

**Service Configuration:**
```typescript
// Email service configuration
export const emailConfig = {
  provider: process.env.EMAIL_PROVIDER || 'smtp',
  rateLimit: parseInt(process.env.EMAIL_RATE_LIMIT || '100'),
  retryAttempts: parseInt(process.env.NOTIFICATION_RETRY_ATTEMPTS || '3'),
  retryDelay: parseInt(process.env.NOTIFICATION_RETRY_DELAY || '5000'),
  templates: {
    baseUrl: '/email-templates',
    engine: 'handlebars'
  },
  queue: {
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      db: parseInt(process.env.REDIS_DB || '0')
    }
  }
};
```

#### Email Templates

The system includes pre-built email templates for each notification type:

**Absence Created Template:**
```
Subject: New Absence Request - [Teacher Name] - [Date]

Dear [Recipient],

A new absence has been created:

Teacher: [Teacher Name]
Date: [Absence Date]
Periods: [Period List]
Reason: [Absence Reason]
Notes: [Additional Notes]

Please log into the system to assign coverage.

Best regards,
PlanD Absence Management System
```

**Coverage Assigned Template:**
```
Subject: Coverage Assignment - [Teacher Name] - [Date]

Dear [Substitute Name],

You have been assigned to cover the following absence:

Teacher: [Teacher Name]
Date: [Absence Date]
Periods: [Period List]
Subject(s): [Subject List]
Location: [Classroom/Location]

Please confirm your availability by [Confirmation Deadline].

Best regards,
PlanD Absence Management System
```

#### Notification Recipients

The system automatically determines email recipients based on the notification type:

- **Absence Created**: School administrators, designated absence coordinators
- **Coverage Assigned**: Assigned substitute teacher, school administrators
- **Coverage Confirmed**: School administrators, original teacher (if applicable)
- **Coverage Completed**: School administrators, substitute teacher
- **System Alerts**: All administrators with system notification permissions

#### Automated Notification Rules

**Immediate Notifications:**
- Absence creation confirmation
- Coverage assignment alerts
- Coverage status changes

**Scheduled Notifications:**
- Daily digest of pending absences (8:00 AM)
- Reminder emails 24 hours before absence date
- Weekly coverage reports (Fridays at 5:00 PM)
- Monthly analytics summary (1st of each month)

**Escalation Notifications:**
- Uncovered absences 4 hours before start time
- Failed coverage assignments after 2 hours
- System errors and critical alerts

---

### �📋 Absences Management

#### Get All Absences
**GET** `/api/absences`

Retrieve list of absences with filtering and pagination.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): `pending` | `covered` | `uncovered` | `completed`
- `teacherId` (optional): Filter by specific teacher
- `dateFrom` (optional): Start date filter (YYYY-MM-DD)
- `dateTo` (optional): End date filter (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "absences": [
    {
      "id": "abs_123",
      "teacherId": "teacher_456",
      "teacherName": "John Smith",
      "date": "2025-01-28",
      "periods": ["Period 1", "Period 3", "Period 5"],
      "reason": "sick",
      "status": "covered",
      "substituteId": "sub_789",
      "substituteName": "Jane Doe",
      "notes": "Lesson plans in desk drawer",
      "createdAt": "2025-01-27T08:00:00Z",
      "updatedAt": "2025-01-27T09:15:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "pages": 3
  }
}
```

#### Create New Absence
**POST** `/api/absences`

Create a new teacher absence record.

**Request Body:**
```json
{
  "teacherId": "teacher_456",
  "date": "2025-01-28",
  "periods": ["Period 1", "Period 3", "Period 5"],
  "reason": "sick" | "personal" | "professional" | "emergency",
  "notes": "Lesson plans are in the desk drawer",
  "subjects": ["Mathematics", "Algebra"],
  "priority": "normal" | "urgent"
}
```

**Response:**
```json
{
  "success": true,
  "absence": {
    "id": "abs_123",
    "teacherId": "teacher_456",
    "date": "2025-01-28",
    "periods": ["Period 1", "Period 3", "Period 5"],
    "reason": "sick",
    "status": "pending",
    "notes": "Lesson plans are in the desk drawer",
    "createdAt": "2025-01-27T08:00:00Z"
  }
}
```

#### Get Specific Absence
**GET** `/api/absences/:absenceId`

Retrieve details of a specific absence.

**Response:**
```json
{
  "success": true,
  "absence": {
    "id": "abs_123",
    "teacher": {
      "id": "teacher_456",
      "name": "John Smith",
      "email": "john.smith@school.edu",
      "subjects": ["Mathematics", "Algebra"]
    },
    "substitute": {
      "id": "sub_789",
      "name": "Jane Doe",
      "email": "jane.doe@email.com",
      "phone": "555-0199"
    },
    "date": "2025-01-28",
    "periods": ["Period 1", "Period 3", "Period 5"],
    "reason": "sick",
    "status": "covered",
    "notes": "Lesson plans in desk drawer",
    "coverage": {
      "assignedAt": "2025-01-27T09:15:00Z",
      "confirmedAt": "2025-01-27T09:30:00Z",
      "completedAt": null
    }
  }
}
```

#### Update Absence
**PUT** `/api/absences/:absenceId`

Update an existing absence record.

**Request Body:**
```json
{
  "periods": ["Period 1", "Period 3"],
  "notes": "Updated lesson plans location",
  "status": "covered",
  "substituteId": "sub_789"
}
```

#### Delete Absence
**DELETE** `/api/absences/:absenceId`

Cancel/delete an absence record.

**Response:**
```json
{
  "success": true,
  "message": "Absence deleted successfully"
}
```

---

### 👨‍🏫 Teachers Management

#### Get All Teachers
**GET** `/api/teachers`

Retrieve list of all teachers.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `subject` (optional): Filter by subject
- `active` (optional): Filter by active status (true/false)

**Response:**
```json
{
  "success": true,
  "teachers": [
    {
      "id": "teacher_456",
      "name": "John Smith",
      "email": "john.smith@school.edu",
      "subjects": ["Mathematics", "Algebra"],
      "schedule": {
        "monday": ["Period 1", "Period 3", "Period 5"],
        "tuesday": ["Period 2", "Period 4", "Period 6"],
        "wednesday": ["Period 1", "Period 3", "Period 5"],
        "thursday": ["Period 2", "Period 4", "Period 6"],
        "friday": ["Period 1", "Period 3"]
      },
      "active": true,
      "hireDate": "2023-08-15",
      "absenceStats": {
        "totalAbsences": 8,
        "thisMonth": 2,
        "averagePerMonth": 1.5
      }
    }
  ]
}
```

#### Create New Teacher
**POST** `/api/teachers`

Add a new teacher to the system.

**Request Body:**
```json
{
  "name": "John Smith",
  "email": "john.smith@school.edu",
  "subjects": ["Mathematics", "Algebra"],
  "schedule": {
    "monday": ["Period 1", "Period 3", "Period 5"],
    "tuesday": ["Period 2", "Period 4", "Period 6"],
    "wednesday": ["Period 1", "Period 3", "Period 5"],
    "thursday": ["Period 2", "Period 4", "Period 6"],
    "friday": ["Period 1", "Period 3"]
  },
  "hireDate": "2024-08-15"
}
```

#### Get Specific Teacher
**GET** `/api/teachers/:teacherId`

Retrieve details of a specific teacher.

**Response:**
```json
{
  "success": true,
  "teacher": {
    "id": "teacher_456",
    "name": "John Smith",
    "email": "john.smith@school.edu",
    "subjects": ["Mathematics", "Algebra"],
    "schedule": { /* schedule object */ },
    "active": true,
    "recentAbsences": [
      {
        "id": "abs_123",
        "date": "2025-01-28",
        "reason": "sick",
        "status": "covered"
      }
    ],
    "stats": {
      "totalAbsences": 8,
      "coverageRate": 95.5,
      "averageNoticeHours": 18.5
    }
  }
}
```

#### Update Teacher
**PUT** `/api/teachers/:teacherId`

Update teacher information.

**Request Body:**
```json
{
  "name": "John Smith Jr.",
  "subjects": ["Mathematics", "Algebra", "Calculus"],
  "schedule": { /* updated schedule */ },
  "active": true
}
```

#### Delete Teacher
**DELETE** `/api/teachers/:teacherId`

Remove a teacher from the system.

**Response:**
```json
{
  "success": true,
  "message": "Teacher deleted successfully"
}
```

---

### 🔄 Substitutes Management

#### Get All Substitutes
**GET** `/api/substitutes`

Retrieve list of all substitute teachers.

**Query Parameters:**
- `available` (optional): Filter by availability (true/false)
- `subject` (optional): Filter by subject specialty
- `date` (optional): Check availability for specific date (YYYY-MM-DD)

**Response:**
```json
{
  "success": true,
  "substitutes": [
    {
      "id": "sub_789",
      "name": "Jane Doe",
      "email": "jane.doe@email.com",
      "phone": "555-0199",
      "subjects": ["Mathematics", "Science"],
      "availability": {
        "monday": true,
        "tuesday": true,
        "wednesday": false,
        "thursday": true,
        "friday": true
      },
      "hourlyRate": 25.00,
      "experience": 5,
      "certification": "State Certified",
      "active": true,
      "rating": 4.8,
      "completedAssignments": 45,
      "currentWorkload": 2
    }
  ]
}
```

#### Create New Substitute
**POST** `/api/substitutes`

Add a new substitute teacher to the system.

**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane.doe@email.com",
  "phone": "555-0199",
  "subjects": ["Mathematics", "Science"],
  "availability": {
    "monday": true,
    "tuesday": true,
    "wednesday": false,
    "thursday": true,
    "friday": true
  },
  "hourlyRate": 25.00,
  "experience": 5,
  "certification": "State Certified"
}
```

#### Get Specific Substitute
**GET** `/api/substitutes/:substituteId`

Retrieve details of a specific substitute teacher.

**Response:**
```json
{
  "success": true,
  "substitute": {
    "id": "sub_789",
    "name": "Jane Doe",
    "email": "jane.doe@email.com",
    "phone": "555-0199",
    "subjects": ["Mathematics", "Science"],
    "availability": { /* availability object */ },
    "hourlyRate": 25.00,
    "experience": 5,
    "certification": "State Certified",
    "active": true,
    "performance": {
      "rating": 4.8,
      "totalAssignments": 45,
      "completedAssignments": 43,
      "cancelledAssignments": 2,
      "averageRating": 4.8,
      "onTimeRate": 98.5
    },
    "recentAssignments": [
      {
        "id": "abs_123",
        "teacherName": "John Smith",
        "date": "2025-01-25",
        "periods": ["Period 1", "Period 3"],
        "subject": "Mathematics",
        "status": "completed",
        "rating": 5
      }
    ]
  }
}
```

#### Update Substitute
**PUT** `/api/substitutes/:substituteId`

Update substitute teacher information.

**Request Body:**
```json
{
  "availability": {
    "monday": true,
    "tuesday": false,
    "wednesday": true,
    "thursday": true,
    "friday": true
  },
  "hourlyRate": 27.50,
  "subjects": ["Mathematics", "Science", "Physics"]
}
```

#### Check Substitute Availability
**GET** `/api/substitutes/:substituteId/availability`

Check if a substitute is available for specific dates and times.

**Query Parameters:**
- `date`: Date to check (YYYY-MM-DD)
- `periods`: Comma-separated list of periods

**Response:**
```json
{
  "success": true,
  "available": true,
  "conflicts": [],
  "currentWorkload": 1,
  "maxWorkload": 3
}
```

---

### 📊 Coverage Management

#### Assign Coverage
**POST** `/api/coverage/assign`

Assign a substitute to cover a teacher absence.

**Request Body:**
```json
{
  "absenceId": "abs_123",
  "substituteId": "sub_789",
  "autoNotify": true
}
```

**Response:**
```json
{
  "success": true,
  "coverage": {
    "id": "cov_456",
    "absenceId": "abs_123",
    "substituteId": "sub_789",
    "status": "assigned",
    "assignedAt": "2025-01-27T09:15:00Z",
    "estimatedHours": 5.5,
    "estimatedPay": 137.50
  }
}
```

#### Get Coverage Suggestions
**GET** `/api/coverage/suggestions/:absenceId`

Get AI-powered suggestions for substitute assignments.

**Response:**
```json
{
  "success": true,
  "suggestions": [
    {
      "substituteId": "sub_789",
      "substituteName": "Jane Doe",
      "matchScore": 95,
      "reasons": [
        "Subject match: Mathematics",
        "Available all requested periods",
        "High rating (4.8/5)",
        "Previous experience with teacher"
      ],
      "hourlyRate": 25.00,
      "estimatedPay": 137.50
    }
  ]
}
```

#### Update Coverage Status
**PUT** `/api/coverage/:coverageId`

Update the status of a coverage assignment.

**Request Body:**
```json
{
  "status": "confirmed" | "declined" | "completed" | "cancelled",
  "notes": "Assignment completed successfully",
  "rating": 5
}
```

---

### 📈 Reports & Analytics

#### Get Absence Report
**GET** `/api/reports/absences`

Generate detailed absence reports with various filters.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `teacherId` (optional): Specific teacher
- `grade` (optional): Grade level filter
- `format` (optional): `json` | `csv` (default: json)

**Response:**
```json
{
  "success": true,
  "report": {
    "period": {
      "startDate": "2025-01-01",
      "endDate": "2025-01-31"
    },
    "summary": {
      "totalAbsences": 45,
      "totalDays": 31,
      "averagePerDay": 1.45,
      "coverageRate": 89.5,
      "costOfCoverage": 3250.00
    },
    "breakdown": {
      "byReason": {
        "sick": 28,
        "personal": 12,
        "professional": 5
      },
      "byGrade": {
        "elementary": 15,
        "middle": 18,
        "high": 12
      },
      "byDay": {
        "monday": 12,
        "tuesday": 8,
        "wednesday": 7,
        "thursday": 9,
        "friday": 9
      }
    },
    "trends": [
      {
        "date": "2025-01-01",
        "absences": 2,
        "covered": 2,
        "uncovered": 0
      }
    ]
  }
}
```

#### Get Substitute Performance Report
**GET** `/api/reports/substitutes`

Generate substitute performance and utilization reports.

**Query Parameters:**
- `startDate`: Start date (YYYY-MM-DD)
- `endDate`: End date (YYYY-MM-DD)
- `substituteId` (optional): Specific substitute

**Response:**
```json
{
  "success": true,
  "report": {
    "summary": {
      "totalSubstitutes": 15,
      "activeSubstitutes": 12,
      "totalAssignments": 145,
      "averageRating": 4.6,
      "totalCost": 18750.00
    },
    "performance": [
      {
        "substituteId": "sub_789",
        "name": "Jane Doe",
        "assignments": 12,
        "completionRate": 100,
        "averageRating": 4.8,
        "totalEarnings": 1650.00,
        "utilizationRate": 75
      }
    ]
  }
}
```

---

### 🔧 System Configuration

#### Get System Settings
**GET** `/api/settings`

Retrieve current system configuration.

**Response:**
```json
{
  "success": true,
  "settings": {
    "school": {
      "name": "Lincoln High School",
      "timezone": "America/Chicago",
      "academicYear": "2024-2025"
    },
    "notifications": {
      "emailEnabled": true,
      "reminderHours": 24,
      "autoAssign": true
    },
    "coverage": {
      "requireApproval": false,
      "maxWorkloadPerSub": 3,
      "advanceNoticeHours": 24
    }
  }
}
```

#### Update System Settings
**PUT** `/api/settings`

Update system configuration.

**Request Body:**
```json
{
  "notifications": {
    "emailEnabled": true,
    "reminderHours": 48
  },
  "coverage": {
    "requireApproval": true,
    "maxWorkloadPerSub": 2
  }
}
```

---

## Error Handling

All API endpoints follow consistent error response format:

### Error Response Format
```json
{
  "success": false,
  "error": "Error type",
  "message": "Human-readable error message",
  "details": {
    "field": "fieldName",
    "code": "VALIDATION_ERROR"
  }
}
```

### Common HTTP Status Codes

- **200**: Success
- **201**: Created
- **400**: Bad Request - Invalid input data
- **401**: Unauthorized - Authentication required
- **403**: Forbidden - Insufficient permissions
- **404**: Not Found - Resource doesn't exist
- **409**: Conflict - Resource already exists
- **422**: Unprocessable Entity - Validation failed
- **500**: Internal Server Error

### Common Error Types

- `VALIDATION_ERROR`: Input validation failed
- `AUTHENTICATION_REQUIRED`: User not authenticated
- `PERMISSION_DENIED`: Insufficient permissions
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `DUPLICATE_RESOURCE`: Resource already exists
- `BUSINESS_RULE_VIOLATION`: Operation violates business rules

---

## Rate Limiting

API endpoints have the following rate limits:

- **Authentication endpoints**: 5 requests per minute
- **Read operations**: 100 requests per minute
- **Write operations**: 50 requests per minute
- **Email notifications**: 20 requests per minute

Rate limit headers are included in responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1643723400
```

---

## SDKs and Libraries

### JavaScript/TypeScript SDK Example

```javascript
class PlanDAPI {
  constructor(baseUrl, sessionToken) {
    this.baseUrl = baseUrl;
    this.sessionToken = sessionToken;
  }

  async createAbsence(absenceData) {
    const response = await fetch(`${this.baseUrl}/api/absences`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': `next-auth.session-token=${this.sessionToken}`
      },
      body: JSON.stringify(absenceData)
    });
    return response.json();
  }

  async getSubstitutes(filters = {}) {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`${this.baseUrl}/api/substitutes?${queryString}`, {
      headers: {
        'Cookie': `next-auth.session-token=${this.sessionToken}`
      }
    });
    return response.json();
  }
}
```

---

## Webhook Events

PlanD supports webhooks for real-time event notifications:

### Available Events

- `absence.created`: New absence created
- `absence.updated`: Absence information changed
- `coverage.assigned`: Substitute assigned to absence
- `coverage.confirmed`: Substitute confirmed assignment
- `coverage.completed`: Coverage assignment completed
- `substitute.registered`: New substitute added
- `teacher.absence_pattern`: Pattern detection in teacher absences

### Webhook Payload Example

```json
{
  "event": "coverage.assigned",
  "timestamp": "2025-01-27T09:15:00Z",
  "data": {
    "absenceId": "abs_123",
    "teacherId": "teacher_456",
    "substituteId": "sub_789",
    "date": "2025-01-28",
    "periods": ["Period 1", "Period 3"]
  },
  "school": {
    "id": "school_123",
    "name": "Lincoln High School"
  }
}
```

---

## Testing

### Test Environment

Base URL: `http://localhost:3000/api`

### Test Data

Use the setup wizard to create test data, or use these endpoints to seed data:

```bash
# Create test school
POST /api/setup-wizard/complete
# Body: (see setup wizard documentation above)

# Test authentication
POST /api/auth/signin
# Body: { email: "admin@school.com", password: "password123" }
```

### Postman Collection

A Postman collection with all endpoints and example requests is available in the repository at `/docs/postman/PlanD-API.postman_collection.json`.

---

## Support

For API support and questions:

- **Documentation**: This file
- **GitHub Issues**: [Create an issue](https://github.com/SignificantEd/PlanD-Project/issues)
- **Email**: support@pland.com

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- Complete CRUD operations for all entities
- Authentication system
- Real-time notifications
- Advanced reporting
- Setup wizard integration

---

*Last updated: January 27, 2025*
