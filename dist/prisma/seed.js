import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
const prisma = new PrismaClient();
// Department data with realistic teacher names
const departments = [
    {
        name: 'Mathematics',
        teachers: [
            'Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Thompson', 'Lisa Wang',
            'James Wilson', 'Maria Garcia', 'Robert Lee', 'Jennifer Brown', 'Christopher Davis'
        ]
    },
    {
        name: 'Science',
        teachers: [
            'Dr. Amanda Foster', 'Dr. Kevin Patel', 'Dr. Rachel Green', 'Dr. Thomas Anderson', 'Dr. Nicole White',
            'Dr. Steven Taylor', 'Dr. Jessica Martinez', 'Dr. Daniel Clark', 'Dr. Michelle Lewis', 'Dr. Andrew Hall'
        ]
    },
    {
        name: 'English',
        teachers: [
            'Professor Katherine Moore', 'Professor Ryan Jackson', 'Professor Samantha Wright', 'Professor Brian Scott',
            'Professor Ashley Adams', 'Professor Matthew King', 'Professor Lauren Baker', 'Professor Jonathan Carter',
            'Professor Stephanie Evans', 'Professor Joshua Mitchell'
        ]
    },
    {
        name: 'History',
        teachers: [
            'Dr. Elizabeth Turner', 'Dr. Mark Phillips', 'Dr. Rebecca Campbell', 'Dr. Gregory Parker',
            'Dr. Victoria Edwards', 'Dr. Nathan Collins', 'Dr. Danielle Stewart', 'Dr. Timothy Morris',
            'Dr. Rachel Rogers', 'Dr. Benjamin Reed'
        ]
    },
    {
        name: 'Foreign Languages',
        teachers: [
            'Señora Maria Lopez', 'Monsieur Pierre Dubois', 'Frau Anna Schmidt', 'Signora Sofia Rossi',
            'Senhor Carlos Silva', 'Herr Hans Mueller', 'Madame Claire Moreau', 'Signor Marco Bianchi',
            'Señorita Elena Torres', 'Mademoiselle Julie Rousseau'
        ]
    },
    {
        name: 'Physical Education',
        teachers: [
            'Coach Mike Johnson', 'Coach Sarah Williams', 'Coach Tom Davis', 'Coach Lisa Anderson',
            'Coach Chris Wilson', 'Coach Amy Thompson', 'Coach Steve Brown', 'Coach Kelly Miller'
        ]
    },
    {
        name: 'Arts',
        teachers: [
            'Ms. Olivia Taylor', 'Mr. Ethan Martinez', 'Ms. Sophia Garcia', 'Mr. Noah Rodriguez',
            'Ms. Isabella Lopez', 'Mr. Lucas Hernandez', 'Ms. Mia Gonzalez', 'Mr. Aiden Perez'
        ]
    },
    {
        name: 'Music',
        teachers: [
            'Maestro Antonio Rossi', 'Maestra Elena Santos', 'Maestro Carlos Mendez', 'Maestra Sofia Vega',
            'Maestro Diego Morales', 'Maestra Carmen Ruiz', 'Maestro Javier Torres', 'Maestra Ana Flores'
        ]
    },
    {
        name: 'Paraprofessional',
        teachers: [
            'Ms. Jennifer Adams', 'Mr. Robert Wilson', 'Ms. Lisa Thompson', 'Mr. David Brown',
            'Ms. Maria Garcia', 'Mr. James Miller', 'Ms. Sarah Davis', 'Mr. Michael Johnson'
        ]
    }
];
// Periods and rooms for master schedule
const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
const subjects = ['Algebra I', 'Geometry', 'Algebra II', 'Calculus', 'Biology', 'Chemistry', 'Physics', 'English 9', 'English 10', 'English 11', 'English 12', 'World History', 'US History', 'Government', 'Spanish I', 'Spanish II', 'French I', 'French II', 'German I', 'German II', 'Physical Education', 'Art I', 'Art II', 'Band', 'Choir', 'Orchestra'];
const rooms = ['101', '102', '103', '104', '105', '106', '107', '108', '201', '202', '203', '204', '205', '206', '207', '208', '301', '302', '303', '304', '305', '306', '307', '308', 'Gym', 'Art Room', 'Band Room', 'Choir Room', 'Computer Lab', 'Science Lab'];
function generateRandomName() {
    return faker.name.firstName() + ' ' + faker.name.lastName();
}
// Set the total number of teachers to 100
const TARGET_TEACHERS = 100;
let allTeacherNames = [];
departments.forEach(dept => {
    dept.teachers.forEach(name => allTeacherNames.push({ name, department: dept.name }));
});
// If too many, trim; if too few, add random, staggering free periods for new teachers
const originalCount = allTeacherNames.length;
if (allTeacherNames.length > TARGET_TEACHERS) {
    allTeacherNames = allTeacherNames.slice(0, TARGET_TEACHERS);
}
else if (allTeacherNames.length < TARGET_TEACHERS) {
    let deptIndex = 0;
    let staggerIndex = 0;
    while (allTeacherNames.length < TARGET_TEACHERS) {
        const dept = departments[deptIndex % departments.length];
        // Attach a staggerIndex to each new teacher for later use
        allTeacherNames.push({ name: generateRandomName() + ` (T${allTeacherNames.length + 1})`, department: dept.name, staggerIndex });
        deptIndex++;
        staggerIndex++;
    }
}
async function main() {
    console.log('🌱 Starting database seeding...');
    // Use existing school or create new one
    const schoolId = 'sample-school-1';
    const school = await prisma.school.upsert({
        where: { id: schoolId },
        update: {},
        create: {
            id: schoolId,
            name: 'Sample High School',
            location: '123 Main St',
            type: 'public',
        },
    });
    console.log(`✅ School created: ${school.name}`);
    // Create teachers for each department
    let teacherCount = 0;
    const createdTeachers = [];
    for (const t of allTeacherNames) {
        const email = `${t.name.toLowerCase().replace(/\s+/g, '.')}@samplehigh.edu`;
        const teacher = await prisma.user.upsert({
            where: { email },
            update: {},
            create: {
                email,
                password: '$2a$10$samplehashedpassword',
                name: t.name,
                role: t.department === 'Paraprofessional' ? 'paraprofessional' : 'teacher',
                schoolId: school.id,
                department: t.department,
            },
        });
        createdTeachers.push({ ...teacher, staggerIndex: t.staggerIndex });
        teacherCount++;
        console.log(`✅ Created teacher: ${t.name} (${t.department})`);
    }
    console.log(`\n📚 Creating master schedules for ${teacherCount} teachers...`);
    // Create master schedules for each teacher
    let scheduleCount = 0;
    let totalFreePeriods = 0;
    for (const teacher of createdTeachers) {
        const teacherPeriods = periods.slice();
        let freePeriodIndexes = [];
        let numFree = Math.floor(Math.random() * 2) + 2; // 2 or 3
        if (teacher.staggerIndex !== undefined) {
            // Stagger: cycle through periods for each new teacher
            freePeriodIndexes = [];
            let start = teacher.staggerIndex % periods.length;
            for (let j = 0; j < numFree; j++) {
                freePeriodIndexes.push((start + j) % periods.length);
            }
        }
        else {
            // Original logic for original teachers
            freePeriodIndexes = [];
            while (freePeriodIndexes.length < numFree) {
                const idx = Math.floor(Math.random() * teacherPeriods.length);
                if (!freePeriodIndexes.includes(idx))
                    freePeriodIndexes.push(idx);
            }
        }
        for (let i = 0; i < teacherPeriods.length; i++) {
            const period = teacherPeriods[i];
            if (freePeriodIndexes.includes(i)) {
                await prisma.masterSchedule.create({
                    data: {
                        teacherId: teacher.id,
                        schoolId: school.id,
                        period,
                        subject: 'Free Period',
                        room: 'N/A',
                        dayOfWeek: null,
                        isTeaching: false,
                    },
                });
                scheduleCount++;
                totalFreePeriods++;
            }
            else {
                const subject = subjects[Math.floor(Math.random() * subjects.length)];
                const room = rooms[Math.floor(Math.random() * rooms.length)];
                await prisma.masterSchedule.create({
                    data: {
                        teacherId: teacher.id,
                        schoolId: school.id,
                        period,
                        subject,
                        room,
                        dayOfWeek: null,
                        isTeaching: true,
                    },
                });
                scheduleCount++;
            }
        }
    }
    console.log(`✅ Created ${scheduleCount} master schedule entries`);
    console.log(`🎲 Total free periods assigned: ${totalFreePeriods}`);
    // Create substitute teachers
    console.log(`\n👨‍🏫 Creating substitute teachers...`);
    const substituteSubjects = [
        'Math', 'Science', 'English', 'History', 'Foreign Languages', 'Physical Education', 'Arts', 'Music'
    ];
    const substituteNames = [
        'Alex Carter', 'Morgan Lee', 'Taylor Brooks', 'Jordan Smith', 'Casey Kim',
        'Riley Morgan', 'Jamie Patel', 'Avery Nguyen', 'Peyton Rivera', 'Drew Parker',
        'Skyler Evans', 'Reese Cooper', 'Quinn Bailey', 'Harper Reed', 'Rowan Bell',
        'Finley Hayes', 'Dakota James', 'Emerson Clark', 'Sawyer Lewis', 'Blake Walker'
    ];
    let substituteCount = 0;
    for (let i = 0; i < 18; i++) {
        const name = substituteNames[i];
        const email = `${name.toLowerCase().replace(/\s+/g, '.')}@substitute.edu`;
        // Each sub gets 1-3 specialties
        const specialties = [
            substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)],
            substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)]
        ];
        if (Math.random() > 0.5)
            specialties.push(substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)]);
        // Random availability: Mon-Fri, 1st-8th periods
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        const periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
        const availability = {};
        days.forEach(day => {
            // Each sub is available 2-5 periods per day
            const numPeriods = Math.floor(Math.random() * 4) + 2;
            availability[day] = periods.sort(() => 0.5 - Math.random()).slice(0, numPeriods);
        });
        await prisma.substitute.upsert({
            where: { email },
            update: {},
            create: {
                name,
                email,
                subjectSpecialties: specialties,
                availability,
            },
        });
        substituteCount++;
        console.log(`✅ Created substitute: ${name} (${specialties.join(', ')})`);
    }
    console.log(`✅ Created ${substituteCount} substitute teachers`);
    console.log(`\n🎉 Database seeding complete!`);
    console.log(`📊 Summary:`);
    console.log(`   - 1 School`);
    console.log(`   - ${teacherCount} Teachers across ${departments.length} departments`);
    console.log(`   - ${scheduleCount} Master schedule entries`);
    console.log(`   - ${substituteCount} Substitute teachers`);
}
main()
    .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
