// Quick script to add department data to some students for testing
// This will add random departments to the first 50 students

const departments = ['CSE', 'ECE', 'EEE', 'MECH', 'CSE(CS)', 'CSE(TI)'];

async function updateStudentDepartments() {
  try {
    // Get first 50 students
    const response = await fetch('http://localhost:3000/api/students?isMando=false');
    const students = await response.json();
    
    console.log(`Found ${students.length} students to update`);
    
    // Update first 50 students with random departments
    const studentsToUpdate = students.slice(0, 50);
    
    for (let i = 0; i < studentsToUpdate.length; i++) {
      const student = studentsToUpdate[i];
      const randomDept = departments[i % departments.length]; // Cycle through departments
      
      console.log(`Updating student ${student.name} (${student.rollNo}) with dept: ${randomDept}`);
      
      // Update student via API
      const updateResponse = await fetch(`http://localhost:3000/api/students/${student.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dept: randomDept
        }),
      });
      
      if (updateResponse.ok) {
        console.log(`✓ Updated ${student.name} with ${randomDept}`);
      } else {
        console.log(`✗ Failed to update ${student.name}`);
      }
    }
    
    console.log('Department update completed!');
  } catch (error) {
    console.error('Error updating departments:', error);
  }
}

// Run the update
updateStudentDepartments();