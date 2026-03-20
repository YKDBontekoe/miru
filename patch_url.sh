# Fix SC2295 inside .github/workflows/pr-checks.yml
sed -i 's/ENVIRONMENT_DOMAIN="${FQDN#$APP_NAME.}"/ENVIRONMENT_DOMAIN="${FQDN#"$APP_NAME".}"/g' .github/workflows/pr-checks.yml
