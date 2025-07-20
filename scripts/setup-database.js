// Database Setup Script for SEO Guide Creator
// This script creates all necessary tables in Supabase
// Run with: node scripts/setup-database.js

const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = 'https://jdqdfejuesqbcxjwbcwl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    console.log('Run with: SUPABASE_SERVICE_ROLE_KEY="your-key" node scripts/setup-database.js');
    process.exit(1);
}

// Initialize Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

// SQL statements to create tables
const sqlStatements = [
    // Enable UUID extension
    `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`,
    
    // Create api_keys table
    `CREATE TABLE IF NOT EXISTS api_keys (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        service VARCHAR(50) NOT NULL CHECK (service IN ('dataforseo', 'anthropic')),
        encrypted_key TEXT NOT NULL,
        key_hint VARCHAR(10),
        is_valid BOOLEAN DEFAULT true,
        last_validated TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, service)
    );`,
    
    // Create usage_logs table
    `CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
        action VARCHAR(50) NOT NULL,
        details JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Create user_settings table
    `CREATE TABLE IF NOT EXISTS user_settings (
        user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
        settings JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );`,
    
    // Create indexes
    `CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);`,
    `CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);`,
    
    // Enable RLS
    `ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;`,
    
    // Create update trigger function
    `CREATE OR REPLACE FUNCTION update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
    END;
    $$ language 'plpgsql';`
];

// RLS Policies
const policies = [
    // API Keys policies
    {
        table: 'api_keys',
        name: 'Users can view own api keys',
        definition: 'auth.uid() = user_id',
        command: 'SELECT'
    },
    {
        table: 'api_keys',
        name: 'Users can insert own api keys',
        definition: 'auth.uid() = user_id',
        command: 'INSERT'
    },
    {
        table: 'api_keys',
        name: 'Users can update own api keys',
        definition: 'auth.uid() = user_id',
        command: 'UPDATE'
    },
    {
        table: 'api_keys',
        name: 'Users can delete own api keys',
        definition: 'auth.uid() = user_id',
        command: 'DELETE'
    },
    // Usage logs policies
    {
        table: 'usage_logs',
        name: 'Users can view own usage logs',
        definition: 'auth.uid() = user_id',
        command: 'SELECT'
    },
    {
        table: 'usage_logs',
        name: 'Users can insert own usage logs',
        definition: 'auth.uid() = user_id',
        command: 'INSERT'
    },
    // User settings policies
    {
        table: 'user_settings',
        name: 'Users can view own settings',
        definition: 'auth.uid() = user_id',
        command: 'SELECT'
    },
    {
        table: 'user_settings',
        name: 'Users can manage own settings',
        definition: 'auth.uid() = user_id',
        command: 'ALL'
    }
];

async function setupDatabase() {
    console.log('🚀 Starting database setup...\n');
    
    try {
        // Execute SQL statements
        console.log('📋 Creating tables...');
        for (const sql of sqlStatements) {
            const { error } = await supabase.rpc('exec_sql', { query: sql });
            if (error && !error.message.includes('already exists')) {
                console.error(`❌ Error executing SQL: ${error.message}`);
                console.log(`   SQL: ${sql.substring(0, 50)}...`);
            } else {
                console.log(`✅ Executed: ${sql.substring(0, 50)}...`);
            }
        }
        
        // Create triggers
        console.log('\n📋 Creating triggers...');
        const triggers = [
            `DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;`,
            `CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`,
            `DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;`,
            `CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
                FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();`
        ];
        
        for (const sql of triggers) {
            const { error } = await supabase.rpc('exec_sql', { query: sql });
            if (error) {
                console.error(`❌ Error creating trigger: ${error.message}`);
            } else {
                console.log(`✅ Created trigger: ${sql.substring(0, 50)}...`);
            }
        }
        
        // Create RLS policies
        console.log('\n📋 Creating RLS policies...');
        for (const policy of policies) {
            // First drop if exists
            const dropSql = `DROP POLICY IF EXISTS "${policy.name}" ON ${policy.table};`;
            await supabase.rpc('exec_sql', { query: dropSql });
            
            // Then create
            const createSql = `CREATE POLICY "${policy.name}" ON ${policy.table} FOR ${policy.command} USING (${policy.definition});`;
            const { error } = await supabase.rpc('exec_sql', { query: createSql });
            
            if (error) {
                console.error(`❌ Error creating policy: ${error.message}`);
                console.log(`   Policy: ${policy.name}`);
            } else {
                console.log(`✅ Created policy: ${policy.name}`);
            }
        }
        
        // Verify tables exist
        console.log('\n🔍 Verifying tables...');
        const { data: tables, error: tablesError } = await supabase
            .rpc('exec_sql', { 
                query: `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';` 
            });
            
        if (tables) {
            console.log('✅ Tables in database:', tables);
        }
        
        console.log('\n✨ Database setup complete!');
        console.log('\n📋 Next steps:');
        console.log('1. Go to https://addhass.github.io/seo-guide-creator/auth.html');
        console.log('2. Sign up for an account');
        console.log('3. Add your API keys in the dashboard');
        console.log('\n⚠️  Remember to keep your service role key secret!');
        
    } catch (error) {
        console.error('❌ Setup failed:', error);
    }
}

// Run the setup
setupDatabase();