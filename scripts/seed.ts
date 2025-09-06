import { db } from "../server/db";
import { users, clients, projects, assets, variants } from "../shared/schema";
import bcrypt from "bcrypt";

async function seed() {
  console.log("Starting database seed...");

  try {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 10);
    const [adminUser] = await db.insert(users).values({
      email: "admin@advariants.com",
      name: "System Administrator",
      password: adminPassword,
      role: "ADMIN",
    }).returning();

    console.log("✅ Created admin user:", adminUser.email);

    // Create regular user
    const userPassword = await bcrypt.hash("user123", 10);
    const [regularUser] = await db.insert(users).values({
      email: "user@example.com",
      name: "John Designer",
      password: userPassword,
      role: "USER",
    }).returning();

    console.log("✅ Created regular user:", regularUser.email);

    // Create sample clients
    const [client1] = await db.insert(clients).values({
      name: "Acme Corporation",
      description: "Leading technology company specializing in innovative solutions",
      createdByUserId: regularUser.id,
    }).returning();

    const [client2] = await db.insert(clients).values({
      name: "TechStart Inc",
      description: "Fast-growing startup in the fintech space",
      createdByUserId: adminUser.id,
    }).returning();

    const [client3] = await db.insert(clients).values({
      name: "Brand Studios",
      description: "Creative agency for lifestyle brands",
      createdByUserId: regularUser.id,
    }).returning();

    console.log("✅ Created sample clients");

    // Create sample projects
    const [project1] = await db.insert(projects).values({
      clientId: client1.id,
      name: "Spring 2024 Campaign",
      description: "Seasonal marketing campaign for Q2 product launches",
      createdByUserId: regularUser.id,
    }).returning();

    const [project2] = await db.insert(projects).values({
      clientId: client2.id,
      name: "Product Launch Banners",
      description: "Digital advertising assets for new mobile app launch",
      createdByUserId: adminUser.id,
    }).returning();

    const [project3] = await db.insert(projects).values({
      clientId: client3.id,
      name: "Social Media Suite",
      description: "Complete social media advertising package",
      createdByUserId: regularUser.id,
    }).returning();

    console.log("✅ Created sample projects");

    // Create sample assets
    const bannerSvg = `<svg width="800" height="400" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#4F46E5;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#7C3AED;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#grad1)"/>
  <rect x="50" y="50" width="700" height="300" rx="20" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="2"/>
  <text x="400" y="150" text-anchor="middle" font-family="Arial, sans-serif" font-size="48" font-weight="bold" fill="white">{{headline}}</text>
  <text x="400" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" fill="rgba(255,255,255,0.9)">{{subheadline}}</text>
  <rect x="320" y="250" width="160" height="50" rx="25" fill="white"/>
  <text x="400" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#4F46E5">{{cta}}</text>
</svg>`;

    const socialSvg = `<svg width="600" height="600" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="socialGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#EC4899;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#BE185D;stop-opacity:1" />
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#socialGrad)"/>
  <circle cx="300" cy="200" r="80" fill="rgba(255,255,255,0.2)" stroke="white" stroke-width="3"/>
  <text x="300" y="320" text-anchor="middle" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="white">{{headline}}</text>
  <text x="300" y="370" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="rgba(255,255,255,0.9)">{{subheadline}}</text>
  <rect x="220" y="420" width="160" height="45" rx="22" fill="white"/>
  <text x="300" y="450" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" font-weight="bold" fill="#BE185D">{{cta}}</text>
</svg>`;

    const productSvg = `<svg width="1200" height="628" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="productGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#059669;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#065F46;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#productGrad)"/>
  <rect x="100" y="100" width="1000" height="428" rx="30" fill="rgba(255,255,255,0.1)" stroke="rgba(255,255,255,0.3)" stroke-width="3"/>
  <text x="600" y="200" text-anchor="middle" font-family="Arial, sans-serif" font-size="64" font-weight="bold" fill="white">{{headline}}</text>
  <text x="600" y="280" text-anchor="middle" font-family="Arial, sans-serif" font-size="32" fill="rgba(255,255,255,0.9)">{{subheadline}}</text>
  <rect x="500" y="350" width="200" height="60" rx="30" fill="white"/>
  <text x="600" y="390" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="#059669">{{cta}}</text>
</svg>`;

    const [asset1] = await db.insert(assets).values({
      projectId: project1.id,
      name: "Spring Banner Template",
      templateSvg: bannerSvg,
      templateFonts: [
        {
          family: "Arial",
          url: "",
          weight: "normal",
          style: "normal"
        }
      ],
      defaultBindings: {
        headline: "Spring Into Savings",
        subheadline: "Get 30% off all products this season",
        cta: "Shop Now",
        image: ""
      },
      styleHints: {
        palette: ["#4F46E5", "#7C3AED", "#FFFFFF"],
        brand: "Modern, tech-forward, trustworthy",
        notes: "Use bold typography and clean gradients"
      },
      createdByUserId: regularUser.id,
    }).returning();

    const [asset2] = await db.insert(assets).values({
      projectId: project2.id,
      name: "Product Launch Hero",
      templateSvg: productSvg,
      templateFonts: [
        {
          family: "Arial",
          url: "",
          weight: "normal",
          style: "normal"
        }
      ],
      defaultBindings: {
        headline: "Revolutionary App",
        subheadline: "Transform your workflow with our latest innovation",
        cta: "Download Free",
        image: ""
      },
      styleHints: {
        palette: ["#059669", "#065F46", "#FFFFFF"],
        brand: "Professional, innovative, reliable",
        notes: "Emphasize product benefits and clean design"
      },
      createdByUserId: adminUser.id,
    }).returning();

    const [asset3] = await db.insert(assets).values({
      projectId: project3.id,
      name: "Social Media Post",
      templateSvg: socialSvg,
      templateFonts: [
        {
          family: "Arial",
          url: "",
          weight: "normal",
          style: "normal"
        }
      ],
      defaultBindings: {
        headline: "Lifestyle Goals",
        subheadline: "Discover your perfect style",
        cta: "Explore",
        image: ""
      },
      styleHints: {
        palette: ["#EC4899", "#BE185D", "#FFFFFF"],
        brand: "Trendy, lifestyle-focused, aspirational",
        notes: "Use vibrant colors and lifestyle imagery"
      },
      createdByUserId: regularUser.id,
    }).returning();

    console.log("✅ Created sample assets");

    // Create sample variants
    const variants1 = [
      {
        headline: "Spring Into Savings",
        subheadline: "Get 30% off all products this season",
        cta: "Shop Now"
      },
      {
        headline: "Season of Savings",
        subheadline: "Exclusive spring deals up to 30% off",
        cta: "Get Deals"
      },
      {
        headline: "Spring Sale Event",
        subheadline: "Limited time offer - save big today",
        cta: "Save Now"
      }
    ];

    for (let i = 0; i < variants1.length; i++) {
      const variant = variants1[i];
      await db.insert(variants).values({
        assetId: asset1.id,
        source: i === 0 ? "USER" : "AUTO",
        bindings: {
          headline: variant.headline,
          subheadline: variant.subheadline,
          cta: variant.cta,
          imageUrl: ""
        },
        renderSvg: bannerSvg.replace(/\{\{headline\}\}/g, variant.headline)
          .replace(/\{\{subheadline\}\}/g, variant.subheadline)
          .replace(/\{\{cta\}\}/g, variant.cta),
        status: "READY",
        createdByUserId: regularUser.id,
      });
    }

    const variants2 = [
      {
        headline: "Revolutionary App",
        subheadline: "Transform your workflow with our latest innovation",
        cta: "Download Free"
      },
      {
        headline: "Game-Changing Solution",
        subheadline: "Boost productivity with cutting-edge technology",
        cta: "Try Free"
      }
    ];

    for (let i = 0; i < variants2.length; i++) {
      const variant = variants2[i];
      await db.insert(variants).values({
        assetId: asset2.id,
        source: i === 0 ? "USER" : "AUTO",
        bindings: {
          headline: variant.headline,
          subheadline: variant.subheadline,
          cta: variant.cta,
          imageUrl: ""
        },
        renderSvg: productSvg.replace(/\{\{headline\}\}/g, variant.headline)
          .replace(/\{\{subheadline\}\}/g, variant.subheadline)
          .replace(/\{\{cta\}\}/g, variant.cta),
        status: "READY",
        createdByUserId: adminUser.id,
      });
    }

    const variants3 = [
      {
        headline: "Lifestyle Goals",
        subheadline: "Discover your perfect style",
        cta: "Explore"
      },
      {
        headline: "Style Inspiration",
        subheadline: "Find your unique fashion voice",
        cta: "Discover"
      },
      {
        headline: "Fashion Forward",
        subheadline: "Trendsetting looks for every occasion",
        cta: "Shop Style"
      }
    ];

    for (let i = 0; i < variants3.length; i++) {
      const variant = variants3[i];
      await db.insert(variants).values({
        assetId: asset3.id,
        source: i === 0 ? "USER" : "AUTO",
        bindings: {
          headline: variant.headline,
          subheadline: variant.subheadline,
          cta: variant.cta,
          imageUrl: ""
        },
        renderSvg: socialSvg.replace(/\{\{headline\}\}/g, variant.headline)
          .replace(/\{\{subheadline\}\}/g, variant.subheadline)
          .replace(/\{\{cta\}\}/g, variant.cta),
        status: "READY",
        createdByUserId: regularUser.id,
      });
    }

    console.log("✅ Created sample variants");

    console.log("\n🎉 Database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log("- 2 users created");
    console.log("- 3 clients created");
    console.log("- 3 projects created");
    console.log("- 3 assets created");
    console.log("- 8 variants created");
    
    console.log("\n🔐 Login Credentials:");
    console.log("Admin: admin@advariants.com / admin123");
    console.log("User:  user@example.com / user123");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

// Run the seed function
seed()
  .then(() => {
    console.log("✅ Seeding process completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding process failed:", error);
    process.exit(1);
  });
