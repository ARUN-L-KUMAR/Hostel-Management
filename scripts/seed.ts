import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seeding...')

  // Clear existing data
  console.log('🗑️ Clearing existing data...')
  await prisma.attendance.deleteMany()
  await prisma.studentBill.deleteMany()
  await prisma.inmateMonthlySummary.deleteMany()
  await prisma.student.deleteMany()
  await prisma.provisionUsage.deleteMany()
  await prisma.provisionItem.deleteMany()

  // Ensure hostels exist
  console.log('🏢 Ensuring hostels exist...')
  await prisma.hostel.upsert({
    where: { id: 'hostel_boys' },
    update: {},
    create: {
      id: 'hostel_boys',
      name: 'Boys',
      description: 'Boys Hostel'
    }
  })

  await prisma.hostel.upsert({
    where: { id: 'hostel_girls' },
    update: {},
    create: {
      id: 'hostel_girls',
      name: 'Girls',
      description: 'Girls Hostel'
    }
  })

  // Create students
  console.log('👥 Creating students...')
  
  // Boys Hostel Students (40 students total)
  const boysStudents = [
    // Year 2021 (12 students, 4 mando)
    { id: 'std_b21_001', name: 'Arjun Kumar Singh', rollNo: 'B21001', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-15') },
    { id: 'std_b21_002', name: 'Rahul Sharma', rollNo: 'B21002', year: 2021, isMando: true, company: 'TechCorp Solutions', hostelId: 'hostel_boys', joinDate: new Date('2021-07-15') },
    { id: 'std_b21_003', name: 'Vikram Singh Rathore', rollNo: 'B21003', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-20') },
    { id: 'std_b21_004', name: 'Amit Patel', rollNo: 'B21004', year: 2021, isMando: true, company: 'Infosys Limited', hostelId: 'hostel_boys', joinDate: new Date('2021-07-18') },
    { id: 'std_b21_005', name: 'Suresh Reddy', rollNo: 'B21005', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-22') },
    { id: 'std_b21_006', name: 'Kiran Joshi', rollNo: 'B21006', year: 2021, isMando: true, company: 'Wipro Technologies', hostelId: 'hostel_boys', joinDate: new Date('2021-07-25') },
    { id: 'std_b21_007', name: 'Deepak Gupta', rollNo: 'B21007', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-19') },
    { id: 'std_b21_008', name: 'Rajesh Kumar', rollNo: 'B21008', year: 2021, isMando: true, company: 'Tata Consultancy Services', hostelId: 'hostel_boys', joinDate: new Date('2021-07-16') },
    { id: 'std_b21_009', name: 'Manoj Verma', rollNo: 'B21009', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-21') },
    { id: 'std_b21_010', name: 'Sanjay Yadav', rollNo: 'B21010', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-23') },
    { id: 'std_b21_011', name: 'Ravi Agarwal', rollNo: 'B21011', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-17') },
    { id: 'std_b21_012', name: 'Ashok Mishra', rollNo: 'B21012', year: 2021, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2021-07-24') },

    // Year 2022 (14 students, 5 mando)
    { id: 'std_b22_001', name: 'Naveen Kumar', rollNo: 'B22001', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-15') },
    { id: 'std_b22_002', name: 'Pradeep Singh', rollNo: 'B22002', year: 2022, isMando: true, company: 'Microsoft Corporation', hostelId: 'hostel_boys', joinDate: new Date('2022-07-18') },
    { id: 'std_b22_003', name: 'Santosh Jain', rollNo: 'B22003', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-20') },
    { id: 'std_b22_004', name: 'Mukesh Sharma', rollNo: 'B22004', year: 2022, isMando: true, company: 'Google India', hostelId: 'hostel_boys', joinDate: new Date('2022-07-16') },
    { id: 'std_b22_005', name: 'Dinesh Patel', rollNo: 'B22005', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-22') },
    { id: 'std_b22_006', name: 'Ramesh Gupta', rollNo: 'B22006', year: 2022, isMando: true, company: 'Amazon Development Centre', hostelId: 'hostel_boys', joinDate: new Date('2022-07-19') },
    { id: 'std_b22_007', name: 'Sunil Kumar', rollNo: 'B22007', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-25') },
    { id: 'std_b22_008', name: 'Ajay Singh', rollNo: 'B22008', year: 2022, isMando: true, company: 'IBM India', hostelId: 'hostel_boys', joinDate: new Date('2022-07-17') },
    { id: 'std_b22_009', name: 'Vijay Sharma', rollNo: 'B22009', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-21') },
    { id: 'std_b22_010', name: 'Anil Patel', rollNo: 'B22010', year: 2022, isMando: true, company: 'Accenture Solutions', hostelId: 'hostel_boys', joinDate: new Date('2022-07-23') },
    { id: 'std_b22_011', name: 'Rohit Gupta', rollNo: 'B22011', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-24') },
    { id: 'std_b22_012', name: 'Sachin Kumar', rollNo: 'B22012', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-26') },
    { id: 'std_b22_013', name: 'Nitin Singh', rollNo: 'B22013', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-18') },
    { id: 'std_b22_014', name: 'Gaurav Sharma', rollNo: 'B22014', year: 2022, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2022-07-20') },

    // Year 2023 (14 students, 3 mando)
    { id: 'std_b23_001', name: 'Harsh Patel', rollNo: 'B23001', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-15') },
    { id: 'std_b23_002', name: 'Yash Gupta', rollNo: 'B23002', year: 2023, isMando: true, company: 'Oracle Corporation', hostelId: 'hostel_boys', joinDate: new Date('2023-07-18') },
    { id: 'std_b23_003', name: 'Akash Kumar', rollNo: 'B23003', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-20') },
    { id: 'std_b23_004', name: 'Varun Singh', rollNo: 'B23004', year: 2023, isMando: true, company: 'Capgemini India', hostelId: 'hostel_boys', joinDate: new Date('2023-07-16') },
    { id: 'std_b23_005', name: 'Karan Joshi', rollNo: 'B23005', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-22') },
    { id: 'std_b23_006', name: 'Aryan Agarwal', rollNo: 'B23006', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-19') },
    { id: 'std_b23_007', name: 'Rohan Verma', rollNo: 'B23007', year: 2023, isMando: true, company: 'Cognizant Technology Solutions', hostelId: 'hostel_boys', joinDate: new Date('2023-07-25') },
    { id: 'std_b23_008', name: 'Ishaan Yadav', rollNo: 'B23008', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-17') },
    { id: 'std_b23_009', name: 'Kartik Mishra', rollNo: 'B23009', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-21') },
    { id: 'std_b23_010', name: 'Shubham Jain', rollNo: 'B23010', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-23') },
    { id: 'std_b23_011', name: 'Tushar Sharma', rollNo: 'B23011', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-24') },
    { id: 'std_b23_012', name: 'Ankit Patel', rollNo: 'B23012', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-26') },
    { id: 'std_b23_013', name: 'Rishabh Gupta', rollNo: 'B23013', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-18') },
    { id: 'std_b23_014', name: 'Ayush Kumar', rollNo: 'B23014', year: 2023, isMando: false, company: null, hostelId: 'hostel_boys', joinDate: new Date('2023-07-20') }
  ]

  // Girls Hostel Students (25 students total)
  const girlsStudents = [
    // Year 2021 (8 students, 3 mando)
    { id: 'std_g21_001', name: 'Priya Sharma', rollNo: 'G21001', year: 2021, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2021-07-15') },
    { id: 'std_g21_002', name: 'Sneha Patel', rollNo: 'G21002', year: 2021, isMando: true, company: 'TechCorp Solutions', hostelId: 'hostel_girls', joinDate: new Date('2021-07-18') },
    { id: 'std_g21_003', name: 'Pooja Singh', rollNo: 'G21003', year: 2021, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2021-07-20') },
    { id: 'std_g21_004', name: 'Kavya Reddy', rollNo: 'G21004', year: 2021, isMando: true, company: 'Infosys Limited', hostelId: 'hostel_girls', joinDate: new Date('2021-07-16') },
    { id: 'std_g21_005', name: 'Anita Kumar', rollNo: 'G21005', year: 2021, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2021-07-22') },
    { id: 'std_g21_006', name: 'Ritu Gupta', rollNo: 'G21006', year: 2021, isMando: true, company: 'Wipro Technologies', hostelId: 'hostel_girls', joinDate: new Date('2021-07-19') },
    { id: 'std_g21_007', name: 'Sunita Joshi', rollNo: 'G21007', year: 2021, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2021-07-25') },
    { id: 'std_g21_008', name: 'Meera Agarwal', rollNo: 'G21008', year: 2021, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2021-07-17') },

    // Year 2022 (9 students, 3 mando)
    { id: 'std_g22_001', name: 'Deepika Verma', rollNo: 'G22001', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-15') },
    { id: 'std_g22_002', name: 'Neha Yadav', rollNo: 'G22002', year: 2022, isMando: true, company: 'Microsoft Corporation', hostelId: 'hostel_girls', joinDate: new Date('2022-07-18') },
    { id: 'std_g22_003', name: 'Swati Mishra', rollNo: 'G22003', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-20') },
    { id: 'std_g22_004', name: 'Rekha Jain', rollNo: 'G22004', year: 2022, isMando: true, company: 'Google India', hostelId: 'hostel_girls', joinDate: new Date('2022-07-16') },
    { id: 'std_g22_005', name: 'Geeta Sharma', rollNo: 'G22005', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-22') },
    { id: 'std_g22_006', name: 'Sita Patel', rollNo: 'G22006', year: 2022, isMando: true, company: 'Amazon Development Centre', hostelId: 'hostel_girls', joinDate: new Date('2022-07-19') },
    { id: 'std_g22_007', name: 'Radha Singh', rollNo: 'G22007', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-25') },
    { id: 'std_g22_008', name: 'Lakshmi Kumar', rollNo: 'G22008', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-17') },
    { id: 'std_g22_009', name: 'Saraswati Gupta', rollNo: 'G22009', year: 2022, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2022-07-21') },

    // Year 2023 (8 students, 2 mando)
    { id: 'std_g23_001', name: 'Durga Reddy', rollNo: 'G23001', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-15') },
    { id: 'std_g23_002', name: 'Kali Joshi', rollNo: 'G23002', year: 2023, isMando: true, company: 'IBM India', hostelId: 'hostel_girls', joinDate: new Date('2023-07-18') },
    { id: 'std_g23_003', name: 'Parvati Agarwal', rollNo: 'G23003', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-20') },
    { id: 'std_g23_004', name: 'Asha Verma', rollNo: 'G23004', year: 2023, isMando: true, company: 'Accenture Solutions', hostelId: 'hostel_girls', joinDate: new Date('2023-07-16') },
    { id: 'std_g23_005', name: 'Usha Yadav', rollNo: 'G23005', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-22') },
    { id: 'std_g23_006', name: 'Lata Mishra', rollNo: 'G23006', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-19') },
    { id: 'std_g23_007', name: 'Nisha Jain', rollNo: 'G23007', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-25') },
    { id: 'std_g23_008', name: 'Shanti Sharma', rollNo: 'G23008', year: 2023, isMando: false, company: null, hostelId: 'hostel_girls', joinDate: new Date('2023-07-17') }
  ]

  // Create all students
  const allStudents = [...boysStudents, ...girlsStudents]
  for (const student of allStudents) {
    await prisma.student.create({
      data: student
    })
  }

  // Create provision items
  console.log('🛒 Creating provision items...')
  const provisionItems = [
    { id: 'prov_001', name: 'Rice', unit: 'kg', unitCost: 45.00, unitMeasure: '1 kg' },
    { id: 'prov_002', name: 'Dal (Toor)', unit: 'kg', unitCost: 120.00, unitMeasure: '1 kg' },
    { id: 'prov_003', name: 'Wheat Flour', unit: 'kg', unitCost: 35.00, unitMeasure: '1 kg' },
    { id: 'prov_004', name: 'Cooking Oil', unit: 'ltr', unitCost: 180.00, unitMeasure: '1 ltr' },
    { id: 'prov_005', name: 'Onions', unit: 'kg', unitCost: 30.00, unitMeasure: '1 kg' },
    { id: 'prov_006', name: 'Potatoes', unit: 'kg', unitCost: 25.00, unitMeasure: '1 kg' },
    { id: 'prov_007', name: 'Tomatoes', unit: 'kg', unitCost: 40.00, unitMeasure: '1 kg' },
    { id: 'prov_008', name: 'Milk', unit: 'ltr', unitCost: 55.00, unitMeasure: '1 ltr' },
    { id: 'prov_009', name: 'Tea', unit: 'kg', unitCost: 400.00, unitMeasure: '1 kg' },
    { id: 'prov_010', name: 'Sugar', unit: 'kg', unitCost: 50.00, unitMeasure: '1 kg' },
    { id: 'prov_011', name: 'Salt', unit: 'kg', unitCost: 20.00, unitMeasure: '1 kg' },
    { id: 'prov_012', name: 'Spices Mix', unit: 'kg', unitCost: 300.00, unitMeasure: '1 kg' },
    { id: 'prov_013', name: 'Chicken', unit: 'kg', unitCost: 220.00, unitMeasure: '1 kg' },
    { id: 'prov_014', name: 'Fish', unit: 'kg', unitCost: 180.00, unitMeasure: '1 kg' },
    { id: 'prov_015', name: 'Vegetables (Mixed)', unit: 'kg', unitCost: 35.00, unitMeasure: '1 kg' }
  ]

  for (const item of provisionItems) {
    await prisma.provisionItem.create({
      data: item
    })
  }

  console.log('✅ Database seeding completed successfully!')
  console.log(`📊 Created ${allStudents.length} students`)
  console.log(`📦 Created ${provisionItems.length} provision items`)
  console.log(`🏠 Boys hostel: ${boysStudents.length} students`)
  console.log(`🏠 Girls hostel: ${girlsStudents.length} students`)

  const mandoCount = allStudents.filter(s => s.isMando).length
  console.log(`💼 Mando students: ${mandoCount}`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })