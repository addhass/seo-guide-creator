// Direct Database Setup Script using Supabase REST API
const fetch = require('node-fetch');

const SUPABASE_URL = 'https://jdqdfejuesqbcxjwbcwl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌ Error: SUPABASE_SERVICE_ROLE_KEY environment variable not set');
    process.exit(1);
}

// Complete SQL to run
const setupSQL = `
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create api_keys table
CREATE TABLE IF NOT EXISTS api_keys (
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
);

-- Create usage_logs table
CREATE TABLE IF NOT EXISTS usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_id ON usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at);

-- Enable RLS
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can insert own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can update own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can delete own api keys" ON api_keys;
DROP POLICY IF EXISTS "Users can view own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can insert own usage logs" ON usage_logs;
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can manage own settings" ON user_settings;

-- API Keys policies
CREATE POLICY "Users can view own api keys" 
    ON api_keys FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own api keys" 
    ON api_keys FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own api keys" 
    ON api_keys FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own api keys" 
    ON api_keys FOR DELETE 
    USING (auth.uid() = user_id);

-- Usage logs policies
CREATE POLICY "Users can view own usage logs" 
    ON usage_logs FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usage logs" 
    ON usage_logs FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can view own settings" 
    ON user_settings FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own settings" 
    ON user_settings FOR ALL 
    USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_api_keys_updated_at ON api_keys;
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
`;

async function setupDatabase() {
    console.log('🚀 Setting up database tables...\n');
    
    console.log('📋 Unfortunately, Supabase doesn\'t allow direct SQL execution via API.');
    console.log('   You need to run the SQL manually in the Supabase dashboard.\n');
    
    console.log('🔗 Click here to open your SQL editor:');
    console.log(`   https://supabase.com/dashboard/project/jdqdfejuesqbcxjwbcwl/sql/new\n`);
    
    console.log('📋 Then copy and paste this SQL:\n');
    console.log('='.repeat(80));
    console.log(setupSQL);
    console.log('='.repeat(80));
    
    console.log('\n✅ After running the SQL, your database will be ready!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to https://addhass.github.io/seo-guide-creator/auth.html');
    console.log('2. Sign up for an account');
    console.log('3. Add your API keys in the dashboard\n');
    
    // Test if we can at least connect
    try {
        const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_SERVICE_ROLE_KEY,
                'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`
            }
        });
        
        if (response.ok) {
            console.log('✅ Successfully connected to your Supabase project!');
        }
    } catch (error) {
        console.error('❌ Could not connect to Supabase:', error.message);
    }
}

setupDatabase();