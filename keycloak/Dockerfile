FROM quay.io/keycloak/keycloak:latest

# Copy the realm export file so it gets imported automatically
COPY realm-export.json /opt/keycloak/data/import/realm.json

# Use the production start command, but since it's a simple setup, 
# start-dev is often used to bypass strict hostname/HTTPS requirements 
# if SSL termination is handled by Railway.
# We will use start-dev for now to ensure it boots easily behind Railway's proxy.
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start-dev", "--import-realm"]
