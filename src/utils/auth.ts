import { createAdminClient } from './supabase'

export async function checkCoordinator(userId: string, organizationId: string): Promise<boolean> {
  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('coordinators')
    .select('id')
    .eq('profile_id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle()
  return data !== null
}
