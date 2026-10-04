import { serverSupabaseClient } from '#supabase/server'

export async function getAuthenticatedUserId(event: Parameters<typeof serverSupabaseClient>[0]) {
  const supabase = await serverSupabaseClient(event)
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Une connexion valide est requise.',
    })
  }

  return data.user.id
}
