<script setup lang="ts">
import { useAuthForm } from '../composables/useAuthForm'

const user = useSupabaseUser()
const {
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
} = useAuthForm()

watch(user, (value) => {
  if (value) navigateTo('/')
}, { immediate: true })
</script>

<template>
  <main class="auth-page">
    <UCard class="auth-card">
      <form class="bottle-form" @submit.prevent="submit">
        <div class="auth-heading">
          <h1>Ma cave</h1>
          <p>{{ isRegistering ? 'Créer votre compte' : 'Connectez-vous à votre cave' }}</p>
        </div>

        <UAlert
          v-if="!supabaseConfigured"
          color="warning"
          variant="subtle"
          title="Configuration Supabase requise"
          description="Renseignez NUXT_PUBLIC_SUPABASE_URL et NUXT_PUBLIC_SUPABASE_KEY dans .env, puis redémarrez l’application."
        />
        <UAlert
          v-if="errorMessage"
          color="error"
          variant="subtle"
          title="Connexion impossible"
          :description="errorMessage"
        />
        <UAlert
          v-if="infoMessage"
          color="success"
          variant="subtle"
          title="Vérifiez votre e-mail"
          :description="infoMessage"
        />

        <UFormField label="Adresse e-mail" required>
          <UInput v-model.trim="email" type="email" autocomplete="email" required class="w-full" />
        </UFormField>
        <UFormField label="Mot de passe" required>
          <UInput
            v-model="password"
            type="password"
            :autocomplete="isRegistering ? 'new-password' : 'current-password'"
            minlength="8"
            required
            class="w-full"
          />
        </UFormField>
        <UFormField v-if="isRegistering" label="Confirmer le mot de passe" required>
          <UInput
            v-model="passwordConfirmation"
            type="password"
            autocomplete="new-password"
            minlength="8"
            required
            class="w-full"
          />
        </UFormField>

        <UButton type="submit" color="neutral" block :loading="isSubmitting" :disabled="!supabaseConfigured">
          {{ isRegistering ? 'Créer mon compte' : 'Se connecter' }}
        </UButton>
        <UButton
          type="button"
          color="neutral"
          variant="link"
          block
          :disabled="!supabaseConfigured"
          @click="toggleRegistration"
        >
          {{ isRegistering ? 'J’ai déjà un compte' : 'Créer un compte' }}
        </UButton>
      </form>
    </UCard>
  </main>
</template>
