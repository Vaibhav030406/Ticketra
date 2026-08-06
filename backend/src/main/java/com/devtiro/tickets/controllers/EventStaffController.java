package com.devtiro.tickets.controllers;

import static com.devtiro.tickets.util.JwtUtil.parseUserId;

import com.devtiro.tickets.domain.dtos.InviteStaffRequestDto;
import com.devtiro.tickets.domain.dtos.StaffUserResponseDto;
import com.devtiro.tickets.domain.entities.EventStaff;
import com.devtiro.tickets.services.EventStaffService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/events/{eventId}/staff")
@RequiredArgsConstructor
public class EventStaffController {

  private final EventStaffService eventStaffService;

  @PostMapping
  public ResponseEntity<Void> inviteStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId,
      @Valid @RequestBody InviteStaffRequestDto request
  ) {
    UUID organizerId = parseUserId(jwt);
    eventStaffService.inviteStaff(organizerId, eventId, request.getEmail());
    return ResponseEntity.status(HttpStatus.CREATED).build();
  }

  @GetMapping
  public ResponseEntity<List<StaffUserResponseDto>> listStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId
  ) {
    UUID organizerId = parseUserId(jwt);
    List<EventStaff> staffList = eventStaffService.listStaff(organizerId, eventId);
    List<StaffUserResponseDto> response = staffList.stream()
        .map(es -> new StaffUserResponseDto(
            es.getUser() != null ? es.getUser().getId() : es.getId(),
            es.getUser() != null ? es.getUser().getName() : es.getInvitedEmail(),
            es.getInvitedEmail()
        ))
        .toList();
    return ResponseEntity.ok(response);
  }

  @DeleteMapping(path = "/{staffUserId}")
  public ResponseEntity<Void> removeStaff(
      @AuthenticationPrincipal Jwt jwt,
      @PathVariable UUID eventId,
      @PathVariable UUID staffUserId
  ) {
    UUID organizerId = parseUserId(jwt);
    eventStaffService.removeStaff(organizerId, eventId, staffUserId);
    return ResponseEntity.noContent().build();
  }
}
