import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function testAdminLogin() {
    console.log('🔍 Testing Admin Login Debug...\n');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service Role Key:', supabaseServiceRoleKey ? '✅ Set' : '❌ Not set');
    console.log('');

    // Test 1: Check if admin_roles table exists
    console.log('1️⃣ Checking if admin_roles table exists...');
    try {
        const { data, error } = await supabase
            .from('admin_roles')
            .select('*')
            .limit(1);

        if (error) {
            console.error('❌ Error accessing admin_roles table:', error.message);
            console.error('   Details:', error);
            console.log('\n⚠️  The admin_roles table does NOT exist!');
            console.log('📝 You need to run the RBAC schema migration:');
            console.log('   File: supabase-admin-rbac-system.sql');
            console.log('\n💡 How to run it:');
            console.log('   1. Go to Supabase Dashboard: https://supabase.com/dashboard');
            console.log('   2. Select your project');
            console.log('   3. Go to SQL Editor');
            console.log('   4. Copy and paste the contents of supabase-admin-rbac-system.sql');
            console.log('   5. Click "Run"\n');
            return;
        }

        console.log('✅ admin_roles table exists');
        console.log('   Found', data?.length || 0, 'admin(s)\n');
    } catch (err: any) {
        console.error('❌ Exception:', err.message);
        return;
    }

    // Test 2: List all admins
    console.log('2️⃣ Listing all admin users...');
    try {
        const { data: admins, error } = await supabase
            .from('admin_roles')
            .select('id, email, role, is_active, last_login');

        if (error) {
            console.error('❌ Error:', error.message);
        } else {
            if (admins && admins.length > 0) {
                console.log('   Admins in database:');
                admins.forEach((admin, index) => {
                    console.log(`   ${index + 1}. ${admin.email} (${admin.role}) - Active: ${admin.is_active}`);
                });
            } else {
                console.log('   ⚠️  No admins found in database');
            }
            console.log('');
        }
    } catch (err: any) {
        console.error('❌ Exception:', err.message);
    }

    // Test 3: Check if the specific admin exists
    console.log('3️⃣ Checking for specific admin...');
    const testEmail = 'elmahboubimehdi@gmail.com';

    try {
        const { data: admin, error } = await supabase
            .from('admin_roles')
            .select('*')
            .eq('email', testEmail)
            .single();

        if (error) {
            console.error(`❌ Admin ${testEmail} NOT found`);
            console.error('   Error:', error.message);
            console.log('\n💡 The admin account needs to be created first.');
            console.log('   This happens automatically on first login attempt.');
        } else {
            console.log(`✅ Admin ${testEmail} found!`);
            console.log('   Role:', admin.role);
            console.log('   Active:', admin.is_active);
            console.log('   Last Login:', admin.last_login || 'Never');
        }
    } catch (err: any) {
        console.error('❌ Exception:', err.message);
    }

    console.log('\n✅ Debug complete!');
}

testAdminLogin().catch(console.error);
