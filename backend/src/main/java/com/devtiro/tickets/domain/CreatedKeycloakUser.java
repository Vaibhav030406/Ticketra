package com.devtiro.tickets.domain;

import java.util.UUID;

public record CreatedKeycloakUser(UUID id, String temporaryPassword) {
}
