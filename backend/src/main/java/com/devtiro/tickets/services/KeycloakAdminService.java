package com.devtiro.tickets.services;

import com.devtiro.tickets.domain.CreatedKeycloakUser;
import java.util.UUID;

public interface KeycloakAdminService {

  // Self-signup path: user chose their own password.
  UUID createUser(String name, String email, String password);

  // Invite path: a random temporary password is generated and returned so
  // the caller can email it — Keycloak sets it with temporary=true, which
  // forces the user to set their own password the first time they log in.
  CreatedKeycloakUser createInvitedUser(String name, String email);

  void assignRealmRole(UUID keycloakUserId, String roleName);
}
