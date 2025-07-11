# PlanD Coverage Assignment Algorithm

## Overview

The PlanD Coverage Assignment Algorithm is a sophisticated system that automatically assigns staff to cover teacher absences based on a strict priority order and multiple evaluation criteria.

## Algorithm Flow

### 1. Input: ABSENCE_PERIOD
Each absence period contains:
- `absent_teacher`: ID of the teacher who is absent
- `date`: Date of the absence
- `period_time`: Specific period needing coverage (e.g., "1st", "2nd", "3rd")
- `room`: Room where the class is held
- `subject`: Subject being taught

### 2. ROLE_PRIORITY Order
The algorithm searches for covering staff in this exact priority order:

1. **External Substitutes** - Professional substitute teachers
2. **Paraprofessionals** - School paraprofessionals
3. **Internal Teachers** - Other teachers in the school

*Note: Preferred substitutes are temporarily disabled due to schema issues but will be re-enabled once the Prisma client is regenerated.*

### 3. CANDIDATE_STAFF Evaluation Criteria

For each candidate staff member, the algorithm checks these criteria in order:

#### 3.1 AVAILABILITY Check
- Is the staff member available for the specific period?
- Are they not already teaching during this period?
- Are they not already assigned to cover another class?
- Are they not absent themselves?

#### 3.2 PERIOD MATCHING SCENARIOS
The algorithm handles three different scenarios for period availability:

**Scenario 1: Perfect Match (Abs Teacher Periods = Sub Teacher Periods)**
- Absent teacher needs: `['1st', '2nd', '3rd']`
- Substitute available: `['1st', '2nd', '3rd']`
- **Result**: All periods covered by one substitute

**Scenario 2: Substitute Has Extra Availability (Abs Teacher Periods < Sub Teacher Periods)**
- Absent teacher needs: `['1st', '2nd']`
- Substitute available: `['1st', '2nd', '3rd', '4th']`
- **Result**: All periods covered (substitute has extra availability)

**Scenario 3: Partial Coverage (Abs Teacher Periods > Sub Teacher Periods)**
- Absent teacher needs: `['1st', '2nd', '3rd', '4th']`
- Substitute available: `['1st', '2nd']`
- **Result**: Partial coverage - substitute covers some periods, others need additional coverage

#### 3.3 QUALIFICATION_MATCH Check
- **For Substitutes**: Do they have the required subject in their specialties?
- **For Internal Staff**: Do they teach in the same department as the absent teacher?

#### 3.4 DAILY_LOAD_LIMITS Check
- Is the staff member within their maximum daily teaching/coverage load?
- **Substitutes**: Limited to 6 periods per day (strict limit)
- **Internal Staff**: Default limit of 6 periods per day
- **Paraprofessionals**: Default limit of 6 periods per day

#### 3.5 SPECIAL_CONSTRAINTS Check
- Would this assignment exceed consecutive periods limit? (Max 4 consecutive)
- Are there any room conflicts?
- Are there any do-not-assign restrictions?

### 4. Assignment Process

1. **Iterate through ROLE_PRIORITY**: Start with highest priority role
2. **Get all candidates** for the current role
3. **Evaluate each candidate** against all criteria
4. **Assign the first candidate** that satisfies all criteria
5. **If no candidates found**, move to next priority level
6. **If all priorities exhausted**, mark period as UNCOVERED

### 5. Output: CoverageResult

Each period returns a result with:
- `period`: The period that was evaluated
- `assigned`: Name of assigned staff member (or null if uncovered)
- `assignedRole`: Role type of assigned staff
- `reason`: Explanation of why this assignment was made
- `candidateEvaluated`: Number of candidates evaluated before assignment

## Implementation Details

### Key Functions

#### `assignCoverageForAbsence(prisma, absence)`
Main algorithm function that processes an absence and returns coverage assignments.

#### `isAvailable(staffId, period)`
Checks if a staff member is available for a specific period.

#### `getCurrentLoad(staffId)`
Calculates current daily load for a staff member.

#### `hasQualificationMatch(candidate, subject)`
Evaluates if a candidate is qualified for the subject.

#### `checkSpecialConstraints(candidate, period)`
Checks all special constraints including load limits and consecutive periods.

#### `getConsecutivePeriods(staffId, dayOfWeek, newPeriod)`
Calculates how many consecutive periods a staff member would have if assigned.

### Database Integration

The algorithm integrates with the PlanD database schema:

- **Absence**: Contains absence details and periods needing coverage
- **Substitute**: Contains substitute information, specialties, and availability
- **User**: Contains teacher and paraprofessional information
- **MasterSchedule**: Contains teaching schedules to check availability
- **CoverageAssignment**: Stores the final assignments

### Error Handling

- **Weekend absences**: Automatically marked as uncovered
- **No periods specified**: Falls back to master schedule lookup
- **Database errors**: Gracefully handled with error logging
- **Missing data**: Uses sensible defaults (e.g., max load of 6 periods)

## Usage Example

```typescript
import { assignCoverageForAbsence } from '@/lib/coverage-algorithm';

// Process an absence
const results = await assignCoverageForAbsence(prisma, absence);

// Results will show for each period:
// - Who was assigned (or if uncovered)
// - What role they have
// - Why they were chosen
// - How many candidates were evaluated
```

## Testing

Run the test script to see the algorithm in action:

```bash
node test-coverage-algorithm.js
```

This will:
1. Find or create a test absence
2. Run the coverage algorithm
3. Display detailed results
4. Clean up test data

## Important Constraints

### Daily Load Limits
- **Substitutes**: Maximum 6 periods per day (strict enforcement)
- **Internal Teachers**: Maximum 6 periods per day (configurable)
- **Paraprofessionals**: Maximum 6 periods per day (configurable)

### Period Matching Scenarios
The algorithm handles three scenarios when matching substitute availability to absent teacher periods:

1. **Perfect Match**: Substitute can cover all needed periods
2. **Extra Availability**: Substitute has more availability than needed
3. **Partial Coverage**: Substitute can only cover some periods (others need additional coverage)

## Future Enhancements

1. **Preferred Substitutes**: Re-enable preferred substitute functionality
2. **Advanced Constraints**: Add more sophisticated constraint checking
3. **Fairness Algorithms**: Implement load balancing across staff
4. **Room Conflicts**: Add room availability checking
5. **Do-Not-Assign Lists**: Implement staff exclusion rules
6. **Opt-In Preferences**: Allow teachers to opt-in for coverage
7. **Department Preferences**: Prioritize same-department assignments

## Performance Considerations

- **Database Queries**: Optimized to minimize database calls
- **Caching**: Master schedule and absence data cached for the day
- **Batch Processing**: Can process multiple absences efficiently
- **Early Termination**: Stops searching once a suitable candidate is found

The algorithm is designed to be both efficient and fair, ensuring that coverage assignments are made according to established priorities while respecting all constraints and limitations. 