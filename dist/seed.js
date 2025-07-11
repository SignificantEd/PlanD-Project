"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var faker_1 = require("@faker-js/faker");
var prisma = new client_1.PrismaClient();
// Department data with realistic teacher names
var departments = [
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
var periods = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
var subjects = ['Algebra I', 'Geometry', 'Algebra II', 'Calculus', 'Biology', 'Chemistry', 'Physics', 'English 9', 'English 10', 'English 11', 'English 12', 'World History', 'US History', 'Government', 'Spanish I', 'Spanish II', 'French I', 'French II', 'German I', 'German II', 'Physical Education', 'Art I', 'Art II', 'Band', 'Choir', 'Orchestra'];
var rooms = ['101', '102', '103', '104', '105', '106', '107', '108', '201', '202', '203', '204', '205', '206', '207', '208', '301', '302', '303', '304', '305', '306', '307', '308', 'Gym', 'Art Room', 'Band Room', 'Choir Room', 'Computer Lab', 'Science Lab'];
function generateRandomName() {
    return faker_1.faker.name.firstName() + ' ' + faker_1.faker.name.lastName();
}
// Set the total number of teachers to 100
var TARGET_TEACHERS = 100;
var allTeacherNames = [];
departments.forEach(function (dept) {
    dept.teachers.forEach(function (name) { return allTeacherNames.push({ name: name, department: dept.name }); });
});
// If too many, trim; if too few, add random, staggering free periods for new teachers
var originalCount = allTeacherNames.length;
if (allTeacherNames.length > TARGET_TEACHERS) {
    allTeacherNames = allTeacherNames.slice(0, TARGET_TEACHERS);
}
else if (allTeacherNames.length < TARGET_TEACHERS) {
    var deptIndex = 0;
    var staggerIndex = 0;
    while (allTeacherNames.length < TARGET_TEACHERS) {
        var dept = departments[deptIndex % departments.length];
        // Attach a staggerIndex to each new teacher for later use
        allTeacherNames.push({ name: generateRandomName() + " (T".concat(allTeacherNames.length + 1, ")"), department: dept.name, staggerIndex: staggerIndex });
        deptIndex++;
        staggerIndex++;
    }
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var schoolId, school, teacherCount, createdTeachers, _i, allTeacherNames_1, t, email, teacher, scheduleCount, totalFreePeriods, _a, createdTeachers_1, teacher, teacherPeriods, freePeriodIndexes, numFree, start, j, idx, i, period, subject, room, substituteSubjects, substituteNames, substituteCount, _loop_1, i;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    console.log('🌱 Starting database seeding...');
                    schoolId = 'sample-school-1';
                    return [4 /*yield*/, prisma.school.upsert({
                            where: { id: schoolId },
                            update: {},
                            create: {
                                id: schoolId,
                                name: 'Sample High School',
                                location: '123 Main St',
                                type: 'public',
                            },
                        })];
                case 1:
                    school = _b.sent();
                    console.log("\u2705 School created: ".concat(school.name));
                    teacherCount = 0;
                    createdTeachers = [];
                    _i = 0, allTeacherNames_1 = allTeacherNames;
                    _b.label = 2;
                case 2:
                    if (!(_i < allTeacherNames_1.length)) return [3 /*break*/, 5];
                    t = allTeacherNames_1[_i];
                    email = "".concat(t.name.toLowerCase().replace(/\s+/g, '.'), "@samplehigh.edu");
                    return [4 /*yield*/, prisma.user.upsert({
                            where: { email: email },
                            update: {},
                            create: {
                                email: email,
                                password: '$2a$10$samplehashedpassword',
                                name: t.name,
                                role: t.department === 'Paraprofessional' ? 'paraprofessional' : 'teacher',
                                schoolId: school.id,
                                department: t.department,
                            },
                        })];
                case 3:
                    teacher = _b.sent();
                    createdTeachers.push(__assign(__assign({}, teacher), { staggerIndex: t.staggerIndex }));
                    teacherCount++;
                    console.log("\u2705 Created teacher: ".concat(t.name, " (").concat(t.department, ")"));
                    _b.label = 4;
                case 4:
                    _i++;
                    return [3 /*break*/, 2];
                case 5:
                    console.log("\n\uD83D\uDCDA Creating master schedules for ".concat(teacherCount, " teachers..."));
                    scheduleCount = 0;
                    totalFreePeriods = 0;
                    _a = 0, createdTeachers_1 = createdTeachers;
                    _b.label = 6;
                case 6:
                    if (!(_a < createdTeachers_1.length)) return [3 /*break*/, 13];
                    teacher = createdTeachers_1[_a];
                    teacherPeriods = periods.slice();
                    freePeriodIndexes = [];
                    numFree = Math.floor(Math.random() * 2) + 2;
                    if (teacher.staggerIndex !== undefined) {
                        // Stagger: cycle through periods for each new teacher
                        freePeriodIndexes = [];
                        start = teacher.staggerIndex % periods.length;
                        for (j = 0; j < numFree; j++) {
                            freePeriodIndexes.push((start + j) % periods.length);
                        }
                    }
                    else {
                        // Original logic for original teachers
                        freePeriodIndexes = [];
                        while (freePeriodIndexes.length < numFree) {
                            idx = Math.floor(Math.random() * teacherPeriods.length);
                            if (!freePeriodIndexes.includes(idx))
                                freePeriodIndexes.push(idx);
                        }
                    }
                    i = 0;
                    _b.label = 7;
                case 7:
                    if (!(i < teacherPeriods.length)) return [3 /*break*/, 12];
                    period = teacherPeriods[i];
                    if (!freePeriodIndexes.includes(i)) return [3 /*break*/, 9];
                    return [4 /*yield*/, prisma.masterSchedule.create({
                            data: {
                                teacherId: teacher.id,
                                schoolId: school.id,
                                period: period,
                                subject: 'Free Period',
                                room: 'N/A',
                                dayOfWeek: null,
                                isTeaching: false,
                            },
                        })];
                case 8:
                    _b.sent();
                    scheduleCount++;
                    totalFreePeriods++;
                    return [3 /*break*/, 11];
                case 9:
                    subject = subjects[Math.floor(Math.random() * subjects.length)];
                    room = rooms[Math.floor(Math.random() * rooms.length)];
                    return [4 /*yield*/, prisma.masterSchedule.create({
                            data: {
                                teacherId: teacher.id,
                                schoolId: school.id,
                                period: period,
                                subject: subject,
                                room: room,
                                dayOfWeek: null,
                                isTeaching: true,
                            },
                        })];
                case 10:
                    _b.sent();
                    scheduleCount++;
                    _b.label = 11;
                case 11:
                    i++;
                    return [3 /*break*/, 7];
                case 12:
                    _a++;
                    return [3 /*break*/, 6];
                case 13:
                    console.log("\u2705 Created ".concat(scheduleCount, " master schedule entries"));
                    console.log("\uD83C\uDFB2 Total free periods assigned: ".concat(totalFreePeriods));
                    // Create substitute teachers
                    console.log("\n\uD83D\uDC68\u200D\uD83C\uDFEB Creating substitute teachers...");
                    substituteSubjects = [
                        'Math', 'Science', 'English', 'History', 'Foreign Languages', 'Physical Education', 'Arts', 'Music'
                    ];
                    substituteNames = [
                        'Alex Carter', 'Morgan Lee', 'Taylor Brooks', 'Jordan Smith', 'Casey Kim',
                        'Riley Morgan', 'Jamie Patel', 'Avery Nguyen', 'Peyton Rivera', 'Drew Parker',
                        'Skyler Evans', 'Reese Cooper', 'Quinn Bailey', 'Harper Reed', 'Rowan Bell',
                        'Finley Hayes', 'Dakota James', 'Emerson Clark', 'Sawyer Lewis', 'Blake Walker'
                    ];
                    substituteCount = 0;
                    _loop_1 = function (i) {
                        var name_1, email, specialties, days, periods_1, availability;
                        return __generator(this, function (_c) {
                            switch (_c.label) {
                                case 0:
                                    name_1 = substituteNames[i];
                                    email = "".concat(name_1.toLowerCase().replace(/\s+/g, '.'), "@substitute.edu");
                                    specialties = [
                                        substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)],
                                        substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)]
                                    ];
                                    if (Math.random() > 0.5)
                                        specialties.push(substituteSubjects[Math.floor(Math.random() * substituteSubjects.length)]);
                                    days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
                                    periods_1 = ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th'];
                                    availability = {};
                                    days.forEach(function (day) {
                                        // Each sub is available 2-5 periods per day
                                        var numPeriods = Math.floor(Math.random() * 4) + 2;
                                        availability[day] = periods_1.sort(function () { return 0.5 - Math.random(); }).slice(0, numPeriods);
                                    });
                                    return [4 /*yield*/, prisma.substitute.upsert({
                                            where: { email: email },
                                            update: {},
                                            create: {
                                                name: name_1,
                                                email: email,
                                                subjectSpecialties: specialties,
                                                availability: availability,
                                            },
                                        })];
                                case 1:
                                    _c.sent();
                                    substituteCount++;
                                    console.log("\u2705 Created substitute: ".concat(name_1, " (").concat(specialties.join(', '), ")"));
                                    return [2 /*return*/];
                            }
                        });
                    };
                    i = 0;
                    _b.label = 14;
                case 14:
                    if (!(i < 18)) return [3 /*break*/, 17];
                    return [5 /*yield**/, _loop_1(i)];
                case 15:
                    _b.sent();
                    _b.label = 16;
                case 16:
                    i++;
                    return [3 /*break*/, 14];
                case 17:
                    console.log("\u2705 Created ".concat(substituteCount, " substitute teachers"));
                    console.log("\n\uD83C\uDF89 Database seeding complete!");
                    console.log("\uD83D\uDCCA Summary:");
                    console.log("   - 1 School");
                    console.log("   - ".concat(teacherCount, " Teachers across ").concat(departments.length, " departments"));
                    console.log("   - ".concat(scheduleCount, " Master schedule entries"));
                    console.log("   - ".concat(substituteCount, " Substitute teachers"));
                    return [2 /*return*/];
            }
        });
    });
}
main()
    .catch(function (e) {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
})
    .finally(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, prisma.$disconnect()];
            case 1:
                _a.sent();
                return [2 /*return*/];
        }
    });
}); });
