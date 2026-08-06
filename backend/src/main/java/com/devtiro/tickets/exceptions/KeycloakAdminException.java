package com.devtiro.tickets.exceptions;

// Wraps any failure talking to Keycloak's Admin REST API (token fetch, user
// creation, role assignment) that isn't a clean "user already exists" case.
public class KeycloakAdminException extends EventTicketException {

  public KeycloakAdminException() {
  }

  public KeycloakAdminException(String message) {
    super(message);
  }

  public KeycloakAdminException(String message, Throwable cause) {
    super(message, cause);
  }

  public KeycloakAdminException(Throwable cause) {
    super(cause);
  }

  public KeycloakAdminException(String message, Throwable cause,
      boolean enableSuppression, boolean writableStackTrace) {
    super(message, cause, enableSuppression, writableStackTrace);
  }
}
