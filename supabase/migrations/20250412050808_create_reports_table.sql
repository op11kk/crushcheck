-- Ensure the uuid-ossp extension is enabled if not already
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- Usually enabled by default on Supabase

-- Create table to store crush check reports
CREATE TABLE public.reports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Link to the user who generated the report
    created_at timestamptz DEFAULT now() NOT NULL,

    -- Crush Level fields (Flattened for easier querying)
    crush_level_current_score integer NOT NULL CHECK (crush_level_current_score >= 0 AND crush_level_current_score <= 100),
    crush_level_label text,
    crush_level_potential_score integer NOT NULL CHECK (crush_level_potential_score >= 0 AND crush_level_potential_score <= 100),
    crush_level_score_delta integer,
    crush_level_positive_tags text[], -- Array of strings
    crush_level_negative_tags text[], -- Array of strings

    -- Crush Mind
    crush_mind text,

    -- Green Flags (stored as JSONB array for flexibility)
    green_flags jsonb,

    -- Attachment Style
    attachment_style_crush text, -- Could refine with an ENUM type later if needed
    attachment_style_user text,  -- Could refine with an ENUM type later if needed
    attachment_description text,

    -- Reciprocity Score
    reciprocity_score_score integer NOT NULL CHECK (reciprocity_score_score >= 0 AND reciprocity_score_score <= 100),
    reciprocity_score_comment text,

    -- Compatibility Score
    compatibility_score_score integer NOT NULL CHECK (compatibility_score_score >= 0 AND compatibility_score_score <= 100),
    compatibility_score_comment text,

    -- Red Flags (stored as JSONB array for flexibility)
    red_flags jsonb,

    -- Optional: Store the full raw JSON report from OpenAI
    raw_report jsonb
);

-- Add indexes for common query patterns
CREATE INDEX idx_reports_user_id ON public.reports(user_id);
CREATE INDEX idx_reports_created_at ON public.reports(created_at);

-- Enable Row Level Security (RLS) for the table
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies:
-- 1. Allow users to SELECT their own reports
CREATE POLICY "Allow individual read access"
ON public.reports
FOR SELECT
USING (auth.uid() = user_id);

-- 2. Allow users to INSERT reports for themselves
CREATE POLICY "Allow individual insert access"
ON public.reports
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Optional: Allow users to DELETE their own reports (Uncomment if needed)
-- CREATE POLICY "Allow individual delete access"
-- ON public.reports
-- FOR DELETE
-- USING (auth.uid() = user_id);

-- Optional: Allow users to UPDATE their own reports (Uncomment if needed, consider carefully which fields should be updatable)
-- CREATE POLICY "Allow individual update access"
-- ON public.reports
-- FOR UPDATE
-- USING (auth.uid() = user_id)
-- WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.reports IS 'Stores the generated CrushCheck analysis reports for users.';
COMMENT ON COLUMN public.reports.user_id IS 'References the user who generated the report.';
COMMENT ON COLUMN public.reports.raw_report IS 'Stores the complete raw JSON response from the analysis AI.';
