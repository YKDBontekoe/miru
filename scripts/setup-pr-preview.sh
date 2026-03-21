#!/usr/bin/env bash
# setup-pr-preview.sh
#
# Creates the Azure Container App and GitHub Environment needed by the
# pr-backend-build / pr-backend-deploy jobs in pr-checks.yml.
#
# Prerequisites:
#   • az CLI logged in  (az login)
#   • gh CLI logged in  (gh auth login)
#   • The existing 'aca-miru-staging' Container App must already exist.
#
# Usage:
#   chmod +x scripts/setup-pr-preview.sh
#   ./scripts/setup-pr-preview.sh

set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
RESOURCE_GROUP="${PR_RESOURCE_GROUP:-rg-miru}"
PR_APP="${PR_CONTAINER_APP_NAME:-aca-miru-pr}"
STAGING_APP="${STAGING_CONTAINER_APP_NAME:-aca-miru-staging}"
REPO="${GITHUB_REPOSITORY:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"

echo "==> Resource group : ${RESOURCE_GROUP}"
echo "==> PR Container App: ${PR_APP}"
echo "==> Staging app     : ${STAGING_APP}"
echo "==> GitHub repo     : ${REPO}"
echo ""

# ── 1. Resolve the existing Container Apps managed environment ────────────────
echo "==> Resolving Container Apps environment from '${STAGING_APP}'..."
ENVIRONMENT_ID=$(az containerapp show \
  --name "${STAGING_APP}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "properties.managedEnvironmentId" \
  --output tsv)

if [ -z "${ENVIRONMENT_ID}" ]; then
  echo "ERROR: Could not determine the managed environment ID from '${STAGING_APP}'."
  exit 1
fi
echo "    Environment ID: ${ENVIRONMENT_ID}"

# ── 2. Create the PR preview Container App ────────────────────────────────────
echo ""
echo "==> Creating Container App '${PR_APP}'..."

# Use the helloworld image as a placeholder; pr-checks.yml overwrites it on
# every PR push.
#
# In 'labels' revision mode, --target-label is required. We initialize with a
# 'placeholder' label.
az extension add --name containerapp --upgrade --allow-preview true --yes > /dev/null
az containerapp create \
  --name "${PR_APP}" \
  --resource-group "${RESOURCE_GROUP}" \
  --environment "${ENVIRONMENT_ID}" \
  --image "mcr.microsoft.com/azuredocs/containerapps-helloworld:latest" \
  --target-port 8000 \
  --ingress external \
  --revisions-mode multiple \
  --revision-suffix "initial" \
  --target-label "placeholder" \
  --cpu 0.5 \
  --memory 1.0Gi \
  --min-replicas 0 \
  --max-replicas 2

echo "    Container App '${PR_APP}' created."

APP_FQDN=$(az containerapp show \
  --name "${PR_APP}" \
  --resource-group "${RESOURCE_GROUP}" \
  --query "properties.configuration.ingress.fqdn" \
  --output tsv)
echo "    URL: https://${APP_FQDN}"

# ── 3. Create the 'pr-preview' GitHub Environment ─────────────────────────────
echo ""
echo "==> Creating GitHub Environment 'pr-preview'..."
gh api "repos/${REPO}/environments/pr-preview" \
  --method PUT \
  --field prevent_self_review=false \
  --silent
echo "    Environment created."

# ── 4. Copy secrets from 'staging' into 'pr-preview' ─────────────────────────
#
# GitHub does not expose secret values via API, so we read the list of secrets
# in the 'staging' environment and prompt you to re-enter any that aren't
# already at the repository level.
#
# Secrets shared at the repository level (no prefix) are automatically
# available in all environments — you only need to add environment-specific
# ones (STAGING_* secrets) to 'pr-preview'.
echo ""
echo "==> The following secrets must be added to the 'pr-preview' GitHub Environment."
echo "    They are NOT readable via the API, so copy them from your 'staging' environment."
echo ""
echo "    Required secrets (mirror of 'staging' environment):"
echo "      AZURE_CREDENTIALS"
echo "      STAGING_DATABASE_URL"
echo "      STAGING_SUPABASE_URL"
echo "      STAGING_SUPABASE_KEY"
echo "      STAGING_SUPABASE_SERVICE_ROLE_KEY"
echo "      STAGING_SUPABASE_JWT_SECRET"
echo "      STAGING_SECRET_KEY"
echo "      STAGING_WEBAUTHN_RP_ID"
echo "      STAGING_WEBAUTHN_RP_NAME"
echo "      STAGING_WEBAUTHN_EXPECTED_ORIGIN"
echo "      STAGING_CORS_ALLOWED_ORIGINS"
echo ""
echo "    Repository-level secrets (already available, no action needed):"
echo "      OPENROUTER_API_KEY, DEFAULT_CHAT_MODEL, EMBEDDING_MODEL,"
echo "      TAVILY_API_KEY, SENTRY_DSN,"
echo "      AZURE_NOTIFICATION_HUB_NAME, AZURE_NOTIFICATION_HUB_CONNECTION_STRING"
echo ""
echo "    Add them at:"
echo "    https://github.com/${REPO}/settings/environments/pr-preview/edit"
echo ""

# ── 5. Summary ────────────────────────────────────────────────────────────────
echo "==> Done."
echo ""
echo "    Next steps:"
echo "    1. Add the secrets listed above to the 'pr-preview' environment."
echo "    2. (Optional) Set repo variables to override defaults:"
echo "         PR_CONTAINER_APP_NAME = ${PR_APP}"
echo "         PR_RESOURCE_GROUP     = ${RESOURCE_GROUP}"
echo "    3. Open a PR with backend changes — the preview deploy will trigger automatically."
