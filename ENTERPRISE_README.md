# PlanD Enterprise - Advanced Coverage Management System

## 🎯 Overview

PlanD Enterprise is a comprehensive, enterprise-grade web application for substitute and internal teacher coverage management. It incorporates a sophisticated AI-driven assignment algorithm, year-long coverage tracking, administrator approval workflow, and a professional user interface.

**Tagline**: "Because Chaos Isn't on the Schedule"

## 🚀 Key Features

### Core Functionality
- **Advanced Coverage Algorithm**: Sophisticated 5-phase assignment system with priority-based processing
- **Year-Long Coverage Tracking**: Comprehensive historical data and audit trails
- **Administrator Approval Workflow**: Multi-step approval process for coverage assignments
- **Professional UI/UX**: Modern, responsive interface with real-time updates
- **CSV Import/Export**: Bulk data management for teachers and substitutes
- **Real-time Analytics**: Dashboard with key metrics and performance indicators

### Coverage Assignment Algorithm
The system implements a sophisticated 5-phase algorithm:

1. **Manual Override** (Highest Priority)
   - Pre-assigned substitutes or teachers
   - Immediate assignment without algorithm processing

2. **External Substitutes**
   - Available substitutes with matching qualifications
   - Department matching and workload balancing
   - Daily and weekly load limits

3. **Internal Teachers (Normal Coverage)**
   - Teachers with non-teaching periods
   - Department matching preferences
   - Standard load limits

4. **Internal Teachers (Emergency Coverage)**
   - Exceeds normal load limits
   - Highlighted for administrative review
   - Used when no other options available

5. **No Coverage Available**
   - Clear indication when no staff available
   - Requires manual intervention

## 🏗️ Architecture

### Technology Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js 15 with API Routes
- **Database**: Prisma ORM with SQLite (easily migratable to PostgreSQL)
- **Authentication**: NextAuth.js
- **Icons**: Heroicons
- **State Management**: React Hooks

### Data Models
The system uses comprehensive TypeScript interfaces:

- `ITeacher`: Teacher information with schedules and coverage limits
- `ISubstitute`: Substitute pool with qualifications and availability
- `IAbsence`: Absence records with period specifications
- `IAssignment`: Coverage assignments with approval workflow
- `ISettings`: System configuration and rules
- `ICoverageResult`: Algorithm results and statistics

## 📊 Dashboard Features

### Key Statistics
- **Teachers Absent**: Current day absence count
- **Periods to Cover**: Total periods needing coverage
- **Assignments Made**: Successful coverage assignments
- **Time Saved**: Calculated efficiency metric
- **Coverage Rate**: Percentage of periods covered
- **Pending Approvals**: Items awaiting admin review

### Quick Actions
- **🚀 Assign Coverage**: Trigger the coverage algorithm
- **Report Absence**: Add new absence records
- **Manage Substitutes**: Access substitute pool
- **Review Approvals**: Process pending assignments

## 📋 Navigation Structure

### Main Sections
1. **Dashboard**: Overview and quick actions
2. **Schedule**: Master schedule management with CSV import/export
3. **Absent Staff**: Absence reporting and management
4. **Substitute Pool**: Substitute database and availability
5. **Settings**: System configuration and rules
6. **Coverage Results**: Daily and historical assignments
7. **Approval Queue**: Pending assignments for review
8. **Reports**: Analytics and compliance reporting
9. **History**: Complete audit trail

## 🔧 Setup and Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pland
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   ```
   http://localhost:3000
   ```

## 📁 File Structure

```
pland/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API endpoints
│   │   │   ├── admin/         # Administrative APIs
│   │   │   ├── auth/          # Authentication
│   │   │   └── ...            # Other API routes
│   │   ├── dashboard/         # Dashboard page
│   │   ├── schedule/          # Schedule management
│   │   ├── approval-queue/    # Approval workflow
│   │   └── ...                # Other pages
│   ├── components/            # Reusable components
│   ├── lib/                   # Business logic
│   │   ├── coverage-algorithm.ts      # Original algorithm
│   │   └── enterprise-coverage-algorithm.ts  # Enhanced algorithm
│   └── types/                 # TypeScript interfaces
│       └── enterprise.ts      # Enterprise data models
├── prisma/                    # Database schema and migrations
├── public/                    # Static assets
└── sample-teachers.csv        # Sample data for testing
```

## 🔄 CSV Import/Export

### Teacher Schedule Import
**Format**: `Teacher_Name,Department,Room,Email,Phone,isPara,1A,1B,2A,2B,...,9A,9B,Prep_Periods,PLC_Periods,PD_Periods`

**Example**:
```csv
Teacher_Name,Department,Room,Email,Phone,isPara,1A,1B,2A,2B,3A,3B,4A,4B,Prep_Periods,PLC_Periods,PD_Periods
John Smith,Mathematics,Room 101,john.smith@school.edu,555-0101,false,Algebra 1,Algebra 1,Geometry,Geometry,Prep,Prep,Algebra 2,Algebra 2,2,3,1
```

### Substitute Pool Import
**Format**: `Substitute_Name,Email,Phone,Qualifications,Availability_A,Availability_B`

**Example**:
```csv
Substitute_Name,Email,Phone,Qualifications,Availability_A,Availability_B
Jane Doe,jane.doe@subs.edu,555-0201,"Math,Science","1,2,3","Full Day"
```

## 🎨 UI/UX Features

### Professional Design
- **Gradient Backgrounds**: Modern visual appeal
- **Card-based Layout**: Clean, organized information display
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Loading States**: Smooth user experience during data processing
- **Visual Feedback**: Color-coded status indicators

### Navigation
- **Sidebar Navigation**: Consistent navigation across all pages
- **Breadcrumbs**: Clear location awareness
- **Badge Notifications**: Pending approval counts
- **Quick Actions**: Frequently used functions easily accessible

## 🔐 Security Features

### Authentication & Authorization
- **NextAuth.js Integration**: Secure authentication
- **Role-based Access**: Admin, teacher, and substitute roles
- **Session Management**: Secure session handling
- **API Protection**: Protected administrative endpoints

### Data Validation
- **Input Validation**: Comprehensive form validation
- **CSV Validation**: File format and data integrity checks
- **Type Safety**: Full TypeScript implementation

## 📈 Performance & Scalability

### Performance Optimizations
- **Real-time Processing**: Coverage algorithm executes in <2 seconds
- **Database Indexing**: Optimized queries for large datasets
- **Caching**: Efficient data retrieval
- **Lazy Loading**: Progressive data loading

### Scalability Features
- **Modular Architecture**: Easy to extend and maintain
- **Database Agnostic**: Can migrate from SQLite to PostgreSQL
- **API-first Design**: Ready for mobile applications
- **Microservice Ready**: Can be split into separate services

## 🧪 Testing

### Sample Data
The system includes comprehensive sample data:
- **75-100 Teachers**: Various departments and schedules
- **15-20 Substitutes**: Different qualifications and availability
- **5-7 Absences**: Diverse absence scenarios for testing

### Test Scenarios
- **Coverage Algorithm**: Various absence types and staff availability
- **Approval Workflow**: Complete approval/rejection cycles
- **CSV Import/Export**: Data integrity and format validation
- **Edge Cases**: No coverage available, emergency situations

## 🚀 Deployment

### Production Deployment
1. **Environment Setup**: Configure production environment variables
2. **Database Migration**: Run production database migrations
3. **Build Process**: `npm run build`
4. **Start Production**: `npm start`

### Recommended Hosting
- **Vercel**: Optimized for Next.js applications
- **Railway**: Easy database and application hosting
- **AWS**: Enterprise-grade hosting with auto-scaling
- **Docker**: Containerized deployment option

## 🔧 Configuration

### System Settings
The system is highly configurable through the `ISettings` interface:

- **School Information**: Name, academic year, schedule type
- **Coverage Limits**: Maximum periods for substitutes and teachers
- **Department Matching**: Enable/disable department preferences
- **Workload Balancing**: Fair distribution algorithms
- **Approval Requirements**: Automatic vs. manual approval

### Schedule Types
- **A/B Days**: Daily alternating schedule
- **Weekly Alternating**: Weekly schedule rotation
- **Traditional**: Standard daily schedule
- **Custom**: Flexible schedule configuration

## 📞 Support & Documentation

### Getting Help
- **Documentation**: Comprehensive inline code documentation
- **TypeScript Types**: Self-documenting code structure
- **Sample Data**: Ready-to-use test scenarios
- **API Documentation**: RESTful API endpoints

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 🎯 Future Enhancements

### Planned Features
- **Mobile Application**: Native iOS/Android apps
- **Advanced Analytics**: Machine learning insights
- **Integration APIs**: Connect with other school systems
- **Multi-school Support**: District-wide deployment
- **Advanced Reporting**: Custom report builder
- **Notification System**: Email/SMS alerts

### Technology Roadmap
- **Real-time Updates**: WebSocket integration
- **Offline Support**: Progressive Web App features
- **Advanced AI**: Predictive coverage optimization
- **Blockchain**: Immutable audit trails
- **Microservices**: Service-oriented architecture

## 📄 License

This project is proprietary software developed by Significant Consulting. All rights reserved.

---

**PlanD Enterprise** - Because Chaos Isn't on the Schedule

*Developed with ❤️ by Significant Consulting* 