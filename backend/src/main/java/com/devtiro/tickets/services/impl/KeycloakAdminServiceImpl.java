package com.devtiro.tickets.services.impl;

import com.devtiro.tickets.domain.CreatedKeycloakUser;
import com.devtiro.tickets.exceptions.KeycloakAdminException;
import com.devtiro.tickets.exceptions.UserAlreadyExistsException;
import com.devtiro.tickets.services.KeycloakAdminService;
import java.net.URI;
import java.security.SecureRandom;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

@Service
@Slf4j
public class KeycloakAdminServiceImpl implements KeycloakAdminService {

  private static final String PASSWORD_CHARS =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%";
  private static final SecureRandom RANDOM = new SecureRandom();

  private final RestTemplate restTemplate;

  @Value("${keycloak.auth-server-url}")
  private String authServerUrl;

  @Value("${keycloak.realm}")
  private String realm;

  @Value("${keycloak.admin-client-id}")
  private String adminClientId;

  @Value("${keycloak.admin-client-secret}")
  private String adminClientSecret;

  public KeycloakAdminServiceImpl(RestTemplate restTemplate) {
    this.restTemplate = restTemplate;
  }

  @Override
  public UUID createUser(String name, String email, String password) {
    return createUserInternal(name, email, password, false);
  }

  @Override
  public CreatedKeycloakUser createInvitedUser(String name, String email) {
    String tempPassword = generateTemporaryPassword();
    UUID id = createUserInternal(name, email, tempPassword, true);
    return new CreatedKeycloakUser(id, tempPassword);
  }

  @Override
  public void assignRealmRole(UUID keycloakUserId, String roleName) {
    String adminToken = fetchAdminAccessToken();

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(adminToken);

    // Realm roles must be assigned by their full representation (id + name),
    // not just by name — fetch the role's representation first.
    String roleUrl = String.format("%s/admin/realms/%s/roles/%s", authServerUrl, realm, roleName);
    ResponseEntity<Map> roleResponse;
    try {
      roleResponse = restTemplate.exchange(
          roleUrl, HttpMethod.GET, new HttpEntity<>(headers), Map.class
      );
    } catch (RestClientException e) {
      log.warn("Could not fetch Keycloak role representation for role {}: {}", roleName, e.getMessage());
      return;
    }

    Map<String, Object> roleRepresentation = roleResponse.getBody();
    if (roleRepresentation == null) {
      log.warn("Role {} was not found in Keycloak", roleName);
      return;
    }

    headers.setContentType(MediaType.APPLICATION_JSON);
    String mappingUrl = String.format(
        "%s/admin/realms/%s/users/%s/role-mappings/realm", authServerUrl, realm, keycloakUserId
    );
    HttpEntity<List<Map<String, Object>>> mappingRequest =
        new HttpEntity<>(List.of(roleRepresentation), headers);

    try {
      restTemplate.postForEntity(mappingUrl, mappingRequest, Void.class);
    } catch (RestClientException e) {
      log.warn("Failed to assign role {} to Keycloak user {}: {}", roleName, keycloakUserId, e.getMessage());
    }
  }

  private UUID createUserInternal(String name, String email, String password, boolean temporary) {
    String adminToken = fetchAdminAccessToken();

    HttpHeaders headers = new HttpHeaders();
    headers.setBearerAuth(adminToken);
    headers.setContentType(MediaType.APPLICATION_JSON);

    Map<String, Object> credential = Map.of(
        "type", "password",
        "value", password,
        "temporary", temporary
    );

    Map<String, Object> body = Map.of(
        "username", email,
        "email", email,
        "firstName", name,
        "enabled", true,
        "emailVerified", true,
        "credentials", List.of(credential)
    );

    HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);
    String url = String.format("%s/admin/realms/%s/users", authServerUrl, realm);

    try {
      ResponseEntity<Void> response = restTemplate.postForEntity(url, request, Void.class);
      return extractUserIdFromLocationHeader(response);
    } catch (HttpClientErrorException.Conflict e) {
      throw new UserAlreadyExistsException(
          String.format("An account with email %s already exists", email)
      );
    } catch (RestClientException e) {
      log.error("Failed to create Keycloak user for email {}", email, e);
      throw new KeycloakAdminException("Unable to create account, please try again later", e);
    }
  }

  private String generateTemporaryPassword() {
    StringBuilder sb = new StringBuilder(16);
    for (int i = 0; i < 16; i++) {
      sb.append(PASSWORD_CHARS.charAt(RANDOM.nextInt(PASSWORD_CHARS.length())));
    }
    return sb.toString();
  }

  private String fetchAdminAccessToken() {
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

    MultiValueMap<String, String> form = new LinkedMultiValueMap<>();
    form.add("grant_type", "client_credentials");
    form.add("client_id", adminClientId);
    form.add("client_secret", adminClientSecret);

    String tokenUrl = String.format(
        "%s/realms/%s/protocol/openid-connect/token", authServerUrl, realm
    );

    try {
      ResponseEntity<Map> response = restTemplate.postForEntity(
          tokenUrl, new HttpEntity<>(form, headers), Map.class
      );
      Map<String, Object> tokenBody = response.getBody();
      if (tokenBody == null || tokenBody.get("access_token") == null) {
        throw new KeycloakAdminException("Keycloak did not return an admin access token");
      }
      return (String) tokenBody.get("access_token");
    } catch (RestClientException e) {
      log.error("Failed to obtain Keycloak admin access token", e);
      throw new KeycloakAdminException(
          "Unable to reach authentication service, please try again later", e
      );
    }
  }

  private UUID extractUserIdFromLocationHeader(ResponseEntity<Void> response) {
    URI location = response.getHeaders().getLocation();
    if (location == null) {
      throw new KeycloakAdminException(
          "Keycloak did not return a location for the created user"
      );
    }
    String path = location.getPath();
    String idSegment = path.substring(path.lastIndexOf('/') + 1);

    try {
      return UUID.fromString(idSegment);
    } catch (IllegalArgumentException e) {
      throw new KeycloakAdminException("Unexpected user ID format returned by Keycloak", e);
    }
  }
}
