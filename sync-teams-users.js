const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

// Use production database URL
const DATABASE_URL = "postgresql://neondb_owner:npg_j53YgzQflxbr@ep-old-breeze-adrvkyiq-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
});

// Team definitions based on departments and the teams shown in the interface
const TEAMS_CONFIG = [
  {
    name: "Batarya Geliştirme Ekibi",
    description: "Batarya teknolojileri geliştirme takımı",
    departments: ["Mühendis"], // Users with "Mühendis" department will be in this team
    positions: ["Batarya Mühendisi", "Elektrik Mühendisi", "Yazılım Mühendisi"]
  },
  {
    name: "Batarya Paketleme Ekibi", 
    description: "Batarya paketleme ve montaj takımı",
    departments: ["Teknisyen"],
    positions: ["Batarya Teknisyeni", "Paketleme Uzmanı", "Montaj Teknisyeni"]
  },
  {
    name: "Yönetim Ekibi",
    description: "Proje yönetimi ve koordinasyon takımı", 
    departments: ["Yönetim"],
    positions: ["Proje Yöneticisi", "Takım Lideri", "Koordinatör"]
  },
  {
    name: "Kalite Kontrol Ekibi",
    description: "Kalite güvence ve test takımı",
    departments: ["Kalite"],
    positions: ["Kalite Uzmanı", "Test Mühendisi", "Kalite Kontrolör"]
  }
];

// Updated user data with proper team assignments
const USERS_DATA = [
  // Batarya Geliştirme Ekibi (Engineers)
  { name: "Selim AKBUDAK", email: "selim.akbudak@temsa.com", department: "Mühendis", position: "Batarya Mühendisi", username: "selim.akbudak", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Arda SÖNMEZ", email: "arda.sonmez@temsa.com", department: "Mühendis", position: "Elektrik Mühendisi", username: "arda.sonmez", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Batuhan SALICI", email: "batuhan.salici@temsa.com", department: "Mühendis", position: "Yazılım Mühendisi", username: "batuhan.salici", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Berk ERTÜRK", email: "berk.erturk@temsa.com", department: "Mühendis", position: "Batarya Mühendisi", username: "berk.erturk", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Biran Can TÜRE", email: "biran.can.ture@temsa.com", department: "Mühendis", position: "Elektrik Mühendisi", username: "biran.can.ture", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Esra DÖNMEZ", email: "esra.donmez@temsa.com", department: "Mühendis", position: "Yazılım Mühendisi", username: "esra.donmez", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Mete Han KUŞDEMİR", email: "mete.han.kusdemir@temsa.com", department: "Mühendis", position: "Batarya Mühendisi", username: "mete.han.kusdemir", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Muhammed KARAKUŞ", email: "muhammed.karakus@temsa.com", department: "Mühendis", position: "Elektrik Mühendisi", username: "muhammed.karakus", teamName: "Batarya Geliştirme Ekibi" },
  { name: "Murat KARA", email: "murat.kara@temsa.com", department: "Mühendis", position: "Yazılım Mühendisi", username: "murat.kara", teamName: "Batarya Geliştirme Ekibi" },

  // Batarya Paketleme Ekibi (Technicians)
  { name: "Ömer ARISOY", email: "omer.arisoy@temsa.com", department: "Teknisyen", position: "Batarya Teknisyeni", username: "omer.arisoy", teamName: "Batarya Paketleme Ekibi" },
  { name: "Samet DANACI", email: "samet.danaci@temsa.com", department: "Teknisyen", position: "Paketleme Uzmanı", username: "samet.danaci", teamName: "Batarya Paketleme Ekibi" },
  { name: "Yaşar DOĞAN", email: "yasar.dogan@temsa.com", department: "Teknisyen", position: "Montaj Teknisyeni", username: "yasar.dogan", teamName: "Batarya Paketleme Ekibi" },
  { name: "Ahmet YILMAZ", email: "ahmet.yilmaz@temsa.com", department: "Teknisyen", position: "Batarya Teknisyeni", username: "ahmet.yilmaz", teamName: "Batarya Paketleme Ekibi" },
  { name: "Mehmet ÖZKAN", email: "mehmet.ozkan@temsa.com", department: "Teknisyen", position: "Paketleme Uzmanı", username: "mehmet.ozkan", teamName: "Batarya Paketleme Ekibi" },
  { name: "Ali DEMİR", email: "ali.demir@temsa.com", department: "Teknisyen", position: "Montaj Teknisyeni", username: "ali.demir", teamName: "Batarya Paketleme Ekibi" },
  { name: "Fatma KAYA", email: "fatma.kaya@temsa.com", department: "Teknisyen", position: "Batarya Teknisyeni", username: "fatma.kaya", teamName: "Batarya Paketleme Ekibi" },

  // Yönetim Ekibi (Management)
  { name: "Hasan ÇELIK", email: "hasan.celik@temsa.com", department: "Yönetim", position: "Proje Yöneticisi", username: "hasan.celik", teamName: "Yönetim Ekibi", role: "ADMIN" },
  { name: "Ayşe GÜLER", email: "ayse.guler@temsa.com", department: "Yönetim", position: "Takım Lideri", username: "ayse.guler", teamName: "Yönetim Ekibi", role: "ADMIN" },
  { name: "Mustafa ÖZTÜRK", email: "mustafa.ozturk@temsa.com", department: "Yönetim", position: "Koordinatör", username: "mustafa.ozturk", teamName: "Yönetim Ekibi" },

  // Kalite Kontrol Ekibi (Quality)
  { name: "Elif ŞAHIN", email: "elif.sahin@temsa.com", department: "Kalite", position: "Kalite Uzmanı", username: "elif.sahin", teamName: "Kalite Kontrol Ekibi" },
  { name: "Oğuz ARSLAN", email: "oguz.arslan@temsa.com", department: "Kalite", position: "Test Mühendisi", username: "oguz.arslan", teamName: "Kalite Kontrol Ekibi" },
  { name: "Zeynep KURT", email: "zeynep.kurt@temsa.com", department: "Kalite", position: "Kalite Kontrolör", username: "zeynep.kurt", teamName: "Kalite Kontrol Ekibi" },
  { name: "Burak YILDIRIM", email: "burak.yildirim@temsa.com", department: "Kalite", position: "Test Mühendisi", username: "burak.yildirim", teamName: "Kalite Kontrol Ekibi" },
  { name: "Seda AKIN", email: "seda.akin@temsa.com", department: "Kalite", position: "Kalite Uzmanı", username: "seda.akin", teamName: "Kalite Kontrol Ekibi" },
  { name: "Emre POLAT", email: "emre.polat@temsa.com", department: "Kalite", position: "Kalite Kontrolör", username: "emre.polat", teamName: "Kalite Kontrol Ekibi" },
  { name: "Gül BAYRAM", email: "gul.bayram@temsa.com", department: "Kalite", position: "Test Mühendisi", username: "gul.bayram", teamName: "Kalite Kontrol Ekibi" }
];

async function syncTeamsAndUsers() {
  try {
    console.log('🔄 Starting team and user synchronization...');

    // 1. Clear existing data
    console.log('🗑️  Clearing existing team memberships...');
    await prisma.teamMember.deleteMany({});
    
    console.log('🗑️  Clearing existing teams...');
    await prisma.team.deleteMany({});
    
    console.log('🗑️  Clearing existing users...');
    await prisma.user.deleteMany({});

    // 2. Create teams
    console.log('🏗️  Creating teams...');
    const createdTeams = {};
    
    for (const teamConfig of TEAMS_CONFIG) {
      const team = await prisma.team.create({
        data: {
          name: teamConfig.name,
          description: teamConfig.description
        }
      });
      createdTeams[teamConfig.name] = team;
      console.log(`✅ Created team: ${team.name}`);
    }

    // 3. Create users
    console.log('👥 Creating users...');
    const defaultPassword = await bcrypt.hash('123456', 10);
    const createdUsers = {};

    for (const userData of USERS_DATA) {
      const user = await prisma.user.create({
        data: {
          name: userData.name,
          email: userData.email,
          department: userData.department,
          position: userData.position,
          username: userData.username,
          password: defaultPassword,
          role: userData.role || 'USER',
          isActive: true,
          maxHoursPerDay: 8,
          workingDays: "1,2,3,4,5"
        }
      });
      createdUsers[userData.email] = user;
      console.log(`✅ Created user: ${user.name} (${user.department})`);
    }

    // 4. Create team memberships
    console.log('🔗 Creating team memberships...');
    
    for (const userData of USERS_DATA) {
      const user = createdUsers[userData.email];
      const team = createdTeams[userData.teamName];
      
      if (user && team) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: user.id,
            role: userData.role === 'ADMIN' ? 'Leader' : 'Member'
          }
        });
        console.log(`✅ Added ${user.name} to ${team.name}`);
      }
    }

    // 5. Verify the results
    console.log('\n📊 Verification Results:');
    
    const teams = await prisma.team.findMany({
      include: {
        members: {
          include: {
            user: {
              select: { name: true, department: true, position: true, role: true }
            }
          }
        }
      }
    });

    teams.forEach(team => {
      console.log(`\n🏢 ${team.name} (${team.members.length} members):`);
      team.members.forEach(member => {
        const roleIcon = member.user.role === 'ADMIN' ? '👑' : '👤';
        console.log(`  ${roleIcon} ${member.user.name} - ${member.user.position} (${member.role})`);
      });
    });

    const totalUsers = await prisma.user.count();
    const totalTeams = await prisma.team.count();
    const totalMemberships = await prisma.teamMember.count();

    console.log('\n📈 Summary:');
    console.log(`✅ Created ${totalUsers} users`);
    console.log(`✅ Created ${totalTeams} teams`);
    console.log(`✅ Created ${totalMemberships} team memberships`);
    console.log('🎉 Synchronization completed successfully!');

  } catch (error) {
    console.error('❌ Error during synchronization:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the synchronization
syncTeamsAndUsers()
  .then(() => {
    console.log('\n✨ Team and user synchronization completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Synchronization failed:', error);
    process.exit(1);
  });
