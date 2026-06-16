-- Enable RLS on all tables
ALTER TABLE organisations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_admins         ENABLE ROW LEVEL SECURITY;
ALTER TABLE substitutes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE pool_memberships   ENABLE ROW LEVEL SECURITY;
ALTER TABLE absences           ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications      ENABLE ROW LEVEL SECURITY;
ALTER TABLE ranking_logs       ENABLE ROW LEVEL SECURITY;

-- organisations: admin can see and update their own org
CREATE POLICY admin_select_own_org ON organisations
  FOR SELECT USING (id IN (
    SELECT org_id FROM org_admins WHERE user_id = auth.uid()
  ));
CREATE POLICY admin_update_own_org ON organisations
  FOR UPDATE USING (id IN (
    SELECT org_id FROM org_admins WHERE user_id = auth.uid()
  ));

-- org_admins: user can see their own admin record
CREATE POLICY admin_select_own_record ON org_admins
  FOR SELECT USING (user_id = auth.uid());
-- INSERT only via service role (no direct insert policy for anon/authed)

-- substitutes: own record
CREATE POLICY substitute_select_own ON substitutes
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY substitute_update_own ON substitutes
  FOR UPDATE USING (user_id = auth.uid());
-- admins can view substitutes in their pool
CREATE POLICY admin_select_pool_substitutes ON substitutes
  FOR SELECT USING (
    id IN (
      SELECT substitute_id FROM pool_memberships
      WHERE org_id IN (
        SELECT org_id FROM org_admins WHERE user_id = auth.uid()
      )
    )
  );

-- pool_memberships: admin sees their pool; sub sees their memberships
CREATE POLICY admin_select_pool ON pool_memberships
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid())
  );
CREATE POLICY substitute_select_own_memberships ON pool_memberships
  FOR SELECT USING (
    substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())
  );

-- absences: admin sees own org; sub sees active pool orgs
CREATE POLICY admin_select_own_absences ON absences
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid())
  );
CREATE POLICY substitute_select_pool_absences ON absences
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM pool_memberships
      WHERE substitute_id IN (
        SELECT id FROM substitutes WHERE user_id = auth.uid()
      ) AND active = true
    )
  );
-- INSERT and UPDATE only via service role API routes

-- claims: own substitute or admin of the org
CREATE POLICY substitute_insert_claim ON claims
  FOR INSERT WITH CHECK (
    substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())
  );
CREATE POLICY substitute_select_own_claims ON claims
  FOR SELECT USING (
    substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())
  );
CREATE POLICY admin_select_org_claims ON claims
  FOR SELECT USING (
    absence_id IN (
      SELECT id FROM absences WHERE org_id IN (
        SELECT org_id FROM org_admins WHERE user_id = auth.uid()
      )
    )
  );

-- notifications
CREATE POLICY substitute_select_own_notifications ON notifications
  FOR SELECT USING (
    substitute_id IN (SELECT id FROM substitutes WHERE user_id = auth.uid())
  );
CREATE POLICY admin_select_org_notifications ON notifications
  FOR SELECT USING (
    absence_id IN (
      SELECT id FROM absences WHERE org_id IN (
        SELECT org_id FROM org_admins WHERE user_id = auth.uid()
      )
    )
  );

-- ranking_logs: admin only
CREATE POLICY admin_select_ranking_logs ON ranking_logs
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM org_admins WHERE user_id = auth.uid())
  );
