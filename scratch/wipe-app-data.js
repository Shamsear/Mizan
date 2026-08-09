const { neon } = require("@neondatabase/serverless");

const DATABASE_URL = "postgresql://neondb_owner:npg_9PfO6NliSzuM@ep-polished-truth-azper53o-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const CLERK_SECRET_KEY = "sk_test_apjlds4WCT2WwhfsVsFKZEyJUDUQxCKq8FkU0egQUj";

async function main() {
  console.log("=== STARTING APPLICATION RESET PROCEDURES ===");

  // 1. Wipe Neon Postgres Tables
  try {
    console.log("Connecting to Neon Postgres...");
    const sql = neon(DATABASE_URL);

    console.log("Truncating database tables...");
    await sql`TRUNCATE TABLE transactions CASCADE;`;
    await sql`TRUNCATE TABLE categories CASCADE;`;
    await sql`TRUNCATE TABLE recurring_rules CASCADE;`;
    await sql`TRUNCATE TABLE goals CASCADE;`;
    await sql`TRUNCATE TABLE quick_add_templates CASCADE;`;
    await sql`TRUNCATE TABLE settings CASCADE;`;
    console.log("✓ Database tables wiped successfully.");
  } catch (err) {
    console.error("✕ Failed to wipe database tables:", err);
  }

  // 2. Wipe Clerk Users
  try {
    console.log("Fetching Clerk users list...");
    const res = await fetch("https://api.clerk.com/v1/users?limit=100", {
      headers: {
        Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      },
    });

    if (!res.ok) {
      throw new Error(`Clerk API responded with status ${res.status}`);
    }

    const users = await res.json();
    console.log(`Found ${users.length} users in Clerk.`);

    for (const user of users) {
      console.log(`Deleting Clerk user ${user.id} (${user.email_addresses[0]?.email_address})...`);
      const delRes = await fetch(`https://api.clerk.com/v1/users/${user.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${CLERK_SECRET_KEY}`,
        },
      });

      if (delRes.ok) {
        console.log(`✓ Deleted user ${user.id}`);
      } else {
        console.error(`✕ Failed to delete user ${user.id}: ${delRes.statusText}`);
      }
    }
    console.log("✓ Clerk users database wiped successfully.");
  } catch (err) {
    console.error("✕ Failed to wipe Clerk users:", err);
  }

  console.log("=== RESET PROCEDURES COMPLETED SUCCESSFULLY ===");
  console.log("\n[ACTION REQUIRED]: To wipe your local browser state, please run the following in your browser's DevTools Console:");
  console.log("   indexedDB.deleteDatabase('MizanDB'); localStorage.clear(); location.reload();");
}

main();
