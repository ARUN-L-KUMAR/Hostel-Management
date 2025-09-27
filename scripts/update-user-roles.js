const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function updateRoles() {
  try {
    // Update ACCOUNTANT and VIEWER roles to MESS_MANAGER
    const result = await prisma.user.updateMany({
      where: {
        role: {
          in: ['ACCOUNTANT', 'VIEWER']
        }
      },
      data: {
        role: 'MESS_MANAGER'
      }
    });
    
    console.log(`Updated ${result.count} users from ACCOUNTANT/VIEWER to MESS_MANAGER`);
    
    // Note: We're keeping MESS_MANAGER as the "MANAGER" role in the UI for now
    // until we can properly update the database schema
    
  } catch (error) {
    console.error('Error updating roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateRoles();