function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '')
}

export function getSiteBaseUrl() {
  return trimTrailingSlash(
    Deno.env.get('SITE_BASE_URL') ||
      Deno.env.get('PUBLIC_SITE_BASE_URL') ||
      'https://afinju247.com'
  )
}

export function getAdminBaseUrl() {
  return trimTrailingSlash(
    Deno.env.get('ADMIN_DASHBOARD_BASE_URL') ||
      `${getSiteBaseUrl()}/admin`
  )
}

export function getMailSender() {
  return {
    fromEmail: Deno.env.get('MAIL_FROM_EMAIL') || 'noreply@afinju247.com',
    fromName: Deno.env.get('MAIL_FROM_NAME') || 'AFINJU',
  }
}

