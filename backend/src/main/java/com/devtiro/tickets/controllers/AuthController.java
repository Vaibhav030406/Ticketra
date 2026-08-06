package com.devtiro.tickets.controllers;

import com.devtiro.tickets.domain.dtos.RegisterRequestDto;
import com.devtiro.tickets.services.KeycloakAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final KeycloakAdminService keycloakAdminService;

  // Public endpoint. Just creates the Keycloak account — no role is
  // assigned here at all. Every authenticated user can already buy tickets
  // and create/manage their own events with no role gate required; the
  // only real role left in the system is STAFF, which is invite-only and
  // scoped to a specific event (see EventStaff), never self-selected here.
  //
  // Note this does NOT create a local `User` row itself; UserProvisioningFilter
  // already does that automatically the first time the new account
  // authenticates, so we deliberately don't duplicate that logic here.
  @PostMapping(path = "/register")
  public ResponseEntity<Void> register(@Valid @RequestBody RegisterRequestDto request) {
    keycloakAdminService.createUser(
        request.getName(), request.getEmail(), request.getPassword()
    );
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }
}
