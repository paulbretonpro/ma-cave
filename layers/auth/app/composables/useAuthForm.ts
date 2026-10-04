export function useAuthForm() {
  const supabase = useSupabaseClient()
  const runtimeConfig = useRuntimeConfig()
  const email = ref('')
  const password = ref('')
  const passwordConfirmation = ref('')
  const isRegistering = ref(false)
  const isSubmitting = ref(false)
  const errorMessage = ref('')
  const infoMessage = ref('')
  const supabaseConfigured = computed(() => (
    runtimeConfig.public.supabase.url !== 'https://setup-required.supabase.co'
    && runtimeConfig.public.supabase.key !== 'setup-required'
  ))

  async function submit() {
    if (!supabaseConfigured.value) {
      errorMessage.value = 'Configurez l’URL et la clé publishable Supabase dans le fichier .env.'
      return
    }

    errorMessage.value = ''
    infoMessage.value = ''

    if (isRegistering.value && password.value !== passwordConfirmation.value) {
      errorMessage.value = 'Les deux mots de passe ne correspondent pas.'
      return
    }

    isSubmitting.value = true
    try {
      if (isRegistering.value) {
        const { data, error } = await supabase.auth.signUp({
          email: email.value,
          password: password.value,
          options: {
            emailRedirectTo: window.location.origin,
          },
        })
        if (error) throw error
        if (!data.session) {
          infoMessage.value = 'Consultez votre boîte e-mail pour confirmer la création de votre compte.'
          return
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.value,
          password: password.value,
        })
        if (error) throw error
      }

      await navigateTo('/')
    } catch (error) {
      console.error('Échec de l’authentification Supabase.', error)
      errorMessage.value = error instanceof Error
        ? error.message
        : 'Une erreur est survenue lors de la connexion.'
    } finally {
      isSubmitting.value = false
    }
  }

  function toggleRegistration() {
    isRegistering.value = !isRegistering.value
    passwordConfirmation.value = ''
    errorMessage.value = ''
    infoMessage.value = ''
  }

  return {
    email,
    password,
    passwordConfirmation,
    isRegistering,
    isSubmitting,
    errorMessage,
    infoMessage,
    supabaseConfigured,
    submit,
    toggleRegistration,
  }
}
