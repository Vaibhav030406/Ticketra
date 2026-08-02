# setup-keycloak.ps1
# Automates Keycloak configuration for the Event Ticket Platform

Write-Host "Authenticating with Keycloak..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh config credentials --server http://localhost:8080 --realm master --user admin --password admin

Write-Host "Creating 'event-ticket-platform' realm..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create realms -s realm=event-ticket-platform -s enabled=true

Write-Host "Creating 'event-ticket-platform-app' client..."
# We use standard input to avoid shell escaping issues with arrays
$clientJson = @"
{
  "clientId": "event-ticket-platform-app",
  "enabled": true,
  "publicClient": true,
  "redirectUris": [
    "http://localhost:5173/*"
  ],
  "webOrigins": [
    "http://localhost:5173"
  ],
  "standardFlowEnabled": true,
  "directAccessGrantsEnabled": true
}
"@
$clientJson | docker exec -i backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create clients -r event-ticket-platform -f -

Write-Host "Creating Realm Roles..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create roles -r event-ticket-platform -s name=ROLE_ORGANIZER
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create roles -r event-ticket-platform -s name=ROLE_ATTENDEE
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create roles -r event-ticket-platform -s name=ROLE_STAFF

Write-Host "Creating 'organizer' user..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create users -r event-ticket-platform -s username=organizer -s enabled=true -s email=organizer@example.com -s firstName=Organizer -s lastName=User
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh set-password -r event-ticket-platform --username organizer --new-password password
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh add-roles -r event-ticket-platform --uusername organizer --rolename ROLE_ORGANIZER

Write-Host "Creating 'attendee' user..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create users -r event-ticket-platform -s username=attendee -s enabled=true -s email=attendee@example.com -s firstName=Attendee -s lastName=User
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh set-password -r event-ticket-platform --username attendee --new-password password
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh add-roles -r event-ticket-platform --uusername attendee --rolename ROLE_ATTENDEE

Write-Host "Creating 'staff' user..."
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh create users -r event-ticket-platform -s username=staff -s enabled=true -s email=staff@example.com -s firstName=Staff -s lastName=User
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh set-password -r event-ticket-platform --username staff --new-password password
docker exec backend-keycloak-1 /opt/keycloak/bin/kcadm.sh add-roles -r event-ticket-platform --uusername staff --rolename ROLE_STAFF

Write-Host "Keycloak configuration complete!"
