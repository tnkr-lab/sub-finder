-- SubFill schema

CREATE TABLE organisations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text,                    -- 'school' | 'care_home' | 'workplace'
  location text,
  lat decimal, lng decimal,
  default_pay_rate decimal,
  created_at timestamp DEFAULT now()
);

CREATE TABLE org_admins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  user_id uuid REFERENCES auth.users NOT NULL,
  role text DEFAULT 'admin'
);

CREATE TABLE substitutes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  qualifications text[],
  certifications text[],
  lat decimal, lng decimal,
  max_distance_km int DEFAULT 20,
  availability jsonb,            -- {"mon":true,"tue":true,...,"sun":false}
  cancellation_count int DEFAULT 0,
  total_shifts int DEFAULT 0,
  last_booked_at timestamp,
  push_subscription jsonb,       -- Web Push PushSubscription JSON
  created_at timestamp DEFAULT now()
);

CREATE TABLE pool_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  substitute_id uuid REFERENCES substitutes NOT NULL,
  active bool DEFAULT true,
  added_at timestamp DEFAULT now(),
  UNIQUE(org_id, substitute_id)
);

CREATE TABLE absences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations NOT NULL,
  posted_by uuid REFERENCES org_admins NOT NULL,
  absent_staff_name text NOT NULL,
  date date NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  role text,
  pay_rate decimal NOT NULL,
  notes text,
  status text DEFAULT 'open',   -- 'open' | 'claimed' | 'cancelled'
  claimed_by uuid REFERENCES substitutes,
  claimed_at timestamp,
  ai_rankings jsonb,
  viewers_count int DEFAULT 0,
  created_at timestamp DEFAULT now()
);

CREATE TABLE claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  absence_id uuid REFERENCES absences UNIQUE NOT NULL,  -- ONE claim per absence
  substitute_id uuid REFERENCES substitutes NOT NULL,
  claimed_at timestamp DEFAULT now()                    -- server-set, not client
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  substitute_id uuid REFERENCES substitutes NOT NULL,
  absence_id uuid REFERENCES absences NOT NULL,
  type text NOT NULL,           -- 'new_slot' | 'slot_filled' | 'claim_confirmed' | 'claim_attempt'
  result text,                  -- 'success' | 'race_lost' | 'error' (for claim_attempt type)
  sent_at timestamp DEFAULT now(),
  read_at timestamp
);

CREATE TABLE ranking_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES organisations,
  absence_id uuid REFERENCES absences,
  pool_size int,
  latency_ms int,
  fallback bool DEFAULT false,
  input_tokens int,
  output_tokens int,
  created_at timestamp DEFAULT now()
);
